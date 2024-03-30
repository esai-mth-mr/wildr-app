import { client } from './server-client';

export async function createTextPost(token: string) {
  const response = await client
    .post(
      '/graphql',
      {
        query: /* GraphQL */ `
          mutation CreatePost($createTextPostInput: CreateTextPostInput!) {
            createTextPost(input: $createTextPostInput) {
              __typename
              ... on CreatePostResult {
                post {
                  id
                }
              }
            }
          }
        `,
        variables: {
          createTextPostInput: {
            expirationHourCount: 3,
            commenterScope: 'ALL',
            visibility: 'ALL',
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
            tags: {
              id: '3',
              name: 'hashtag',
              noSpace: true,
            },
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
  return response.data.data.createTextPost.post;
}

export async function addComment(postId: string, token: string) {
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
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data.addComment.comment;
}
