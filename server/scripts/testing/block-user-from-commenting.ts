import { faker } from '@faker-js/faker';
import { client } from './server-client';
import { signup } from './signup';

const createPostQuery = /* GraphQL */ `
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
`;

async function createPost() {
  const response = await client
    .post('/graphql', {
      query: createPostQuery,
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
    })
    .catch(e => console.error(e));

  if (response) {
    console.log(
      'post created with id',
      response.data.data.createTextPost.post.id
    );
    return response.data.data;
  }
}

const createCommentQuery = /* GraphQL */ `
  mutation CreateComment($createCommentInput: AddCommentInput!) {
    addComment(input: $createCommentInput) {
      ... on AddCommentResult {
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
`;

async function createComment(postId: string, jwt: string) {
  const response = await client.post(
    '/graphql',
    {
      query: createCommentQuery,
      variables: {
        createCommentInput: {
          postId: postId,
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

  if (response) {
    console.log(
      'comment created with id',
      response.data.data.addComment.comment.id
    );
    return response.data.data;
  }
}

async function blockCommenterOnPost(
  postId: string,
  commenterId: string,
  operation: string,
  jwt: string
) {
  const response = await client.post(
    '/graphql',
    {
      query: /* GraphQL */ `
        mutation blockCommenterOnPost(
          $blockCommenterOnPostInput: BlockCommenterOnPostInput!
        ) {
          blockCommenterOnPost(input: $blockCommenterOnPostInput) {
            __typename
            ... on BlockCommenterOnPostResult {
              operation
              commenterId
            }
          }
        }
      `,
      variables: {
        blockCommenterOnPostInput: {
          postId: postId,
          commenterId: commenterId,
          operation: operation,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );

  if (response) {
    console.log(
      'block user from commenting',
      response.data.data.blockCommenterOnPost
    );
    return response.data.data;
  }
}

async function main() {
  const { jwtToken: jwt1 } = await signup();
  const { jwtToken: jwt2, user: user2 } = await signup();

  client.defaults.headers.common['Authorization'] = `Bearer ${jwt1}`;

  const post = await createPost();
  await createComment(post.createTextPost.post.id, jwt2);

  await blockCommenterOnPost(
    post.createTextPost.post.id,
    user2.id,
    'BLOCK',
    jwt1
  );

  await new Promise(resolve => setTimeout(resolve, 300));

  console.log(user2.id);

  await createComment(post.createTextPost.post.id, jwt2);
}

main();
