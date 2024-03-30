import * as AWS from 'aws-sdk';

AWS.config.update({
  httpOptions: {
    timeout: process.env.AWS_DEFAULT_CONNECTION_TIMEOUT
      ? Number(process.env.AWS_DEFAULT_CONNECTION_TIMEOUT)
      : 10000,
  },
});
