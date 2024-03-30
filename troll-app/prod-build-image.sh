#!/bin/bash
set -e

export TROLL_APP_IMAGE_TAG=latest
export VERSION=$TROLL_APP_IMAGE_TAG
export AWS_REGION=us-west-2
export AWS_ECR_URL=793433463428.dkr.ecr.us-west-2.amazonaws.com/troll-app
PASSWORD=$(aws ecr get-login-password --region $AWS_REGION)
docker login $AWS_ECR_URL --username AWS --password $PASSWORD
docker buildx build --platform linux/amd64 -f Dockerfile --push -t $AWS_ECR_URL:$VERSION .
