import { ReactionType } from '../../src/generated-graphql';
import { signup } from './signup';
import { client } from './server-client';
import { createTextPost, addComment } from './post-service';
import { getComment } from './comment-service';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

async function addReply(commentId: string, token?: string) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation CreateReply($createReplyInput: AddReplyInput!) {
          addReply(input: $createReplyInput) {
            ... on AddReplyResult {
              reply {
                id
                replyContext {
                  liked
                }
              }
            }
          }
        }
      `,
      variables: {
        createReplyInput: {
          commentId,
          content: {
            segments: {
              position: 0,
              segmentType: 'TEXT',
            },
            textSegments: {
              position: 0,
              text: {
                chunk: 'Hi',
                langCode: 'en',
                noSpace: true,
              },
            },
          },
          shouldBypassTrollDetection: true,
          negativeConfidenceCount: 0.0,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data.addReply.reply;
}

async function reactToReply(
  reactionType: ReactionType,
  replyId: string,
  token?: string
) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation ReactToReply($reactOnReplyInput: ReactOnReplyInput!) {
          reactOnReply(input: $reactOnReplyInput) {
            ... on ReactOnReplyResult {
              reply {
                id
                replyContext {
                  liked
                }
              }
            }
          }
        }
      `,
      variables: {
        reactOnReplyInput: {
          reaction: reactionType,
          replyId,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data.reactOnReply.reply;
}

async function getReply(replyId: string, token?: string) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        query GetReply($getReplyInput: GetReplyInput!) {
          getReply(input: $getReplyInput) {
            ... on GetReplyResult {
              reply {
                id
                replyContext {
                  liked
                }
                replyStats {
                  likeCount
                }
              }
            }
          }
        }
      `,
      variables: {
        getReplyInput: {
          id: replyId,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data.getReply.reply;
}

async function main() {
  const { user, jwtToken } = await signup();
  console.log({ user, jwtToken });

  const { id: postId } = await createTextPost(jwtToken);
  console.log({ postId });

  const { id: commentId } = await addComment(postId, jwtToken);
  console.log({ commentId });

  const { gottenComment } = await getComment(commentId, jwtToken);
  console.log({ gottenComment });

  const { commentContext } = await reactToComment(
    ReactionType.LIKE,
    commentId,
    jwtToken
  );
  console.log({ commentContext });

  const { commentStats } = await getComment(commentId, jwtToken);
  console.log({ commentStats });

  await reactToComment(ReactionType.UN_LIKE, commentId, jwtToken);

  const { commentStats: commentStats2 } = await getComment(commentId, jwtToken);
  console.log({ commentStats2 });

  const { id: replyId } = await addReply(commentId, jwtToken);
  console.log({ replyId });

  const { replyContext } = await reactToReply(
    ReactionType.LIKE,
    replyId,
    jwtToken
  );
  console.log({ replyContext });

  const { replyStats } = await getReply(replyId, jwtToken);
  console.log({ replyStats });

  const userTokens = await Promise.all(
    Array.from({ length: 3 }, async () => {
      const res = await signup();
      // @ts-ignore
      return res.jwtToken;
    })
  );

  for (const token of userTokens) {
    await wait(20);
    reactToComment(ReactionType.LIKE, commentId, token);
  }
  // await Promise.all(
  //   userTokens.map(async token => {
  //     await wait(1000);
  //     return reactToComment(ReactionType.LIKE, commentId, token);
  //   })
  // );

  const c1 = await getComment(commentId, userTokens[0]);

  // await Promise.all(
  //   userTokens.map(async token => {
  //     await wait(100);
  //     return reactToComment(ReactionType.UN_LIKE, commentId, token);
  //   })
  // );

  const c2 = await getComment(commentId, userTokens[0]);

  console.log({ c1, c2 });
}

main();
