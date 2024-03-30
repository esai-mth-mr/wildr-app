set -e

aws cloudformation delete-stack \
  --stack-name $STACK_NAME
