import { adminClient } from '../util/admin-client';

async function main() {
  try {
    const response = await adminClient.post('/notification', {
      title: 'Test Notification',
      scope: 'USERS',
      body: 'This is a test notification',
      userIds: ['HEv7kO9QCwFIqmhV'],
    });
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
}

main();
