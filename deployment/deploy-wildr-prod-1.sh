set -e

export ENV="prod"
export STACK_NAME="wildr-prod-1"
export TEMPLATE_NAME="wildr-prod-1"

echo "Uploading template $TEMPLATE_NAME to S3..."
bash ./upload-template.sh

echo "Updating $STACK_NAME stack..."
bash ./update-stack.sh
