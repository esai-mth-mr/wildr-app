import '../../tsconfig-paths-bootstrap';
import * as dotenv from 'dotenv';
import '../../env/admin-local-config';

import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import config from '@verdzie/server/typeorm/typeormconfig-wildr';
import { createConnection } from 'typeorm';
import { PostCategoryEntity } from '@verdzie/server/post-category/postCategory.entity';
import { generateId } from '@verdzie/server/common/generateId';
import { faker } from '@faker-js/faker';
import chalk from 'chalk';

async function main() {
  console.log(chalk.blue('\nCreating categories...'));
  const conn = await createConnection(config as PostgresConnectionOptions);
  const categories = Array.from({ length: 25 }, () => {
    return {
      id: generateId(),
      name: faker.word.adjective(),
      createdAt: new Date(),
      _type: faker.helpers.arrayElement([1, 2, 3, 4]),
    };
  });
  const categoryRepo = conn.getRepository(PostCategoryEntity);
  await Promise.all(
    categories.map(category => {
      return categoryRepo.insert(category);
    })
  );
  await conn.close();
  console.log(chalk.green('\nCategories created successfully!'));
}

main();
