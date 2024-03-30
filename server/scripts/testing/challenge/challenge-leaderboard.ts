import { signup } from '../signup';
import { client } from '../server-client';
import { createChallenge } from './create-challenge';
import { joinChallenge } from './join-challenge';
import { createPost } from '../post/create-post';

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
  const { user, jwtToken } = await signup();
  console.log(user);
  console.log(jwtToken);
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
  for (const { node } of leaderboard) {
    console.log(node.user.handle);
  }
}

main();
