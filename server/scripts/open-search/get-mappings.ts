import { client, logAxiosError } from './open-search-client';

async function getOpenSearchMappings() {
  try {
    const { data } = await client.get('/_mappings');
    // console.log('Open Search mappings:', JSON.stringify(data, null, 2));
    console.log('Open Search mapping names:', Object.keys(data));
  } catch (error: any) {
    logAxiosError(error);
  }
}

async function main() {
  getOpenSearchMappings();
}

main();
