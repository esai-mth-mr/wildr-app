import { client, logAxiosError } from './open-search-client';

async function deleteOpenSearchMappings() {
  const mappingNames = ['users', 'post_content', 'hashtags'];
  await Promise.all(
    mappingNames.map(async mappingName => client.delete(`/${mappingName}`))
  );
}

async function main() {
  try {
    await deleteOpenSearchMappings();
  } catch (error: any) {
    logAxiosError(error);
  }
}

main();
