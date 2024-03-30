import logging
import os
import numpy as np
import tensorflow as tf
import tensorflow_text
from json.decoder import JSONDecodeError
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from text_pre_process import text_process

app = FastAPI(title="Sentiment Analysis")
logger = logging.getLogger("server")


@app.on_event("startup")
async def startup_event():
    global model
    print(os.getcwd())
    print(os.listdir("model/"))
    print("startup_event")
    try:
        model = tf.keras.models.load_model('model/', compile=False)
        print(model.summary())
    except OSError:
        print("OS Error")
    return model


@app.post('/sentiment')
async def predict(request: Request):
    body = None
    try:
        body = await request.json()
    except JSONDecodeError as err:
        logger.error("Got invalid JSON req: {}".format(await request.body()))
        raise HTTPException(
            status_code=400, detail="Inavlid request, cannot parse JSON")
           
    text = text_process(body['text'])
    input = [text]
    res = model.predict(input)
    
    toxic = round(float(res[0][0]), 3)
    obscene = round(float(res[0][1]), 3)
    
    negative = max(toxic, obscene)
    positive = 1 - negative

    return {'text': text, 'confidence': {'negative': negative, 'positive': positive}}

if __name__ == "__main__":
    uvicorn.run(app, debug=False)
