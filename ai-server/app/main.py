from fastapi import FastAPI, Request, HTTPException
from json.decoder import JSONDecodeError
from app.recommender import user_embedding, user_features, post_embedding, post_features
import os

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/user_embedding")
def handle_user_embedding():
    module = user_embedding.UserEmbeddingModule()
    return module.create_embedding()


@app.post("/user_features")
def handle_user_features():
    module = user_features.UserFeaturesModule()
    return module.preprocess_user_data()


@app.post("/post_embedding")
def handle_post_embedding():
    module = post_embedding.PostEmbeddingsModule()
    return module.generate_post_embeddings("post_features.parquet", "post_embedding.parquet")


@app.post("/post_features")
def handle_post_features():
    module = post_features.PostFeaturesModule()
    return module.create_post_features()

if __name__ == "__main__":
    uvicorn.run(app, debug=False)