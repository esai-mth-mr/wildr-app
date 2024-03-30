<p align="center">
  <a href="https://wildr.com/" target="blank"><img src="https://d1h8rem1j07piu.cloudfront.net/wildr_logo.png" width="320" alt="Wildr Logo" /></a>
</p>

# Server

[World’s first troll-free Social Network](https://wildr.com/)

# Local Environment Setup

### Setup asdf and plugins

#### Install asdf

```
brew install asdf
```

**NOTE**: Follow the instructions from brew to add asdf to your path and install
any suggested dependencies.

#### Add the plugins for asdf

```
asdf plugin add python
asdf plugin add nodejs
asdf plugin add yarn
asdf plugin add ruby
```

### Install the tools from the `app` folder

The `.tool-versions` file keeps track of versions.

```
asdf install
```

### Install yarn packages

The server NestJS and manages dependencies via yarn. From the `server` folder. Run the following:

```
yarn
```

### Install docker desktop

The services that are depended upon by the app are run with docker containers.

```
brew install --cask docker
```

### Run docker compose

To pull images for each of the services that the app depends upon and run them
as container run the following from the root directory:

```
docker compose --file docker-compose.dev.yml up --build
```

**NOTE**: if you don't want to run the services as daemons append the
`--detached` flag

### [Optional] Database

> Database setup in local environment

Install postgres

`brew install postgresql`

Start the postgres server

`brew services start postgresql`

Create the database

`psql postgres -f ./db/dev-init.sql`

### Create dev database

```
yarn db:dev:sync
```

### Create the BI database

Connect to postgres using psql:

```
psql \
   --host=localhost \
   --port=5432 \
   --username=wildr \
   --password \
```

use password `wildr` for prompt

Create database:

```
\i server/db/queries/create_bi_db.sql
```

Create schema:

```
yarn bi:db:dev:sync
```

### Populate the database with post categories

```
yarn populate-post-categories
```

### Start the server from the `server` folder

```
yarn start:dev
```

this will start the server on port 4000. You should then be able to reach the
graphql api at [here](http://localhost:4000/graphql).

### Sync the database (After starting the server)

```
yarn db:dev:sync
```

### Add Open Search V1 Indexes

With the server running.

```
yarn opensearch:create-mappings
```

(There are other useful scripts in the `/scripts/open-search` folder)

### Add Open Search V2 Indexes

To set up indexes in open search you can use the request re-index script while
admin is running. You will need to run the script with each of the current
`indexVersionName`s. As of the writing of this doc they we are using
`post_search_v1` and `user_search_v1`.

```
npx ts-node scripts/testing/open-search-v2/request-re-index.ts
```

You should now be ready to write code! 🎉

### Development

Code format is enforced on the server using [prettier](https://prettier.io/) and
[eslint](https://eslint.org/). You will probably want to have the
extensions/plugins for each added to your IDE. Unit tests are executed using
[jest](https://jestjs.io/) with `yarn test`. There are also extensions that
facilitate test runs.

To ensure that a commit will pass the CI tests and build, run `yarn server:build` and
`yarn code:lint` before making a commit.

# Useful Commands

## Trigger the queue

```
aws --endpoint-url http://localhost:9324 sqs send-message --queue-url http://localhost:9324/queue/{queue_name} --message-body "Hello, queue"
```

## Sync the database

Sync the database with the latest schema. This will drop all tables and recreate
them.

```
yarn db:dev:sync
```

## Database Cleanup

```
yarn db:dev:drop
```

# AWS EB Pre-requisite Setup Steps

Reference Article: <https://tsh.io/blog/deploy-node-app-to-aws-using-beanstalk/>

## (A) Setup EB (Only Required when creating a new EB Envionrment)

1. Initialize EB (one-time only)

```shell
eb init -p docker test-001
```

## (B) Install Pre-requisite tools

1. Install Docker

Ensure that `buildx` is enabled:
See <https://blog.jaimyn.dev/how-to-build-multi-architecture-docker-images-on-an-m1-mac/>

```
docker buildx create --use
```

1. Install python 3.9.1 via asdf

```
asdf plugin-add python
asdf install python 3.9.1
```

```shell

brew install awscli awsebcli

```

# Creating a new EB Environment

This is only required when a new environment needs to be setup.

1. Create the dev environment on eb (one-time)

NOTE: Do not have a `.env` file in the `deployment` folder next to
`docker-compose.yml`. This file will be generated eb elastic beanstalk with RDS
variables.

```shell
cd deployment
export DB_PASSWORD=$(aws secretsmanager get-random-password --password-length 63 --require-each-included-type --exclude-characters '/"@' --output text)
eb create dev-001 -i t3.small -db -k id_rsa -db.engine postgres -db.user hummingbird -db.pass $DB_PASSWORD
```

# Deployment

## Build A Docker Server Image

1. On Apple M1 architecture

```shell
export AWS_REGION=us-west-2
export AWS_ECR_URL=793433463428.dkr.ecr.us-west-2.amazonaws.com/dev/wildr-server
```

Set this to `latest` or `staging` if creating image for dev or staging respectively

```shell
export AWS_ECR_URL=793433463428.dkr.ecr.us-west-2.amazonaws.com/dev/wildr-server/
```

Run the `aws ecr get-login-password command`. Specify the registry URI you want to authenticate to.

```shell
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ECR_URL
```

Build using `buildx`

```shell
docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile --push -t $AWS_ECR_URL:$VERSION .
cd deployment
```

### Note: The above command is for Apple M1. Since the architecture is different than EC2's linux/amd64. Use the following instead when on an intel x86_64 architecture

```
docker build -t $AWS_ECR_URL:$VERSION -f Dockerfile .
docker push $AWS_ECR_URL:$VERSION
```

## Steps to Deploy

### (A) Build and deploy the new image to dev

1. Build an image with `latest` version by following steps in [Build Server Image](#build-a-docker-server-image)
2. Deploy the new image to the dev environment

```shell
cd deployment
eb deploy 002-dev-wildr-server
```

### (B) Sync the dev database

If the schema has changed, sync the schema on the server (**NOT for staging or prod**,only for `dev` environments)

### 1. SSH to the development server

@Deprecated

```shell
eb ssh 002-dev-wildr-server
```

New

```shell
ssh -i ~/.ssh/wildr-eb-dev-1.key ec2-user@i-099c5b3750b71a92f
```

### 2. Change directory to container directory

```shell
cd /var/app/current
```

### 3. Get the Container ID of the running container

```shell
CONTAINER_ID=$(sudo docker ps --format "{{.ID}}" | head -n1)
```

### 4. Attach to the container

```shell
sudo docker exec -it $CONTAINER_ID sh
```

### 6. Sync the dev db

```shell
yarn db:dev:sync
```

### 7. Exit out of the container

```shell
exit
```

### 8. Check the logs to see that server has started

```shell
  less -R /var/log/eb-docker/containers/eb-current-app/eb-stdouterr.log
```

# Migrations

### INSIDE DOCKER CONTAINER

1. Create Migration, on old Codebase
2. Run migration on EB
3. Merge new code

### Create

```
ts-node -r ./tsconfig-paths-bootstrap.js ./node_modules/typeorm/cli.js migration:create -n <<name>> --config ./db/typeormconfig
```

### For AWS

Run: `yarn migration:prod:run`

Show: `yarn migration:prod:show`

### For local

Run: `yarn migration:run`

Show: `yarn migration:show`

# SQS

## STEP 1

Create SQS queue

- Choose `standard`
- Naming convention = `wildr-{ENV}-1-{NAME}-{OF}-{QUEUE}`

Configuration:

`Receive message wait time` = 20 seconds

Access Policy:

Choose `Basic`:

Under “Define who can send messages to the queue”

Choose -> **Only the specified AWS accounts, IAM users and roles** and use -> `arn:aws:iam::793433463428:role/aws-elasticbeanstalk-ec2-role`

Under Define who can receive messages from the queue

Choose -> **Only the specified AWS accounts, IAM users and roles** and use -> `arn:aws:iam::793433463428:role/aws-elasticbeanstalk-ec2-role`

[Next]

#### Add tags

`WildrEnvName`
`WildrEnv`

## STEP 2

### EventBridge

Add a Rule in **EventBridge**

Use the same name as name of the SQS queue

Rule Type -> `Schedule`

Schedule Pattern -> `A schedule that runs at a regular rate, such as every 10 minutes`. [Second option]

[Next]

`Target 1`

- AWS SQS
- Queue: Choose your SQS queue that you just created

No additional settings

[Next]

Add Tags

[DONE]

# SQS Misc-Queue

JSON Formats

Jobs:

- SEND_EMAILS
- UPDATE_INVITE_COUNT
- PREPARE_POST_AND_INTERESTS_FEEDS
- MOVE_PROFILE_POSTS_TO_NEW_FEEDS
- PREPARE_INITIAL_FEEDS
- MOVE_UNANNOTATED_POSTS_TO_ANNOTATION_PENDING_FEED
- MOVE_CONSUMED_TO_EXPLORE
- RE_INDEX_SEARCH_ALL_USERS
- CREATE_INNER_CIRCLE_LIST
- CREATE_AND_FILL_PROPERTY_MAP

Example
SEND_EMAILS

```
{
  "jobId": "SEND_EMAILS",
  "data": {
    "emails": [
      "daksh@wildr.com",
      "vidit@wildr.com",
      "yash@wildr.com"
    ]
  }
}
```

UPDATE_INVITE_COUNT

```
{
  "jobId": "UPDATE_INVITE_COUNT",
  "data": { "count": 10,  "handles": [ "tirtha_majumdar" ] }
}
```

Local:

```
aws --endpoint-url http://localhost:9324 sqs send-message --queue-url http://localhost:9324/queue/queue-misc --message-body "{}"
```

Example

With Data

```
aws --endpoint-url http://localhost:9324 sqs send-message --queue-url http://localhost:9324/queue/queue-misc --message-body '{"jobId":"UPDATE_INVITE_COUNT", "data": { "count": 10,  "handles": [ "tirtha_majumdar" ] }}'
```

Just job

```
aws --endpoint-url http://localhost:9324 sqs send-message --queue-url http://localhost:9324/queue/queue-misc --message-body '{"jobId":"CREATE_INNER_CIRCLE_LIST"}'
```

# Configuring SQS Queue Locally

1. Add the queue to the `elasticmq.local.conf` file

2. Add the queue name and queue url environment variables to the `.env` file

# Misc

Update REAL ID data for all the accounts on local

```
UPDATE user_entity
SET real_id_verification_status = 3,
    real_id_verified_at = NOW(),
    real_id_face_url = 'https://placehold.co/600x400.png',
    face_data = '[]'
WHERE id IS NOT NULL;
```

# Banners

## Creating a Banner

1. Upload an asset to the public wildr s3 bucket in the desired env

2. Use the `create-banner` script to create the banner. You can use the `acl`
   in the banner settings as an allow list while the banner is in `test` state.
   It's recommended that banners are created in `test` state and then moved to
   `enabled` state when they are ready to be displayed. The test state will
   continue to show the banner, defying skipping and hiding logic, until it is
   moved to `enabled` state.

3. If this banner relates to a specific user action. The banner should be added
   to the action's banner id list in the `/banner` ssm param for each env. For
   example, wildr coin waitlist banners should be added to the
   `WILDR_COIN_WAITLIST_BANNER_IDS` list. This is how the system know which
   banners should be marked as completed when a user completes an action. If a
   banner is added to the list after a user has completed the action, the banner
   will continue to show for that user until they complete the action again.
   (in the future we should make completions based on actions instead of banner
   ids to avoid the potential for this issue).

4. After testing the banner, move it to `enabled` state. This will make it
   visible to all users.
