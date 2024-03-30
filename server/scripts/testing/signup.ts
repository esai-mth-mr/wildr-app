import { client } from './server-client';
import { faker } from '@faker-js/faker';

/**
 * Script to test author flagging of comments. This will later be used for
 * in an automated test.
 */
export async function signup() {
  const response = await client
    .post('/graphql', {
      query: /* GraphQL */ `
        mutation SignUpWithEmail($signUpWithEmailInput: SignUpWithEmailInput!) {
          signUpWithEmail(input: $signUpWithEmailInput) {
            user {
              id
            }
            jwtToken
          }
        }
      `,
      variables: {
        signUpWithEmailInput: {
          email: faker.internet.email(),
          handle: faker.internet.userName(),
          name: faker.name.firstName() + ' ' + faker.name.lastName(),
          password: faker.internet.password(),
          gender: 'MALE',
          langCode: 'en',
        },
      },
    })
    .catch(e => console.error(e));

  // @ts-ignore
  return response.data.data.signUpWithEmail as {
    user: {
      id: string;
    };
    jwtToken: string;
  };
}
