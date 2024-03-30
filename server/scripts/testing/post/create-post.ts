import { faker } from '@faker-js/faker';
import { client } from '../server-client';

export async function createPost({
  jwt,
  challengeId,
}: {
  jwt: string;
  challengeId?: string;
}) {
  const sentence = faker.lorem.sentence();
  const textSegments = sentence.split(' ').map((word, i) => ({
    position: i,
    text: {
      chunk: word,
    },
  }));
  const segments = textSegments.map(({ position }) => ({
    position,
    segmentType: 'TEXT',
  }));
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
          challengeId,
          properties: [
            {
              textInput: {
                content: {
                  textSegments,
                  segments,
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

  console.log('created post', result.data.data.createMultiMediaPost.post);
  return result.data.data.createMultiMediaPost.post;
}
