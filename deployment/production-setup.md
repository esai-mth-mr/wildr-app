# Wildr: Creating a production-ready environment

# Checklist

- [ ] Define the default tags (pick one value for env)
  - WildrEnv: `dev | staging | prod | test`
  - WildrEnvName: `wildr-<name of the env>-<sequence>` (eg: wildr-dev-1)
- [ ] [Create a keypair](#create-a-keypair)
- [ ] [Create a public-private VPC and Subnets](#create-a-public-private-vpc-and-subnets)
- [ ] [Create Security Groups](#create-security-groups)
- [ ] [Create an RDS instance](#create-an-rds-instance)
- [ ] [Create OpenSearch Cluster](#create-opensearch-cluster)
- [ ] [Create ElastiCache Cluster](#create-elasticache-cluster)
- [ ] [Create S3 Upload Bucket](#create-s3-upload-bucket)
- [ ] [Create Beanstalk Environment](#create-beanstalk-environment)
- [ ] [Update LB Security Rules](update-lb-security-rules)
- [ ] [Setup Session Manager for SSH](#setup-session-manager-for-ssh)

## Create a keypair

- [ ] Create keypair on AWS console

```
aws ec2 create-key-pair --dry-run --key-name wildr-eb-keypair-dev-1 --key-type rsa --tag-specifications ResourceType=key-pair,Tags=[{WildrEnv,dev},{WildrEnvName,wildr-dev-1}] > /tmp/new-key.pem
```

- [ ] Store the private key under `~/.ssh/wildr-eb-<env name>.key` (eg: wildr-eb-dev-1.key)
- [ ] `chmod 600 ~/.ssh/wildr-eb-<env name>.key`
- [ ] `ssh-add ~/.ssh/wildr-eb-<env name>.key`

## Create a public-private VPC and Subnets

- [ ] Create an elastic ip in EC2 and name it `elastic-ip-<env>`. Also add `WildrEnv` and `WidlrEnvName` tags.
- [ ] Create a VPC via the [VPC Wizard](https://us-west-2.console.aws.amazon.com/vpc/home?region=us-west-2#)
      _ Region: us-west-2
      _ Name: vpc-<env>: eg: vpc-test-1 \* Public Subnet and Private Subnet: See section below on how we will create the subnets. Pick only 1 public subnet and 1 private subnet (from us-west-2a availability zone)
      _Load balancer and EC2 instances must be in the same AZ - chose same AZ from the list_

### Creating Subnets

We will be creating a total of _9 subnets_. 2 of those will be part of the _VPC Wizard_ (above) and then the remaining separately from the 'Subnets' option under 'VPC'.

**NOTE:** Replace `<env-name>` for the subnet group names with the name of the beanstalk environment, example `dev-1`

#### Subnet Scheme

    The following is how `10.0.0.0/16` will be divided into 9 subnets across 3 availability zones (us-west2a, us-west2b, us-west2c) in the us-west-2 region

```
10.0.0.0/16 - CIDR Block
    10.0.0.0/18 - Subnets for AZ us-west-2a
        10.0.0.0/19 - sub-test-1-usw2a-pri (subnet 1)
        10.0.32.0/19
            10.0.32.0/20 - sub-<env-name>-usw2a-pub (subnet 2)
            10.0.48.0/20 - sub-<env-name>-usw2a-spr (subnet 3)

    10.0.64.0/18 - Subnets for AZ us-west-2b
        10.0.64.0/19 - sub-<env-name>-usw2b-pri (subnet 4)
        10.0.96.0/19
            10.0.96.0/20 - sub-<env-name>-usw2b-pub (subnet 5)
            10.0.112.0/20 - sub-<env-name>-usw2b-spr (subnet 6)

    10.0.128.0/18 - Subnets for AZ us-west-2c
        10.0.128.0/19 - sub-<env-name>-usw2c-pri (subnet 7)
        10.0.160.0/19
            10.0.160.0/20 - sub-<env-name>-usw2c-pub (subnet 8)
            10.0.176.0/20 - sub-<env-name>-usw2c-spr (subnet 9)
    10.0.192.0/18 - sub-test-1-usw2d-spr
```

- **IMPORTANT**: The wizard will allow creating only 1 private subnet and 1 public subnet. Use the first public and private subnet from the setup below (sub-<env name>-usw2a-pub, sub-<env-name>-usw2a-pri respectively).
* [ ] **IMPORTANT:**  Update **Route Table** associated with the _public_ subnet groups not created via the Wizard. Destination `0.0.0.0/0` should point to the same Internet Gateway for the first public subnet created by the VPC wizard.
* [ ] Create a db subnet group [subgrp-test-1-rds-usw2](https://us-west-2.console.aws.amazon.com/rds/home?region=us-west-2#db-subnet-group:id=subgrp-test-1-rds-usw2)
      RDS subnet for VPC test-1 with sub-test-1-usw2a-pri, sub-test-1-usw2b-pri, sub-test-1-usw2c-pri

## Create Security Groups

**NOTE:** First create all the security groups with inbound rules. Then update them with the outbound rules:

- [ ] LB Security group `secgrp-<env name>-lb`
  - Inbound: HTTP and HTTPS from All IPv4
  - Outbound: HTTP to `secgrp-<env-name>-srv`
- [ ] Service security group `secgrp-<env name>-srv`
  - Inbound: HTTP and HTTPS from `secgrp-<env name>-lb`
  - Outbound: ALL TCP to 0.0.0.0/0
- [ ] Db security group `secgrp-<env name>-db`
  - Inbound: 5432 from `secgrp-<env name>-srv`
  - Outbound: ALL TCP to 0.0.0.0/0
- [ ] ElastiCache security group `secgrp-<env name>-cache`
  - Inbound: TCP 3679 from `secgrp-<env name>-srv`
  - Outbound: ALL TCP to 0.0.0.0/0
- [ ] OpenSearch security group `secgrp-<env name>-search`
  - Inbound: HTTPS from `secgrp-<env name>-srv`
  - Outbound: ALL TCP to 0.0.0.0/0

## Create an RDS instance

- [ ] Generate a DB password locally and store in AWS Secrets Manager

```shell
export DB_PASSWORD=$(aws secretsmanager get-random-password --password-length 64 --require-each-included-type --exclude-characters ",/@'\"#\$" --output text)
```

- [ ] RDS Console -> Create Database
  - instance identifier: `db-<env-name>`
  - Method: Standard
  - Engine Options: Postgres
  - Templates: Production
  - Username: wildr
  - Password: _from above_
  - Enable access via password and IAM
  - DB Instance: _TODO: Neet to figure out best for prod_. For dev/staging - use t3.micro with 20GB SSD.
  - Availability & durability -> Create a standby instance
  - Connectivity -> VPC -> <one created earlier>
  - Connectivity -> Public Access -> No
  - VPC Security Group -> Create New -> _Private Subnets from above_
  - Additional Configuration -> Encryption -> Enable Encryption
  - Additional Configuration -> Initial Database Name -> Specify the database name `wildr` (otherwise will need to create db manually via `[ec2-user@ip-10-0-27-26 current]$ psql postgres -U $RDS_USERNAME -h $RDS_HOSTNAME -c 'create database wildr;'`
- [ ] Enable backup
- [ ] Enable termination protection
- [ ] Store db username and password in AWS Secrets Manager
- [ ] Force SSL connections [Using SSL with a PostgreSQL DB instance - Amazon Relational Database Service(https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.SSL.html)

## Create OpenSearch Cluster

- [ ] Create a OpenSearch Security Group
  - Enable ingress from beanstalk auto scaler only
  - Egress to ntp 123
- [ ] Use beanstalk ec2 user as IAM Master user for OpenSearch
- [ ] Create cluster
  - Master username: wildr-<env> (eg: `wildr-dev-1`)
  - Password: Generate a new one same as `$DB_PASSWORD` above
  - Domain Name: wildr-<env-name> (eg: `wildr-dev-1`)
    **TODO**: Figure out fine grained all policy and signing

## Create ElastiCache Cluster

- [ ] Create elasticache cluster (use elasticache security group)
      **NOTE:** Do **NOT** enable _Cluster Mode_.
  - Name: cache-<env>
  - Security Group: Select the cache security group instead of default: `secgrp-<env>-cache`, eg: `secgrp-dev-1-cache`.
  - Subnet Group: subgrp-<env>-<use-case: worker|cache> (eg: `subgrp-dev-1-worker` or `subgrp-dev-1-cache`). Select all private subnets for the VPC.
  - Availability Zone: No preference
  - Engine version compatibility: 6.2

## Create S3 Upload Bucket

- [ ] Create bucket and encrypt for production one
  - Name `<env>.uploads.wildr.com`
  - Set the Security permissions:
    - Access: Objects can be public
    - Block public access: off
    - Object Ownership: ACLs Enabled with Object Ownership set to `Object writer`.
  - Add the bucket to the `S3DevUploadsPolicyForBeanstalk` (dev) or `S3StagingUploadsPolicyForBeanstalk` or `S3ProdUploadsPolicyForBeanstalk` (prod) IAM policy depending on the environment.

## Create Beanstalk Environment

- [x] [**Skip step, this is already done**] Create `01-ssh-restriction.config` with:

```
# Prevent ssh by default
option_settings:
  aws:autoscaling:launchconfiguration:
    SSHSourceRestriction: 'tcp, 22, 22, 127.0.0.1/32'
```

- [x] [**Skip step, this is already done**] Create an SSL Certificate
- [x] [**Skip step, this is already done**] Add a config `.ebextensions/securelistener-clb.config`

```yaml
option_settings:
  aws:elb:listener:443:
    SSLCertificateId: <<SSL Cert ARN>
    ListenerProtocol: HTTPS
    InstancePort: 80
```

- [x] [**Skip step, this is already done**] Redirect port 80 on load balancer listener to 443
- [ ] Set the environment variables (get RDS\_ params from RDS console)

```shell
export WILDR_SHARED_KEY=<name of shared key without .key suffix, ex: wildr-eb-dev-1>
export RDS_HOSTNAME=<from RDS console>
export RDS_PORT=<from RDS console>
export RDS_DB_NAME=<from RDS console>
export RDS_USERNAME=<from RDS console>
export RDS_PASSWORD=<from RDS console>
export ELB_SUBNETS=<comma separated list of public subnet ids>
export EC2_SUBNETS=<comma separated list of private subnet ids>
export EC2_SECURITY_GROUPS=<web security group eg: sg-072bd86ed5b501e91>
export WILDR_ENV_NAME=<env name>
export ES_PASSWORD=<opensearch password>
export ES_MASTER=<es master>
export ES_ENDPOINT=<es endpoint>
export SERVER_HTTP_PORT=<eg: 80>
export SERVER_HTTP_HOST=<env.api.wildr.com, eg: dev.api.wildr.com>
export ELASTICACHE_ENDPOINT=<worker.5ro8qo.clustercfg.usw2.cache.amazonaws.com>
export CONTAINER_IMAGE_TAG=latest
export VPC_ID=<vpc id>
export TAGS="WildrEnv=test,WildrEnvName=$WILDR_ENV_NAME"
export FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
export FIREBASE_CLIENTX509_CERT_URL=<from Firebase account for the environment, eg: https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-9y3wk%40wildr-dev.iam.gserviceaccount.com
export FIREBASE_CLIENT_EMAIL=<email for Firebase service account, eg: firebase-adminsdk-9y3wk@wildr-dev.iam.gserviceaccount.com>
export FIREBASE_CLIENT_ID=<client ID when creating a key for firebase service accoung, eg: 113680444060653999167>
export FIREBASE_PRIVATE_KEY=<private key without escaping \n, use the echo command and copy-paste the private key>
export FIREBASE_PRIVATE_KEY_ID=<private key id>
export FIREBASE_PROJECT_ID=<firebase project id, eg: wildr-dev>
export FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
export FIREBASE_TYPE=service_account
export UPLOAD_CLIENT=s3
export AWS_S3_UPLOAD_BUCKET_NAME=<env-name>.uploads.wildr.com eg: dev-1.uploads.wildr.com>
AWS_REGION=us-west-2
```

- Run the following command

```shell
eb create $WILDR_ENV_NAME -k $WILDR_SHARED_KEY -i t3.small --envvars "RDS_HOSTNAME=$RDS_HOSTNAME,RDS_PORT=$RDS_PORT,RDS_DB_NAME=$RDS_DB_NAME,RDS_USERNAME=$RDS_USERNAME,RDS_PASSWORD=$RDS_PASSWORD,ES_PASSWORD=$ES_PASSWORD,ES_MASTER=$ES_MASTER,UPLOAD_CLIENT=$UPLOAD_CLIENT,AWS_REGION=$AWS_REGION,AWS_S3_UPLOAD_BUCKET_NAME=$AWS_S3_UPLOAD_BUCKET_NAME,CONTAINER_IMAGE_TAG=$CONTAINER_IMAGE_TAG,ES_ENDPOINT=$ES_ENDPOINT,SERVER_HTTP_HOST=$SERVER_HTTP_HOST,WORKER_ELASTIC_CACHE_ENDPOINT=$ELASTICACHE_ENDPOINT,FIREBASE_AUTH_PROVIDER_X509_CERT_URL=$FIREBASE_AUTH_PROVIDER_X509_CERT_URL,FIREBASE_CLIENTX509_CERT_URL=$FIREBASE_CLIENTX509_CERT_URL,FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL,FIREBASE_CLIENT_ID=$FIREBASE_CLIENT_ID,FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY,FIREBASE_PRIVATE_KEY_ID=$FIREBASE_PRIVATE_KEY_ID,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,FIREBASE_TOKEN_URI=$FIREBASE_TOKEN_URI,FIREBASE_TYPE=$FIREBASE_TYPE" --platform docker --region us-west-2 --tags $TAGS --vpc.id $VPC_ID --vpc.ec2subnets $EC2_SUBNETS --vpc.elbsubnets $ELB_SUBNETS --elb-type application --vpc.securitygroups $EC2_SECURITY_GROUPS --vpc.elbpublic
```

- [ ] Update the `FIREBASE_PRIVATE_KEY` key in the Beanstalk console with new-lines un-escaped (for example use echo to print newlines and copy it)
- [ ] Update the Route 53 DNS record for the environment to point to the new Beanstalk instance
- [ ] Encrypt the log and source code bucket and block public access

* On S3, set the following options for `elasticbeanstalk-/region-account-id/`
  - S3 Console -> <bucket> -> Properties -> Default Encryption -> Server Side -> Enable
  - S3 Console -> <bucket> -> Properties -> Default Encryption -> Encryption key type -> Amazon S3 key (SSE-S3)
  - S3 Console -> <bucket> -> Permissinos -> Block Public Access
  - S3 Console -> **Block Public Access settings for this account**

## [*NOT REQUIRED, ALREADY DONE FOR ALL ENVIRONMENTS*] Update LB Security Rules

- [ ] Create a SSL certificate with [AWS Certificate Manager - Amazon Web Services (AWS)](https://aws.amazon.com/certificate-manager/)
- [ ]

* Recommended ones [Security groups for your Application Load Balancer - Elastic Load Balancing](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-update-security-groups.html)

## Setup Session Manager for SSH

- [ ] Install `sessino-manager-plugin` locally

```shell
brew install session-manager-plugin
```

- [ ] Add the following to `.ssh/config`

```shell
# SSH over Session Manager
host i-* mi-*
    ProxyCommand sh -c "aws ssm start-session --target %h --document-name
    AWS-StartSSHSession --parameters 'portNumber=%p'"
```

Now, ssh using the instance id and PEM key used to create the environment:

```shell
ssh -i ~/.ssh/id_rsa ec2-user@i-0e47ca7d52f7f0840
```

## Reference Links

- [Example: Launching an Elastic Beanstalk in a VPC with Amazon RDS - AWS Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/vpc-rds.html)
- [AWS Systems Manager Session Manager: bye bye bastion hosts! – pipetail Blog](https://blog.pipetail.io/posts/2020-02-24-amazon-ssm-session-manager/)
