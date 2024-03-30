import { client } from '../server-client';
import { signup } from '../signup';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

const activityStreamQuery = /* GraphQL */ `
  query getActivityStream(
    $getUserInput: GetUserInput!
    $activitiesConnectionInput: PaginationInput!
  ) {
    getUser(input: $getUserInput) {
      ... on GetUserResult {
        user {
          handle
          activitiesConnection(paginationInput: $activitiesConnectionInput) {
            edges {
              node {
                displayStr
                displayBodyStr
              }
            }
          }
        }
      }
    }
  }
`;

async function getActivityStream({
  jwt,
  userId,
}: {
  jwt: string;
  userId: string;
}) {
  const result = await client.post(
    '/graphql',
    {
      query: activityStreamQuery,
      variables: {
        getUserInput: {
          id: userId,
        },
        activitiesConnectionInput: {
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
  return result.data.data.getUser.user.activitiesConnection.edges;
}

export async function followUser({
  userId,
  jwtToken,
}: {
  userId: string;
  jwtToken: string;
}) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation followUser($followUserInput: FollowUserInput!) {
          followUser(input: $followUserInput) {
            ... on FollowUserResult {
              currentUser {
                id
              }
            }
            ... on SmartError {
              message
            }
          }
        }
      `,
      variables: {
        followUserInput: {
          userId,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    }
  );
  return response.data.data.followUser.currentUser;
}

async function challengeCreatedActivity() {
  console.log('\nCHALLENGE CREATED ACTIVITY');
  const { user, jwtToken } = await signup();
  const { user: user2, jwtToken: jwtToken2 } = await signup();
  await followUser({ userId: user.id, jwtToken: jwtToken2 });
  await createChallenge({ jwt: jwtToken });
  await wait(1000);
  const activityStream = await getActivityStream({
    jwt: jwtToken2,
    userId: user2.id,
  });
  console.log(JSON.stringify(activityStream, null, 2));
}

async function challengeJoinActivity() {
  console.log('\nCHALLENGE JOIN ACTIVITY');
  const { user, jwtToken } = await signup();
  const { jwtToken: jwtToken2 } = await signup();
  await followUser({ userId: user.id, jwtToken: jwtToken2 });
  const challenge = await createChallenge({ jwt: jwtToken });
  await joinChallenge({ jwt: jwtToken2, challengeId: challenge.id });
  await wait(1000);
  const activityStream = await getActivityStream({
    jwt: jwtToken,
    userId: user.id,
  });
  console.log(JSON.stringify(activityStream, null, 2));
}

async function main() {
  await challengeCreatedActivity();
  await challengeJoinActivity();
}

main();
