from sklearn.preprocessing import MinMaxScaler
import pandas as pd
import string
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import nltk
from gensim.test.utils import datapath, get_tmpfile
from gensim.models.keyedvectors import KeyedVectors
from gensim.scripts.glove2word2vec import glove2word2vec
import gensim
import gensim.downloader as api
import numpy as np
import os


class PostEmbeddingsModule:
    print(os.getcwd())
    def __init__(self):
        self.glove_file = "glove.twitter.27B.50d.txt"
        self.glove_word2vec_file = "glove.twitter.27B.50d.txt"
        # glove2word2vec(self.glove_file, self.glove_word2vec_file)
        self.glove_model = KeyedVectors.load_word2vec_format(self.glove_word2vec_file)
        # self.glove_model = KeyedVectors.load_word2vec_format(self.glove_word2vec_file)
        nltk.download('punkt')
        nltk.download('stopwords')
        self.stop_words = set(stopwords.words('english'))
        self.columns_to_normalize = ['has_video', 'likes', 'shares', 'reposts', 'comments', 'global_explore']

    def preprocess_text_glove(self, text):
        tokens = word_tokenize(text.lower())
        filtered_tokens = [token for token in tokens if token not in self.stop_words and token.isalnum()]
        return filtered_tokens

    def extract_text_embedding(self, text, model):
        tokens = self.preprocess_text_glove(text)
        token_embeddings = [model[token] for token in tokens if token in model]

        if token_embeddings:
            text_embedding = np.mean(token_embeddings, axis=0)
        else:
            text_embedding = np.zeros(model.vector_size)

        return text_embedding

    def generate_post_embeddings(self, input_path, output_path):

        latest_posts = pd.read_parquet(input_path)
        latest_posts['all_text'] = latest_posts['text_data'] + ' | ' + latest_posts['image_labels']

        post_ids = latest_posts['id'].values.tolist()
        post_texts = latest_posts['all_text'].values.tolist()

        text_embeddings = {}

        for id_, text in zip(post_ids, post_texts):
            text_embeddings[id_] = self.extract_text_embedding(text, self.glove_model)

        post_embeddings_list = [{'post_id': post_id, 'embedding': embedding} for post_id, embedding in text_embeddings.items()]
        post_embeddings_df = pd.DataFrame(post_embeddings_list)
        post_embeddings_df.columns = ['id', 'embedding']

        latest_posts.fillna('0', inplace=True)
        latest_posts['has_video'] = latest_posts['video_urls'].apply(lambda x: 1 if len(x) > 1 else 0)

        scaler = MinMaxScaler(feature_range=(-1, 1))
        normalized_values = scaler.fit_transform(latest_posts[self.columns_to_normalize])
        latest_posts[self.columns_to_normalize] = normalized_values

        post_features_df = latest_posts[['id'] + self.columns_to_normalize]
        merged_df = pd.merge(post_features_df, post_embeddings_df, on='id')

        merged_df['feature_vector'] = merged_df.apply(lambda row: np.concatenate(([row[col] for col in self.columns_to_normalize], row['embedding'])), axis=1)

        merged_df.drop(columns=['embedding']+self.columns_to_normalize, inplace=True)

        merged_df.to_parquet(output_path)

        return 