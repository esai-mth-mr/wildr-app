import { adminClient } from './util/admin-client';

async function main() {
  const response = await adminClient.post('/post/search', {
    searchQuery: 'breakers',
  });
  console.log(response.data);
}

main();
