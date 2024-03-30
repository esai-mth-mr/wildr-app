import { faker } from '@faker-js/faker';
import { client } from './server-client';
import { ReactionType } from '../../src/generated-graphql';
import { signup } from './signup';
import { followUser } from './post-notifications';
import { createTextPost } from './post-service';

async function reactToPost(
  reactionType: ReactionType,
  postId: string,
  token?: string
) {
  const response = await client
    .post(
      '/graphql',
      {
        query: /* GraphQL */ `
          mutation LikePost($reactOnPostInput: ReactOnPostInput!) {
            reactOnPost(input: $reactOnPostInput) {
              __typename
              ... on ReactOnPostResult {
                post {
                  id
                }
                challenge {
                  id
                }
              }
            }
          }
        `,
        variables: {
          reactOnPostInput: {
            postId,
            reaction: reactionType,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    .catch(e => console.error(e));

  return response;
}

async function getPost(postId: string, token?: string) {
  const response = await client.post('/graphql', {
    query: /* GraphQL */ `
      query GetPost($getPostInput: GetPostInput!) {
        getPost(input: $getPostInput) {
          __typename
          ... on GetPostResult {
            post {
              id
              stats {
                likeCount
              }
            }
          }
        }
      }
    `,
    variables: {
      getPostInput: {
        id: postId,
      },
    },
  });

  return response.data.data.getPost.post;
}

async function main() {
  const { jwtToken: userToken, user } = await signup();
  const { jwtToken: user2Token, user: user2 } = await signup();

  // @ts-ignore
  console.log('leader id', user.id);
  // @ts-ignore
  console.log('follower id', user2.id);

  await followUser({
    userId: user.id,
    jwtToken: user2Token,
  });

  const post = await createTextPost(userToken);

  // user 2 should get a notification
  client.defaults.headers.common['Authorization'] = `Bearer ${user2Token}`;

  const userTokens = await Promise.all(
    Array.from({ length: 10 }, async () => {
      const { jwtToken } = await signup();
      return jwtToken;
    })
  );

  await Promise.all(
    userTokens.map(async token => {
      return reactToPost(ReactionType.LIKE, post.id, token);
    })
  );

  const p1 = await getPost(post.id, userTokens[0]);

  await Promise.all(
    userTokens.map(token => {
      return reactToPost(ReactionType.UN_LIKE, post.id, token);
    })
  );

  const p2 = await getPost(post.id, userTokens[0]);

  console.log({ p1 });
  console.log({ p2 });
}

main();
