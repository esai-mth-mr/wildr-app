import { client } from './server-client';

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
