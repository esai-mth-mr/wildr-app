#!/bin/bash
echo "Started cloudwatch-logs.sh"
set -e
WILDR_ENV_NAME=$(/opt/elasticbeanstalk/bin/get-config environment -k WILDR_ENV_NAME)
CONFIG_FILE=/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
echo "Writing to config file: $CONFIG_FILE for wildr env: $WILDR_ENV_NAME"
echo '{
          "logs": {
            "logs_collected": {
              "files": {
                "collect_list": [
                  {
                    "file_path": "/var/log/eb-docker/containers/wildr-server/info.log",
                    "log_group_name": "/'$WILDR_ENV_NAME'/wildr-server",
                    "log_stream_name": "{instance_id}"
                  },
                  {
                    "file_path": "/var/log/eb-docker/containers/wildr-worker/info.log",
                    "log_group_name": "/'$WILDR_ENV_NAME'/wildr-worker",
                    "log_stream_name": "{instance_id}"
                  },
                  {
                    "file_path": "/var/log/eb-docker/containers/troll-server/info.log",
                    "log_group_name": "/'$WILDR_ENV_NAME'/troll-server",
                    "log_stream_name": "{instance_id}"
                  }
                ]
              }
            }
          }
      }' > $CONFIG_FILE
echo "Changing permissions to 0644 for config file: $CONFIG_FILE"
chmod 0644 $CONFIG_FILE
echo "Changing owner to root for config file: $CONFIG_FILE"
chown root:root $CONFIG_FILE
echo "Finished creating config file: $CONFIG_FILE"
echo "Restarting amazon-cloudwatch-agent-ctl for config file: $CONFIG_FILE"
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c "file:$CONFIG_FILE"
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a stop
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start
echo "Finished loading $CONFIG_FILE in amazon-cloudwatch-agent"
echo "Finished cloudwatch-logs.sh"
