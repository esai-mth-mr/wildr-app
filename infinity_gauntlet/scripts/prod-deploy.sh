yarn build:prod

aws s3 cp ./dist/ s3://wildr-prod-1.admin.prod.wildr.com --recursive
