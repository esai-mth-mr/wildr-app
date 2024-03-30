## Create a new dev stack

1. Create a new `cloud-formation-parameters-wildr-dev-2.json` with the name of the new stack.
2. Replace 'wildr-dev-2' with the name of the new stack

Create dev 
```shell
export STACK_NAME=<new stack name>
aws cloudformation create-stack --stack-name $STACK_NAME --tags '[{"Key":"WildrEnv","Value":"dev"},{"Key":"WildrEnvName","Value":"'$STACK_NAME'"}]' --template-url https://cf-templates-r6mlslyxjn91-us-west-2.s3.us-west-2.amazonaws.com/dev-cloud-formation.yml --parameters "$(cat cloud-formation-parameters-$STACK_NAME.json)"
```

Install Linter
```
brew install cfn-lint
```


# DEV
Run Linter
```shell
cfn-lint dev-cloud-formation.yml
```
Upload to s3 DEV
```shell
aws s3 cp dev-cloud-formation.yml s3://cf-templates-r6mlslyxjn91-us-west-2/
```

Update Stack DEV
```shell
aws cloudformation update-stack --capabilities CAPABILITY_NAMED_IAM --stack-name wildr-dev-2 --tags '[{"Key":"WildrEnv","Value":"dev"},{"Key":"WildrEnvName","Value":"wildr-dev-2"}]' --template-url https://cf-templates-r6mlslyxjn91-us-west-2.s3.us-west-2.amazonaws.com/dev-cloud-formation.yml --parameters "$(cat cloud-formation-parameters-wildr-dev-2.json)"
```

Watch DEV
```shell
 watch "aws cloudformation describe-stacks --stack-name wildr-dev-2 | jq '.Stacks[0].StackStatus'"    
```
# PROD
Run Linter
```shell
cfn-lint prod-cloud-formation.yml
```
Upload to s3 PROD
```shell
aws s3 cp prod-cloud-formation.yml s3://cf-templates-r6mlslyxjn91-us-west-2/
```


Update Stack PROD
```shell
aws cloudformation update-stack --capabilities CAPABILITY_NAMED_IAM --stack-name wildr-prod-1 --tags '[{"Key":"WildrEnv","Value":"prod"},{"Key":"WildrEnvName","Value":"wildr-prod-1"}]' --template-url https://cf-templates-r6mlslyxjn91-us-west-2.s3.us-west-2.amazonaws.com/prod-cloud-formation.yml --parameters "$(cat cloud-formation-parameters-wildr-prod-1.json)"
```
Watch PROD
```shell
 watch "aws cloudformation describe-stacks --stack-name wildr-prod-1 | jq '.Stacks[0].StackStatus'"    
```


## Delete a stack
```
export STACK_NAME=<name of stack>
aws cloudformation delete-stack --stack-name $STACK_NAME
```

## Manual Changes After Creating a Stack
**Note:** Currently, the secrets stored in parameter store including bucket name and cloudformation params need to be updated by hand. These should be moved out of that config to avoid this.

