#!/bin/bash
set -e

export VERSION=${VERSION:-latest}
echo $VERSION
export AWS_REGION=us-west-2
export AWS_ECR_URL=793433463428.dkr.ecr.us-west-2.amazonaws.com/dev/wildr-server
PASSWORD=$(aws ecr get-login-password --region $AWS_REGION)
docker login $AWS_ECR_URL --username AWS --password $PASSWORD
echo "Building image version: $VERSION..."
docker build -t $AWS_ECR_URL:$VERSION -f Dockerfile .
docker push $AWS_ECR_URL:$VERSION