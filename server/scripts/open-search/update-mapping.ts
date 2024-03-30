import { client } from './open-search-client';

async function updateMapping(index: string, mapping: any) {
  await client.put(`/${index}/_mapping`, {
    properties: mapping,
  });
}

async function updateOSMapping() {
  try {
    const index = '';
    const mapping = {};

    console.log(`Updating open search index ${index}...`);

    await updateMapping(index, mapping);

    console.log('Successfully updated Open Search index');
  } catch (error: any) {
    console.error('Failed to create Open Search indexes:', error);
  }
}

async function main() {
  updateOSMapping();
}

main();
