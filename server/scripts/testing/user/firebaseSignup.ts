import { client } from '../server-client';
import fs from 'fs';
import { faker } from '@faker-js/faker';
import path from 'path';
import FormData from 'form-data';

async function sendGraphQLRequestWithUpload(fileStream: any): Promise<void> {
  try {
    const formData = new FormData();
    formData.append(
      'operations',
      JSON.stringify({
        query:
          'mutation FirebaseSignup($firebaseSignupInput: FirebaseSignupInput!) { firebaseSignup(input: $firebaseSignupInput) { ... on SignUpOutput { user { handle } } } }',
        variables: {
          firebaseSignupInput: {
            email: faker.internet.email(),
            phoneNumber: faker.phone.number(),
            name: faker.name.firstName() + ' ' + faker.name.lastName(),
            handle: faker.internet.userName(),
            uid: faker.database.mongodbObjectId(),
            gender: 'MALE',
            language: 'english',
            inviteCode: 2,
            fcmToken: 'fcm-token',
            image: null,
            categoryIds: [
              faker.datatype.uuid(),
              faker.datatype.uuid(),
              faker.datatype.uuid(),
            ],
            birthday: '2022-01-01',
          },
        },
      })
    );
    formData.append(
      'map',
      JSON.stringify({
        '0': ['variables.firebaseSignupInput.image'],
      })
    );
    formData.append('0', fileStream, {
      filename: 'text.txt',
    });
    fs.writeFileSync(
      path.resolve(__dirname, './payload.txt'),
      formData.getBuffer()
    );
    const response = await client.post('/graphql', formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
      },
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

async function main() {
  console.log('\nuser.firebaseSignup Test');
  const fileStream = fs.readFileSync(path.resolve(__dirname, './textfile.txt'));
  await sendGraphQLRequestWithUpload(fileStream);
}

main();
