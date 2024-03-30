#!/bin/bash
set -e

export TROLL_SERVER_IMAGE_TAG=troll-server-v2
export VERSION=$TROLL_SERVER_IMAGE_TAG
export AWS_REGION=us-west-2
export AWS_ECR_URL=793433463428.dkr.ecr.us-west-2.amazonaws.com/dev/wildr-server
PASSWORD=$(aws ecr get-login-password --region $AWS_REGION)
docker login $AWS_ECR_URL --username AWS --password $PASSWORD
docker buildx build --platform linux/amd64 -f Dockerfile --push -t $AWS_ECR_URL:$VERSION .
