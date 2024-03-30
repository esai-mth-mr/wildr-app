import { addComment, createTextPost } from './post-service';
import { signup } from './signup';
import { ReactionType } from '../../src/generated-graphql';
import { client } from './server-client';

async function reactToPost({
  reactionType,
  postId,
  jwt,
}: {
  reactionType: ReactionType;
  postId: string;
  jwt: string;
}) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation ReactToPost($reactOnPostInput: ReactOnPostInput!) {
          reactOnPost(input: $reactOnPostInput) {
            ... on ReactOnPostResult {
              post {
                id
                postContext {
                  liked
                }
              }
            }
            ... on SmartError {
              message
            }
          }
        }
      `,
      variables: {
        reactOnPostInput: {
          reaction: reactionType,
          postId: postId,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  return response.data.data.reactOnPost.post;
}

async function reactToComment(
  reactionType: ReactionType,
  commentId: string,
  token?: string
) {
  const response = await client
    .post(
      '/graphql',
      {
        query: /* GraphQL */ `
          mutation ReactToComment($reactOnCommentInput: ReactOnCommentInput!) {
            reactOnComment(input: $reactOnCommentInput) {
              ... on ReactOnCommentResult {
                comment {
                  id
                  commentContext {
                    liked
                  }
                  commentStats {
                    likeCount
                  }
                }
              }
            }
          }
        `,
        variables: {
          reactOnCommentInput: {
            reaction: reactionType,
            commentId,
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

  // @ts-ignore
  return response.data.data.reactOnComment.comment;
}

const USER_COUNT = 1;

async function main() {
  const { user, jwtToken } = await signup();
  console.log({ user, jwtToken });

  const { jwtToken: jwtToken2 } = await signup();

  const tokens: string[] = [];
  for (let i = 0; i < USER_COUNT; i++) {
    const { jwtToken: jwtToken3 } = await signup();
    tokens.push(jwtToken3);
  }

  const { id: postId } = await createTextPost(jwtToken);
  console.log({ postId });

  const { id: commentId } = await addComment(postId, jwtToken);
  console.log({ commentId });

  const { id: commentId2 } = await addComment(postId, jwtToken2);
  console.log({ commentId2 });

  await Promise.all(
    tokens.map(async token => {
      console.log('reaction');
      await new Promise(resolve => setTimeout(resolve, 200));
      await reactToComment(ReactionType.LIKE, commentId, token);
    })
  );
}

const LIKE_COUNT = 5;
async function lotsOfPostReactions() {
  const jwtArray: string[] = [];
  const { jwtToken: jwt, user } = await signup();
  console.log(user.id);
  for (let i = 0; i < LIKE_COUNT; i++) {
    const { jwtToken } = await signup();
    jwtArray.push(jwtToken);
  }
  const post = await createTextPost(jwt);
  for (let i = 0; i < LIKE_COUNT; i++) {
    await reactToPost({
      reactionType: ReactionType.LIKE,
      postId: post.id,
      jwt: jwtArray[i],
    });
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

lotsOfPostReactions();

// main();
