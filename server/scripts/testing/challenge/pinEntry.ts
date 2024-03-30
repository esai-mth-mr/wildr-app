import { signup } from '../signup';
import { createChallenge } from './create-challenge';
import { client } from '../server-client';
import { createPost } from '../post/create-post';
import { joinChallenge } from './join-challenge';

export async function pinEntry({
  jwt,
  entryId,
  challengeId,
}: {
  jwt: string;
  challengeId: string;
  entryId: string;
}) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation PinChallengeEntry($input: PinChallengeEntryInput!) {
          pinChallengeEntry(input: $input) {
            __typename
            ... on PinChallengeEntryResult {
              challenge {
                __typename
                id
                name
              }
              entry {
                id
                hasPinned
              }
            }
            ... on SmartError {
              __typename
            }
          }
        }
      `,
      variables: {
        input: {
          flag: 'PIN',
          challengeId,
          entryId,
        },
      },
    },
    {
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    }
  );
  return response.data.data.pinChallengeEntry;
}

async function main() {
  const { jwtToken: jwt } = await signup();
  const { jwtToken: jwt2 } = await signup();
  const challenge = await createChallenge({ jwt });
  await joinChallenge({ jwt: jwt2, challengeId: challenge.id });
  const entry = await createPost({ jwt: jwt2, challengeId: challenge.id });
  const result = await pinEntry({
    jwt,
    challengeId: challenge.id,
    entryId: entry.id,
  });
  console.log(JSON.stringify(result, null, 2));
}

main();
