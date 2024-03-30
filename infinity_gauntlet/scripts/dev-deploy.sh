yarn build:prod

aws s3 cp ./dist/ s3://wildr-dev-2.admin.dev.wildr.com --recursive
