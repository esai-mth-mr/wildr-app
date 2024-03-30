import { signup } from '../signup';
import { client } from '../server-client';

async function createChallenge({ jwt }: { jwt?: string }) {
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
          name: 'Challenge 1',
          description: {
            textSegments: [
              {
                position: 0,
                text: {
                  chunk: 'Description',
                },
              },
            ],
            segments: [
              {
                position: 0,
                segmentType: 'TEXT',
              },
            ],
          },
          cover: {
            coverEnum: 'TYPE_1',
          },
          challengeLengthInDays: 10,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  return response.data.data.createChallenge.challenge;
}

async function joinChallenge({
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
      },
    }
  );
  return response.data.data.joinChallenge.challenge;
}

async function createPost({
  jwt,
  challengeId,
}: {
  jwt: string;
  challengeId: string;
}) {
  const result = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation CreatePost($createMultiPostInput: CreateMultiMediaPostInput!) {
          createMultiMediaPost(input: $createMultiPostInput) {
            __typename
            ... on CreatePostResult {
              post {
                id
                stats {
                  commentCount
                }
                postContext {
                  liked
                }
              }
            }
          }
        }
      `,
      variables: {
        createMultiPostInput: {
          challengeId,
          properties: [
            {
              textInput: {
                content: {
                  textSegments: [
                    {
                      position: 0,
                      text: {
                        chunk: 'Bob 1',
                      },
                    },
                  ],
                  segments: [
                    {
                      position: 0,
                      segmentType: 'TEXT',
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  return result.data.data.createMultiMediaPost.post;
}

async function getChallengeLeaderboard({
  jwt,
  challengeId,
}: {
  jwt: string;
  challengeId: string;
}) {
  const result = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        query getChallenge(
          $input: GetChallengeInput!
          $challengeId: ID!
          $paginationInput: PaginationInput!
        ) {
          getChallenge(input: $input) {
            ... on GetChallengeResult {
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
                leaderboardConnection(
                  challengeId: $challengeId
                  paginationInput: $paginationInput
                ) {
                  edges {
                    node {
                      user {
                        handle
                      }
                      post {
                        id
                      }
                      entryCount
                      isCreator
                    }
                  }
                  pageInfo {
                    hasNextPage
                  }
                }
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
        challengeId,
        paginationInput: {
          take: 10,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  return result.data.data.getChallenge.challenge.leaderboardConnection.edges;
}

async function main() {
  console.log('\nCHALLENGE LEADERBOARD TEST\n');
  const { user, jwtToken } = await signup();
  const { id } = await createChallenge({ jwt: jwtToken });
  const { jwtToken: jwtToken2 } = await signup();
  const { jwtToken: jwtToken3 } = await signup();
  await joinChallenge({ jwt: jwtToken2, challengeId: id });
  await joinChallenge({ jwt: jwtToken3, challengeId: id });
  await createPost({ jwt: jwtToken2, challengeId: id });
  await createPost({ jwt: jwtToken2, challengeId: id });
  await createPost({ jwt: jwtToken3, challengeId: id });
  await createPost({ jwt: jwtToken, challengeId: id });
  await new Promise(resolve => setTimeout(resolve, 1000));
  const leaderboard = await getChallengeLeaderboard({
    jwt: jwtToken,
    challengeId: id,
  });
  console.log(JSON.stringify(leaderboard, null, 2));
}

main();
