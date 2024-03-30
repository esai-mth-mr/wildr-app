#!/bin/sh

set -e


#activating virtual environment
. ./.venv/bin/activate

TROLL_SERVER_LOCALHOST="${TROLL_SERVER_LOCALHOST:-0.0.0.0}"
TROLL_SERVER_PORT="${TROLL_SERVER_PORT:-7070}"
TROLL_SERVER_WORKER_COUNT="${TROLL_SERVER_WORKER_COUNT:-1}"
TROLL_SERVER_TIMEOUT="${TROLL_SERVER_TIMEOUT:-120}"
# echo "Model download $TROLL_SERVER_MODEL_S3_PATH started..."
echo "model download started"
aws s3 cp --quiet --recursive s3://troll-server-sxsw-models.wildr-dev-2.dev.wildr.com/tox_ins_iden_obsc/ ./model
echo "model download completed"
# # aws s3 cp --quiet --recursive $TROLL_SERVER_MODEL_S3_PATH ./model/toxicity_binary
# echo "Model 1 download started"
# aws s3 cp --quiet --recursive s3://troll-server-sxsw-models.wildr-dev-2.dev.wildr.com/identity_hate_binary/ ./model/identity_binary
# echo "Model 1 download done"
# aws s3 cp --quiet --recursive s3://troll-server-sxsw-models.wildr-dev-2.dev.wildr.com/tox_id_ins/ ./model/tox_id_ins
# echo "Model 2 download done"
# echo "Model download $TROLL_SERVER_MODEL_S3_PATH finished"
echo "Starting gunicorn at $TROLL_SERVER_LOCALHOST:$TROLL_SERVER_PORT with worker count: $TROLL_SERVER_WORKER_COUNT"
exec gunicorn \
    --access-logfile - \
    --log-config logging.ini \
    --timeout $TROLL_SERVER_TIMEOUT \
    --bind $TROLL_SERVER_LOCALHOST:$TROLL_SERVER_PORT \
    --forwarded-allow-ips='*' wsgi:app \
    --workers="$TROLL_SERVER_WORKER_COUNT" \
    -k uvicorn.workers.UvicornWorker
