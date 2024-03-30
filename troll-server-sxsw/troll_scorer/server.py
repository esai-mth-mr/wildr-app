import logging
import os
import numpy as np
import tensorflow as tf
#import tensorflow_text
from json.decoder import JSONDecodeError
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from text_pre_process import text_process
from obscenity_analysis import obscene_or_not
import re
import json
import time

app = FastAPI(title="Sentiment Analysis")
logger = logging.getLogger("server")

### 
# request: {"tweet_id": "tweet text", "tweet_id": "tweet text", "tweet_id": "tweet text", ... }
# response: {"tweet_id": {tox: 1, obs: 1, ins: 1, idn: 1}, "tweet_id": {tox: 1, obs: 1, ins: 1, idn: 1, "Flag":1}...}
### 


@app.on_event("startup")
async def startup_event():
    # global tox_ins_model
    # global identity_model
    start_time = time.time()
    global model

    print(os.getcwd())
    print(os.listdir("model/"))
    print("startup_event")
    # try:
    #     tox_ins_model = tf.keras.models.load_model('model/tox_id_ins/', compile=False)
    #     print("toxicity model loaded")
    # except Exception as e:
    #     print(e)
    #     print("Failed to load toxicity model")
    
    # try:
    #     identity_model = tf.keras.models.load_model('model/identity_binary/', compile=False)
    #     print("identity model loaded")
    # except Exception as e:
    #     print(e)
    #     print("Failed to load identity hate model")
    try:
        model = tf.keras.models.load_model('model/')
    except Exception as e:
        print(e)
        print("Failed to load the model")
    
    end_time = time.time()
    print(f"Time to load model: {end_time-start_time}")
    return model


@app.post('/sentiment')
async def predict(request: Request):
    start = time.time()
    body = None
    try:
        body = await request.json()
    except JSONDecodeError as err:
        logger.error("Got invalid JSON req: {}".format(await request.body()))
        raise HTTPException(
            status_code=400, detail="Inavlid request, cannot parse JSON")

    response = {}
    if not bool(body):
        return response
    
    pre_processed = []
    body_key_val = list(body.items())
    body_keys = [item[0] for item in body_key_val]

    for item in body_key_val:
        pre_processed.append(text_process(item[1]))
        # predictions = model.predict([text_process(body[key])])

        # toxicity = round(predictions[0].tolist()[0][0], 3)
        # insult = round(predictions[0].tolist()[0][1], 3)
        # identity_hate = round(predictions[1][0].tolist()[0], 3)
        # obscenity = round(predictions[2][0].tolist()[0], 3)

        # output_dict = {'tox': toxicity, 'insult': insult, 
        #                'identity': identity_hate, 'obscenity': obscenity}

        # response[key] = output_dict
    
    model_output = model.predict(pre_processed, verbose=0)
    
    tox_insult_list = model_output[0].tolist()
    identity_list = model_output[1].tolist()
    obscene_list = model_output[2].tolist()

    for item in zip(body_keys, tox_insult_list, identity_list, obscene_list):
        temp_dict = {'tox': round(item[1][0], 3), 'ins': round(item[1][1], 3), 
                     'idn': round(item[2][0], 3), 'obs': round(item[3][0], 3)}
        response[item[0]] = temp_dict
    end = time.time()

    print(f"Model response time for request containing {len(body_keys)} examples: {end-start}")
    return response

if __name__ == "__main__":
    uvicorn.run(app, debug=False)