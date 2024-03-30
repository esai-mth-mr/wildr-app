import { adminClient } from '../util/admin-client';

async function main() {
  try {
    const response = await adminClient.post(
      '/notification/challenge-participants-notification',
      {
        title: 'Challenge is trending!',
        body: 'Tap to check it out',
        challengeId: 'KrJNOZmQDRIcNglu',
        includeAuthor: true,
      }
    );
    console.log(response.data.data);
  } catch (error) {
    console.log(error);
  }
}

main();
