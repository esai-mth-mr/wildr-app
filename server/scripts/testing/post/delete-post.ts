import { client } from '../server-client';

const deletePostMutation = /* GraphQL */ `
  mutation DeletePost($input: DeletePostInput!) {
    deletePost(input: $input) {
      __typename
      ... on DeletePostResult {
        post {
          id
        }
      }
    }
  }
`;

export async function deletePost({
  jwt,
  postId,
}: {
  jwt: string;
  postId: string;
}) {
  const result = await client.post(
    '/graphql',
    {
      query: deletePostMutation,
      variables: {
        input: {
          postId,
        },
      },
    },
    {
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    }
  );
  return result.data.deletePost;
}
