import '../../tsconfig-paths-bootstrap';
import * as dotenv from 'dotenv';
import '../../env/admin-local-config';

import { signup } from '@verdzie/scripts/testing/signup';
import { createPost } from '@verdzie/scripts/testing/post/create-post';

async function main() {
  const users = await Promise.all(
    Array.from({ length: 10 }).map(() => signup())
  );

  for (const { user, jwtToken } of users) {
    for (let i = 0; i < 10; i++) {
      await createPost({
        jwt: jwtToken,
      });
    }
  }
}

main();
