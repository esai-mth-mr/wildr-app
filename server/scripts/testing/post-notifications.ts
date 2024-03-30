import { client } from './server-client';
import { signup } from './signup';
import { createTextPost } from './post-service';

/**
 * Follow a user
 */
export async function followUser({
  userId,
  jwtToken,
}: {
  userId: string;
  jwtToken: string;
}) {
  const response = await client
    .post(
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
    )
    .catch(e => console.error(e));

  return response;
}

async function main() {
  const { jwtToken: userToken, user } = await signup();
  const { jwtToken: user2Token, user: user2 } = await signup();

  // @ts-ignore
  console.log('leader id', user.id);
  // @ts-ignore
  console.log('follower id', user2.id);

  // user 2 follows user 1
  await followUser({
    userId: user.id,
    jwtToken: user2Token,
  });

  // user 1 creates a post
  await createTextPost(userToken);
}

main();
