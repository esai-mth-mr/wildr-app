import { adminClient } from '../../admin/util/admin-client';
import { faker } from '@faker-js/faker';

async function main() {
  const categories = await adminClient.get('/category');
  console.log(categories.data);
  await adminClient.post('/category', {
    name: faker.company.bsAdjective(),
    type: 1,
  });
  const newCategories = await adminClient.get('/category');
  console.log(newCategories.data);
}

main();
