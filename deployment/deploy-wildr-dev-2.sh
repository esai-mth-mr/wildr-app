set -e

export ENV="dev"
export STACK_NAME="wildr-dev-2"
export TEMPLATE_NAME="wildr-dev-2"

echo "Uploading template $TEMPLATE_NAME to S3..."
bash ./upload-template.sh

echo "Updating stack $STACK_NAME..."
bash ./update-stack.sh
