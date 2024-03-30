# Deep Learning Instance

**NOTE:** The commands below assume the `WildrEnvName` in the CloudFormation
stack is `wildr-dev-2`. Update that accordingly for a different environment.

## Deep Learning Instance Resources
* S3 Bucket: `deep-learning.private.wildr-dev-2.dev.wildr.com`

## Managing the Deep Learning Instance
### Get the instance ID in $INSTANCE_ID: 

```shell
export INSTANCE_ID=$(aws ec2 describe-instances --filters="Name=tag:Name,Values=deep-learning-wildr-dev-2" | jq -r '.Reservations[].Instances[] | .InstanceId')
```

### Start the Instance:
```shell
aws ec2 start-instances --instance-ids $INSTANCE_ID
```

Wait for Instance to Start:
The instance state should become `running`:

```shell
watch "aws ec2 describe-instances --instance-ids $INSTANCE_ID | jq -r '.Reservations[].Instances[] | .State'"
```

### SSH to the Instance:

```shell
ssh -i ~/.ssh/wildr-eb-dev-1.key ubuntu@$INSTANCE_ID
```

### Stop the Instance after use:

```shell
aws ec2 stop-instances --instance-ids $INSTANCE_ID
```

### Wait for Instance to Stop:
The instance state should become `stopped`:

```shell
watch "aws ec2 describe-instances --instance-ids $INSTANCE_ID | jq -r '.Reservations[].Instances[] | .State'"
```
