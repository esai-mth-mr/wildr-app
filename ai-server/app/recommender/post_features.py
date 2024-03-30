import concurrent.futures
from PIL import Image
import io
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import json
import boto3
from tqdm import tqdm
import gensim
import os


class PostFeaturesModule:
    def __init__(self):
        self.s3 = boto3.client('s3')
        self.bucket_name = 'prod-recommender'
        self.folder_name = 'for-embeddings/post_features/'
        self.rekognition = boto3.client('rekognition')
        self.rekognition_bucket_name = 'prod.uploads.wildr.com'

    def webp_to_jpeg(self, webp_image_bytes):
        webp_image = Image.open(io.BytesIO(webp_image_bytes)).convert("RGB")
        jpeg_image_bytes = io.BytesIO()
        webp_image.save(jpeg_image_bytes, format='JPEG')
        jpeg_image_bytes.seek(0)
        return jpeg_image_bytes

    def get_image_labels(self, s3_key):
        image_file = io.BytesIO()
        self.s3.download_fileobj(self.rekognition_bucket_name, s3_key, image_file)
        image_file.seek(0)
        if s3_key.lower().endswith('.webp'):
            image_file = self.webp_to_jpeg(image_file.getvalue())
        response = self.rekognition.detect_labels(
            Image={
                'Bytes': image_file.read()
            },
            MaxLabels=10,
            MinConfidence=80
        )
        labels = [label['Name'] for label in response['Labels']]
        return labels

    def process_image(self, img):
        if len(img) == 0:
            return None
        else:
            path = img.split('/')[-1]
            try:
                image_labels = self.get_image_labels(path)
                return image_labels
            except Exception as e:
                print(e)
                return None

    def process_item(self, item):
        if item == '0':
            return 'none'
        else:
            item_list = item.split(',')
            output = [self.process_image(img) for img in item_list if img]
            return output

    def add_cats(self, item):
        if type(item) == list:
            try:
                to_return = ' | '.join(item[0])
            except Exception as e:
                print(e)
                to_return = str(item)
        else:
            to_return = str(item)
        return to_return

    def create_post_features(self):
        response = self.s3.list_objects_v2(Bucket=self.bucket_name, Prefix=self.folder_name)
        all_files = [file['Key'] for file in response['Contents']]

        dfs = []

        for i, file in enumerate(all_files[1:]):
            try:
                self.s3.download_file(self.bucket_name, file, f"file_{i}.parquet")
                print(f"downloaded {file}")
            except Exception as e:
                print("exception occurred")
                print(e)

            df = pd.read_parquet(f"file_{i}.parquet")
            os.remove(f"file_{i}.parquet")

            with concurrent.futures.ThreadPoolExecutor() as executor:
                df['image_labels'] = list(executor.map(self.process_item, df['image_urls']))

            df['image_labels'] = df['image_labels'].apply(self.add_cats)

            dfs.append(df)

        final_df = pd.concat(dfs, ignore_index=True)
        final_df.to_parquet('post_features.parquet')
        return
