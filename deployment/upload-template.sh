set -e

aws s3 cp $TEMPLATE_NAME/$TEMPLATE_NAME-cloud-formation.yml s3://cf-templates-r6mlslyxjn91-us-west-2/$TEMPLATE_NAME-cloud-formation.yml
