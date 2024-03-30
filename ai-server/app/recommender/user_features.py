import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime
import json
import boto3
import os


class UserFeaturesModule:
    def __init__(self, bucket_name='prod-recommender', folder_name='for-embeddings/user_features/'):
        self.s3 = boto3.client('s3')
        self.bucket_name = bucket_name
        self.folder_name = folder_name

    def get_feed_ids(self, id_, feed_dict):
        try:
            return feed_dict[id_.replace("'", "")]
        except:
            return list()

    def count_posts(self, item):
        if pd.isna(item):
            return 0
        else:
            return json.loads(item)['postCount']
    def count_follower(self, item):
        if pd.isna(item):
            return 0
        else:
            return json.loads(item)['followerCount']
    def count_following(self, item):
        if pd.isna(item):
            return 0
        else:
            return json.loads(item)['followingCount']

    def preprocess_user_data(self):
        # Input the feed_entity file
        feed = pd.read_parquet("feed_entity.parquet")
        # List all files in the S3 bucket folder
        response = self.s3.list_objects_v2(Bucket=self.bucket_name, Prefix=self.folder_name)
        all_files = [file['Key'] for file in response['Contents']]

        # Initializing an empty list to hold dataframes
        dfs = []

        for i, file in enumerate(all_files[1:]):
            # Download the file
            try:
                self.s3.download_file(self.bucket_name, file, f"file_{i}.parquet")
            except Exception as e:
                print(e)

            # Load the file into a dataframe and append to list
            df = pd.read_parquet(f"file_{i}.parquet")
            dfs.append(df)

            # Delete the local file
            os.remove(f"file_{i}.parquet")

        # Concatenate all dataframes
        final_df = pd.concat(dfs, ignore_index=True)

        # Perform transformations
        final_df['post_count'] = final_df['stats'].apply(lambda x: self.count_posts(x))
        final_df['follower_count'] = final_df['stats'].apply(lambda x: self.count_follower(x))
        final_df['following_count'] = final_df['stats'].apply(lambda x: self.count_following(x))

        final_df.drop(['stats'], axis=1, inplace=True)

        print(final_df['created_at'][33])
        # final_df['created_at'] = pd.to_datetime(final_df['created_at'], format="%Y-%m-%d %H:%M:%f%z")
        # Add trailing zeroes to timezone offset
        final_df['created_at'] = final_df['created_at'].apply(lambda x: x if x[-3] != '+' else x + '00')
        # Convert to datetime
        final_df['created_at'] = pd.to_datetime(final_df['created_at'], format='mixed')

        final_df['month_year'] = final_df['created_at'].dt.to_period('M')

        final_df.drop(['created_at'], axis=1, inplace=True)

        # Calculate user "age" in months
        # Ensure 'joining_date' is a datetime object
        final_df['month_year'] = final_df['month_year'].dt.to_timestamp()
        current_date = datetime.now()
        final_df['age_months'] = (
                    (current_date.year - final_df['month_year'].dt.year) * 12 + current_date.month - final_df[
                'month_year'].dt.month)
        final_df.fillna('0', inplace=True)

        follower_feed_df = feed[feed['id'].apply(lambda x: x.startswith('321') or x.startswith('5:'))]
        print(follower_feed_df.columns)
        follower_feed_df['feed_ids'] = follower_feed_df['page'].apply(lambda x: json.loads(x)['ids'])
        follower_feed_dict = {key.split(':')[1]: value for key, value in
                              zip(follower_feed_df['id'], follower_feed_df['feed_ids'])}

        following_feed_df = feed[feed['id'].apply(lambda x: x.startswith('320') or x.startswith('4:'))]
        following_feed_df['feed_ids'] = following_feed_df['page'].apply(lambda x: json.loads(x)['ids'])
        following_feed_dict = {key.split(':')[1]: value for key, value in
                               zip(following_feed_df['id'], following_feed_df['feed_ids'])}

        like_feed_df = feed[feed['id'].apply(lambda x: x.startswith('342') or x.startswith('32:'))]
        like_feed_df['feed_ids'] = like_feed_df['page'].apply(lambda x: json.loads(x)['ids'])
        like_feed_dict = {key.split(':')[1]: value for key, value in zip(like_feed_df['id'], like_feed_df['feed_ids'])}

        category_feed_df = feed[feed['id'].apply(lambda x: x.startswith('401'))]
        category_feed_df['feed_ids'] = category_feed_df['page'].apply(lambda x: list(json.loads(x)['idsWithScore']['idsMap'].keys()))
        category_feed_dict = {key[4:]: value for key, value in
                              zip(category_feed_df['id'], category_feed_df['feed_ids'])}

        user_posts_feed_df = feed[feed['id'].apply(lambda x: x.startswith('131'))]
        user_posts_feed_df['feed_ids'] = user_posts_feed_df['page'].apply(lambda x: json.loads(x)['ids'])
        user_posts_feed_dict = {key[4:]: value for key, value in
                                zip(user_posts_feed_df['id'], user_posts_feed_df['feed_ids'])}

        final_df.drop(['follower_feed_id', 'following_feed_id',
                       'like_reaction_on_post_feed_id', 'post_feed_id', 'following_users_all_posts_feed_id'], axis=1,
                      inplace=True)

        final_df['followers'] = final_df['id'].apply(lambda x: self.get_feed_ids(x, follower_feed_dict))

        final_df['followings'] = final_df['id'].apply(lambda x: self.get_feed_ids(x, following_feed_dict))
        final_df['liked_posts'] = final_df['id'].apply(lambda x: self.get_feed_ids(x, like_feed_dict))
        final_df['categories'] = final_df['id'].apply(lambda x: self.get_feed_ids(x, category_feed_dict))
        final_df['user_posts'] = final_df['id'].apply(lambda x: self.get_feed_ids(x, user_posts_feed_dict))

        # Save this file locally for the embedding generation code
        final_df.to_parquet("user_features.parquet")
        return
