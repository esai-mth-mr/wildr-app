#!/bin/bash
set -e

export TROLL_SERVER_IMAGE_TAG="troll-server"
echo "Deploy to dev started..."
cd deployment
eb deploy wildr-dev-2
cd ..
unset TROLL_SERVER_IMAGE_TAG
echo "Deploy to dev completed."

