#!/bin/bash
set -e

AWS_REGION=us-west-2
AWS_ECR_URL=793433463428.dkr.ecr.us-west-2.amazonaws.com
PASSWORD=$(aws ecr get-login-password --region $AWS_REGION)

docker login $AWS_ECR_URL --username AWS --password $PASSWORD

echo pulling image $1

docker pull $AWS_ECR_URL/wildr-server:$1

echo adding tag to image $2

docker tag $AWS_ECR_URL/wildr-server:$1 $AWS_ECR_URL/dev/wildr-server:$2

docker push $AWS_ECR_URL/dev/wildr-server:$2
