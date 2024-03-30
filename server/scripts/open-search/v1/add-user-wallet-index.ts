import { updateDocument } from '../open-search-client';

async function addUserWalletIndex(userId: string, wallet_address: string) {
  await updateDocument('users', userId, {
    wallet_address,
    updatedAt: new Date().toISOString(),
  });
}

async function main() {
  await addUserWalletIndex('QlsLPByPCnBvc4nb', '0x4231');
}

main();
