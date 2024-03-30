import { ReactionType } from '@verdzie/server/generated-graphql';
import { client } from '@verdzie/test/test-client';

export async function reactToComment({
  reactionType,
  commentId,
  jwt,
}: {
  reactionType: ReactionType;
  commentId: string;
  jwt?: string;
}) {
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
          Authorization: `Bearer ${jwt}`,
        },
      }
    )
    .catch(e => console.error(e));

  // @ts-ignore
  return response.data.data.reactOnComment;
}

export async function pinComment({
  jwt,
  challengeId,
  commentId,
  postId,
}: {
  jwt: string;
  challengeId?: string;
  commentId?: string;
  postId?: string;
}) {
  const result = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation PinComment($input: PinCommentInput!) {
          pinComment(input: $input) {
            ... on PinCommentResult {
              __typename
              challenge {
                id
              }
              post {
                id
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
          challengeId,
          commentId,
          postId,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
  return result.data.data.pinCommentOnChallenge;
}
