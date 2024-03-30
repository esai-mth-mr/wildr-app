#!/bin/bash
set -e

export TROLL_SERVER_IMAGE_TAG="troll-server"
cd deployment
eb deploy wildr-prod-1
cd ..
