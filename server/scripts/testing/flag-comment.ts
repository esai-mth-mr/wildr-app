import { client } from './server-client';
import { signup } from './signup';
import { addComment } from './post-service';

async function createPost(jwt: string) {
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

const flagCommentQuery = /* GraphQL */ `
  mutation FlagComment($flagCommentInput: FlagCommentInput!) {
    flagComment(input: $flagCommentInput) {
      ... on FlagCommentResult {
        comment {
          id
          author {
            id
          }
        }
      }
    }
  }
`;

async function flagComment(
  commentId: string,
  operation: 'FLAG' | 'UN_FLAG',
  jwt: string
) {
  await client.post(
    '/graphql',
    {
      query: flagCommentQuery,
      variables: {
        flagCommentInput: {
          commentId,
          operation,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );

  console.log('comment flagged/unflagged');
}

const reportPostQuery = /* GraphQL */ `
  mutation ReportPost($reportPostInput: ReportPostInput!) {
    reportPost(input: $reportPostInput) {
      ... on ReportPostResult {
        post {
          id
        }
      }
    }
  }
`;

async function reportPost(postId: string) {
  const result = await client.post('/graphql', {
    query: reportPostQuery,
    variables: {
      reportPostInput: {
        postId,
        type: 'ONE',
      },
    },
  });

  console.log('post reported');
  console.log(result);
}

export async function getComment(commentId: string, token: string) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        query GetComment($getCommentInput: GetCommentInput!) {
          getComment(input: $getCommentInput) {
            __typename
            ... on GetCommentResult {
              comment {
                id
                commentStats {
                  likeCount
                }
                author {
                  handle
                }
              }
            }
          }
        }
      `,
      variables: {
        getCommentInput: {
          id: commentId,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data.getComment.comment;
}

async function getPost(postId: string, jwt: string) {
  const result = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        query GetPost($getPostInput: GetPostInput!) {
          getPost(input: $getPostInput) {
            ... on GetPostResult {
              post {
                id
                stats {
                  commentCount
                  hasHiddenComments
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
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );

  console.log('post fetched');

  return result.data.data.getPost.post;
}

async function main() {
  const { jwtToken: jwt1 } = await signup();
  const { jwtToken: jwt2 } = await signup();
  const post = await createPost(jwt1);
  const comment = await addComment(post.id, jwt1);

  await flagComment(comment.id, 'FLAG', jwt1);

  const flaggedComment = await getComment(comment.id, jwt2);
  console.log({ flagged: flaggedComment });

  await flagComment(comment.id, 'UN_FLAG', jwt1);

  const unflagged = await getComment(comment.id, jwt2);
  console.log({ unflagged });

  const commentCreated = await addComment(post.id, jwt2);

  await flagComment(commentCreated.id, 'FLAG', jwt1);

  const flaggedButIsAuthor = await getComment(commentCreated.id, jwt2);
  console.log({ flaggedButIsAuthor });

  const { user: user3, jwtToken: jwt3 } = await signup();

  const postForOtherUser = await getPost(post.id, jwt3);
  console.log({ postForOtherUser });

  const postForAuthorOfFlaggedComment = await getPost(post.id, jwt2);
  console.log({ postForAuthorOfFlaggedComment });

  const postForPostAuthor = await getPost(post.id, jwt1);
  console.log({ postForPostAuthor });
}

main();
