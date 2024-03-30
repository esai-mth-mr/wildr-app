import { client } from '@verdzie/test/test-client';
import { faker } from '@faker-js/faker';

/**
 * Script to test author flagging of comments. This will later be used for
 * in an automated test.
 */
export async function signup({ handle }: { handle?: string } = {}) {
  const response = await client
    .post('/graphql', {
      query: /* GraphQL */ `
        mutation SignUpWithEmail($signUpWithEmailInput: SignUpWithEmailInput!) {
          signUpWithEmail(input: $signUpWithEmailInput) {
            user {
              id
              handle
            }
            jwtToken
          }
        }
      `,
      variables: {
        signUpWithEmailInput: {
          email: faker.internet.email(),
          handle: handle ?? faker.internet.userName(),
          name: faker.name.firstName() + ' ' + faker.name.lastName(),
          password: faker.internet.password(),
          gender: 'MALE',
          langCode: 'en',
        },
      },
    })
    .catch(e => console.error(e));

  // @ts-ignore
  return {
    user: response?.data.data.signUpWithEmail.user,
    jwt: response?.data.data.signUpWithEmail.jwtToken,
  } as {
    user: {
      id: string;
      handle: string;
    };
    jwt: string;
  };
}
