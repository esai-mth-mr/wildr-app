set -e

aws cloudformation update-stack \
  --capabilities CAPABILITY_NAMED_IAM \
  --stack-name $STACK_NAME \
  --tags "[{\"Key\":\"WildrEnv\",\"Value\":\"$ENV\"},{\"Key\":\"WildrEnvName\",\"Value\":\"$STACK_NAME\"}]" \
  --template-url https://cf-templates-r6mlslyxjn91-us-west-2.s3.us-west-2.amazonaws.com/$TEMPLATE_NAME-cloud-formation.yml \
  --parameters "$(cat $TEMPLATE_NAME/cloud-formation-parameters-$STACK_NAME.json)"
