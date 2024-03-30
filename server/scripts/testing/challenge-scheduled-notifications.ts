import '../../tsconfig-paths-bootstrap';
import * as dotenv from 'dotenv';
import '../../env/admin-local-config';

import { SQS } from 'aws-sdk';
import { signup } from '@verdzie/scripts/testing/signup';
import { createChallenge } from '@verdzie/scripts/testing/challenge/create-challenge';
import { joinChallenge } from '@verdzie/scripts/testing/challenge/join-challenge';

async function main() {
  const user = await signup();
  console.log('Created challenge owner', { user });
  const user2 = await signup();
  console.log('Created challenge participant', { user2 });
  const createdChallenge = await createChallenge({ jwt: user.jwtToken });
  console.log('Created challenge', { createdChallenge });
  await joinChallenge({
    jwt: user2.jwtToken,
    challengeId: createdChallenge.id,
  });
  console.log('Participant joined challenge');
  await new Promise(resolve => setTimeout(resolve, 3000));
  const sqs = new SQS();
  await new Promise<void>(resolve => {
    sqs.sendMessage(
      {
        QueueUrl:
          'http://localhost:9324/queue/queue-timepoint-recipient-distribution',
        MessageBody: 'none',
      },
      (err, data) => {
        if (err) {
          console.log('Error sending message', err);
          resolve();
        } else {
          console.log('Sent message', data);
          resolve();
        }
      }
    );
  });
}

main();
