import { client } from '../open-search-client';

async function searchUserByWallet(query: string) {
  return await client.post('/users/_search', {
    from: 0,
    size: 10,
    query: {
      multi_match: {
        query: query,
        type: 'bool_prefix',
      },
    },
  });
}

async function main() {
  const result = await searchUserByWallet('br');
  console.log('Hits:', result.data.hits.hits);
}

main();
