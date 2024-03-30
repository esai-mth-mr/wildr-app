set -e
watch "aws cloudformation describe-stacks --stack-name $STACK_NAME | jq '.Stacks[0].StackStatus'"
