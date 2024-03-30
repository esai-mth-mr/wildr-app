import { adminClient } from '../util/admin-client';

async function main() {
  try {
    const response = await adminClient.get('challenge/name/amazing');
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
}

main();
