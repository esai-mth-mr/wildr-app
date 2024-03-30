import { signup } from './signup';
import { client } from './server-client';
import { followUser } from './post-notifications';

export async function addComment({
  postId,
  jwt,
}: {
  postId: string;
  jwt: string;
}) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation CreateComment($createCommentInput: AddCommentInput!) {
          addComment(input: $createCommentInput) {
            ... on AddCommentResult {
              comment {
                id
              }
            }
          }
        }
      `,
      variables: {
        createCommentInput: {
          postId,
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
          participationType: 'OPEN',
          shouldBypassTrollDetection: true,
          negativeConfidenceCount: 0.0,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );

  return response.data.data.addComment.comment;
}

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

async function getFeed({ jwt }: { jwt: string }) {
  const result = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        query GetFeed(
          $input: GetFeedInput!
          $paginationInput: PaginationInput
        ) {
          getFeed(input: $input) {
            ... on GetFeedResult {
              feed {
                postsConnection(paginationInput: $paginationInput) {
                  ... on FeedPostsConnection {
                    edges {
                      node {
                        author {
                          handle
                        }
                        stats {
                          likeCount
                          commentCount
                        }
                      }
                    }
                  }
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
        input: {
          feedType: 'ALL',
          scopeType: 'FOLLOWING',
        },
        paginationInput: {
          take: 20,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );

  return result.data.data.getFeed.feed;
}

async function flagComment({
  commentId,
  operation,
  jwt,
}: {
  commentId: string;
  operation: 'FLAG' | 'UN_FLAG';
  jwt: string;
}) {
  await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
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
      `,
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

async function main() {
  const { user, jwtToken: jwt } = await signup();
  const { user: user2, jwtToken: jwt2 } = await signup();
  const { user: user3, jwtToken: jwt3 } = await signup();

  // user2 follows user1
  await followUser({ userId: user.id, jwtToken: jwt2 });
  // user3 follows user1
  await followUser({ userId: user.id, jwtToken: jwt3 });

  // user1 creates a post
  const post = await createPost(jwt);

  // wait for post to be distributed to user2's feed
  await new Promise(resolve => setTimeout(resolve, 3000));

  // user2 gets the feed
  const feedBeforeComment = await getFeed({ jwt: jwt2 });
  if (feedBeforeComment.postsConnection.edges[0].node.stats.commentCount !== 0)
    throw new Error('Comment count is not 0');

  // user3 comments on the post
  const comment = await addComment({ postId: post.id, jwt: jwt3 });

  // user3's comment should be included in stats of user2's feed
  const feedAfterComment = await getFeed({ jwt: jwt2 });
  if (feedAfterComment.postsConnection.edges[0].node.stats.commentCount !== 1)
    throw new Error('Comment count is not 1');

  // user flags the comment
  await flagComment({ commentId: comment.id, operation: 'FLAG', jwt });

  // user3's comment should be removed from stats of user2's feed
  const user2Feed = await getFeed({ jwt: jwt2 });
  if (user2Feed.postsConnection.edges[0].node.stats.commentCount !== 0)
    throw new Error('Comment count is not 0');

  // user3's comment should included in user3's feed
  const user3Feed = await getFeed({ jwt: jwt3 });
  if (user3Feed.postsConnection.edges[0].node.stats.commentCount !== 1)
    throw new Error('Comment count is not 1');
}

main();
