import { SQS } from 'aws-sdk';

const queueUrl = 'http://localhost:9324/queue/queue-indexing-aggregator-cron';

async function sendMessage() {
  // Set up AWS SDK configuration for local development
  const sqs = new SQS({
    endpoint: 'http://localhost:9324',
    region: 'us-west-2', // Replace with your desired region
  });

  // Create the message parameters
  const messageParams: SQS.SendMessageRequest = {
    MessageBody: JSON.stringify({
      entityName: 'PostEntity',
      jobType: 0, // IndexingJobType.RE_INDEX
    }),
    QueueUrl: queueUrl,
  };

  try {
    // Send the message to the SQS queue
    const result = await sqs.sendMessage(messageParams).promise();
    console.log('Message sent:', result.MessageId);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

sendMessage();
