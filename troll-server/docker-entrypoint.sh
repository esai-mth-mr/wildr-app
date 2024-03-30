#!/bin/sh

set -e


#activating virtual environment
. ./.venv/bin/activate

TROLL_SERVER_LOCALHOST="${TROLL_SERVER_LOCALHOST:-0.0.0.0}"
TROLL_SERVER_PORT="${TROLL_SERVER_PORT:-7070}"
TROLL_SERVER_WORKER_COUNT="${TROLL_SERVER_WORKER_COUNT:-1}"
TROLL_SERVER_WORKER_TIMEOUT="${TROLL_SERVER_WORKER_TIMEOUT:-60}"
echo "Model download $TROLL_SERVER_MODEL_S3_PATH started..."
aws s3 cp --quiet --recursive $TROLL_SERVER_MODEL_S3_PATH ./model
echo "Model download $TROLL_SERVER_MODEL_S3_PATH finished"
echo "Starting gunicorn at $TROLL_SERVER_LOCALHOST:$TROLL_SERVER_PORT with worker count: $TROLL_SERVER_WORKER_COUNT"
exec gunicorn \
    --access-logfile - \
    --log-config logging.ini \
    --bind $TROLL_SERVER_LOCALHOST:$TROLL_SERVER_PORT \
    --forwarded-allow-ips='*' wsgi:app \
    --workers="$TROLL_SERVER_WORKER_COUNT" \
    -t $TROLL_SERVER_WORKER_TIMEOUT \
    -k uvicorn.workers.UvicornWorker
