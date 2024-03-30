import '../../env/admin-local-config';
import '../../tsconfig-paths-bootstrap';

import {
  BannerEntity,
  BannerState,
} from '@verdzie/server/banner/banner.entity';
import config from '@verdzie/server/typeorm/typeormconfig-wildr';
import chalk from 'chalk';
import { nanoid } from 'nanoid';
import { createConnection } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

async function main() {
  let conn;
  const s3Bucket = 'prod.uploads.wildr.com';
  const fileName = 'wildr_coin.png';
  const fileType = 'png';
  try {
    console.log(chalk.blue('\nCreating banner...'));
    conn = await createConnection(config as PostgresConnectionOptions);
    const bannerRepo = conn.getRepository(BannerEntity);
    const bannerFake = new BannerEntity({
      id: '8UBX9DXOzBk2bjLB',
      data: {
        content: {
          title: 'Start earning on Wildr!',
          description: 'Join the Waitlist',
          asset: {
            id: nanoid(16),
            path: `https://s3.us-west-2.amazonaws.com/${s3Bucket}/${fileName}`,
            type: fileType,
          },
          cta: 'Learn More',
          route: {
            __typename: 'WalletPageRoute',
          },
        },
        settings: {
          skipRefreshIntervalMilliseconds: 1000 * 60 * 60 * 24 * 7, // 1 week
          skipCount: 5,
          acl: [
            '-g8FwyaOwifoG7JU',
            'HI4wEOFDxp0-U7Fm',
            'P823mbOTIUFCkjso',
            'B-GoUJ-dkrPGQqwS',
            'MIXqJMG876um4cKf',
            'VBhJXoF2vPOi4Zed',
            'S49njX3XPaLUbvDI',
          ],
        },
        metadata: {
          marketingTags: ['wildr_coin_waitlist'],
        },
      },
      state: BannerState.TESTING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await bannerRepo.insert(bannerFake);
    console.log(
      chalk.green(
        '\nSuccessfully created banner!\n',
        JSON.stringify(bannerFake, null, 2)
      )
    );
  } catch (err) {
    console.log(chalk.red(err));
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

main();
