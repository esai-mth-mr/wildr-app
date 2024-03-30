from sklearn.preprocessing import MinMaxScaler
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import json
import ast


class UserEmbeddingModule:
    def __init__(self):
        self.users = pd.read_parquet("user_features.parquet")
        self.posts_vectors = pd.read_parquet('post_embedding.parquet')

        self.posts_vectors_dict = {key: val for key, val in zip(self.posts_vectors['id'], self.posts_vectors['feature_vector'])}

        self.liked_posts_list = self.users['liked_posts'].values.tolist()

        self.unique_categories = ['art', 'beauty', 'cars', 'comedy', 'cooking', 'crafts', 'dance', 'everything else', 'film', 'fashion', 'gaming',
                                  'music', 'sports', 'politics', 'tech', 'writing', 'Philosophy', 'Spirituality', 'Travel', 'Wisdom', 'Books', 'Memes',
                                  'Quotes', 'Islam', 'Hinduism', 'Buddhism', 'Judaism', 'Christianity', 'International Music', 'Lifestyle',
                                  'Nature', 'Pets', 'Food', 'Adventure', 'Fitness/Health']
        self.category_to_onehot = {cat: np.eye(len(self.unique_categories))[i] for i, cat in enumerate(self.unique_categories)}
        self.categories = pd.read_csv("Post Category Entity.csv")
        self.cat_dict = {key: val for key, val in zip(self.categories['id'], self.categories['name'])}

    def get_mean_embedding(self, item):
        try:
            if len(item) == 0:
                default_embedding = np.random.uniform(low=-1, high=1, size=56)
                return default_embedding
            user_liked_post_embeddings = [self.posts_vectors_dict[i] for i in item]
            sum_of_embeddings = np.sum(user_liked_post_embeddings, axis=0)
            num_of_liked_posts = len(user_liked_post_embeddings)
            average_embedding = sum_of_embeddings / (num_of_liked_posts + 0.01)
            return average_embedding
        except Exception as e:
            default_embedding = np.random.uniform(low=-1, high=1, size=56)

            return default_embedding

    def get_categories(self, item):
        try:
            # Step 1: Retrieve the category names from the id
            user_categories_list = [self.cat_dict[i] for i in item]

            # Step 2: Convert to string separated by '|'
            user_categories = ' | '.join(user_categories_list)

            return user_categories
        except Exception as e:
            print(e)
            return '0'

    def get_user_post_embeds(self, item):
        try:
            if len(item) == 0:
                default_embedding = np.zeros(56)
                return default_embedding
            # Step 1: Retrieve the post embeddings for all the posts liked by the user
            user__post_embeddings = [posts_vectors_dict[i] for i in item]

            # Step 2: Sum the post embedding vectors
            sum_of_embeddings = np.sum(user_liked_post_embeddings, axis=0)

            # Step 3: Divide the sum by the total number of liked posts to get the average
            num_of_liked_posts = len(user_liked_post_embeddings)
            average_embedding = sum_of_embeddings / (num_of_liked_posts + 0.01)
            return average_embedding
        except Exception as e:
            default_embedding = np.zeros(56)
            return default_embedding

    def cat_onehot(self, item):
        if len(item) == 0 or item == '0':
            return np.zeros(len(self.unique_categories))
        cat_list = item.split('|')
        onehot = np.sum([self.category_to_onehot[cat.strip()] for cat in cat_list], axis=0)
        return onehot

    def location_embed(self, item):
        if item == 'other':
            return 1
        elif item == 'west':
            return 0
        elif item == 'india':
            return 2

    # Define a function to create embeddings from the standardized columns
    def create_other_columns_embedding(self, row, column_names):
        return np.array([row[column] for column in column_names])

    def combine_embeddings(self, row):
        post_embedding = row['own_post_embeddings']
        liked_embeddings = row['liked_embeddings']
        category_embedding = row['cat_embed']
        other_columns_embedding = row['all_cols_embed']

        return np.concatenate([other_columns_embedding, category_embedding, post_embedding, liked_embeddings])

    def create_embedding(self):
        self.users['liked_embeddings'] = self.users['liked_posts'].apply(lambda x: self.get_mean_embedding(x))
        self.users['cats'] = self.users['categories'].apply(lambda x: self.get_categories(x))
        self.users['own_post_embeddings'] = self.users['user_posts'].apply(lambda x: self.get_user_post_embeds(x))
        self.users['cat_embed'] = self.users['cats'].apply(lambda x: self.cat_onehot(x))
        self.users['location'] = self.users['location'].apply(lambda x: self.location_embed(x))

        users_basic_embed = self.users[['id', 'own_post_embeddings']]
        users_liked_embed = self.users[['id', 'liked_embeddings']]
        user_cat_embed = self.users[['id', 'cat_embed']]
        users_basic = self.users[   ['id', 'score', 'post_count', 'follower_count', 'following_count', 'age_months', 'location']]

        scaler = MinMaxScaler(feature_range=(-1, 1))
        columns_to_standardize = users_basic.columns.difference(['id'])
        state_df_standardized = users_basic.copy()
        state_df_standardized[columns_to_standardize] = scaler.fit_transform(users_basic[columns_to_standardize])

        other_columns_names = ['score', 'post_count', 'follower_count', 'following_count', 'age_months', 'location']

        state_df_standardized['all_cols_embed'] = state_df_standardized.apply(self.create_other_columns_embedding, axis=1,
                                                                              args=(other_columns_names,))
        state_df_standardized.drop(['score', 'post_count', 'follower_count', 'following_count',
                                    'age_months', 'location'], axis=1, inplace=True)
        # Merge the three DataFrames using the 'id' column
        users_large_merged = pd.merge(state_df_standardized, user_cat_embed, on='id')
        users_large_merged = pd.merge(users_large_merged, users_basic_embed, on='id')
        users_large_merged = pd.merge(users_large_merged, users_liked_embed, on='id')

        # Apply the function to create a combined embedding column
        users_large_merged['combined_embedding'] = users_large_merged.apply(self.combine_embeddings, axis=1)
        # Drop the individual embedding columns
        users_large_merged = users_large_merged.drop(columns=['own_post_embeddings', 'cat_embed', 'all_cols_embed',
                                                              'liked_embeddings'], axis=1)
        users_large_merged.to_parquet("user_embedding.parquet")

        return
