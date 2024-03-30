import { client } from '../server-client';

export async function createChallenge({ jwt }: { jwt?: string }) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation createChallenge($input: CreateChallengeInput!) {
          createChallenge(input: $input) {
            __typename
            ... on CreateChallengeResult {
              __typename
              challenge {
                __typename
                id
                name
                isCompleted
              }
            }
            ... on ChallengeTrollDetectionError {
              __typename
              message
              description {
                message
                result
              }
              name {
                message
                result
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
          name: 'Challenge 2',
          coverEnum: 'TYPE_1',
          challengeLengthInDays: 3,
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
  console.log(
    'created challenge:',
    response.data.data.createChallenge.challenge
  );
  return response.data.data.createChallenge.challenge;
}
