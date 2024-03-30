import { adminClient } from '../util/admin-client';

async function main() {
  try {
    const response = await adminClient.post(
      '/notification/trending-challenge-notification',
      {
        title: 'Challenge is trending!',
        body: 'Tap to check it out',
        challengeId: 'njawmI9ZJfQJZag1',
        handles: ['thudsonbu_thudsonbu_'],
      }
    );
    console.log(response.data.data);
  } catch (error) {
    console.log(error);
  }
}

main();
