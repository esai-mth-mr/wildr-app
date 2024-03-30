import { createDocument } from '../open-search-client';

async function createIndexedUser(userId: string) {
  await createDocument('users', userId, {
    wallet_address: '0x1234',
    handle: 'test-handle',
    name: 'test-name',
    updated_at: new Date().toISOString(),
  });
}

async function main() {
  await createIndexedUser('QlsLPByPCnBvc4nb');
}

main();
