import { adminClient } from './util/admin-client';

async function main() {
  const response = await adminClient.get('/ping');
  console.log(response.data);
}

main();
