import { client } from '../server-client';

export async function joinChallenge({
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
        mutation joinChallenge($input: JoinChallengeInput!) {
          joinChallenge(input: $input) {
            ... on JoinChallengeResult {
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
        ['x-tzo']: '+01:00',
      },
    }
  );
  return response.data.data.joinChallenge.challenge;
}
