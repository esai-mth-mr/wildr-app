import { adminClient } from './util/admin-client';

async function main() {
  const categoryTypes = await adminClient.get('/category-type');
  console.log(categoryTypes.data);
}

main();
