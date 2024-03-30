import { signup } from '../signup';
import { client } from '../server-client';
import { createChallenge } from './create-challenge';
import { joinChallenge } from './join-challenge';
import { wait } from '../testing.common';

export async function leaveChallenge({
  jwt,
  challengeId,
}: {
  jwt: string;
  challengeId: string;
}) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation leaveChallenge($input: LeaveChallengeInput!) {
          leaveChallenge(input: $input) {
            ... on LeaveChallengeResult {
              __typename
              challenge {
                id
                name
                stats {
                  entryCount
                  participantCount
                  commentCount
                  shareCount
                  reportCount
                }
                isCompleted
              }
            }
            ... on SmartError {
              __typename
              message
            }
          }
        }
      `,
      variables: {
        input: {
          id: challengeId,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  return response.data.data;
}

async function main() {
  const { jwtToken: jwt } = await signup();
  const { jwtToken: jwt2 } = await signup();
  const challenge = await createChallenge({ jwt });
  await joinChallenge({ jwt: jwt2, challengeId: challenge.id });
  await wait(1000);
  const leaveChallengesResponse = await leaveChallenge({
    jwt: jwt2,
    challengeId: challenge.id,
  });
  console.log(JSON.stringify(leaveChallengesResponse, null, 2));
}

main();
