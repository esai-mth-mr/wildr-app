import '../../../tsconfig-paths-bootstrap';
import * as dotenv from 'dotenv';
import '../../env/admin-local-config';

import {
  client,
  createDocument,
  deleteDocument,
  logAxiosError,
} from '../open-search-client';
import { Test } from '@nestjs/testing';
import { OSIndexingModule } from '@verdzie/server/open-search-v2/indexing/indexing.module';
import { OSQueryModule } from '@verdzie/server/open-search-v2/query/query.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { OSIndexVersionModule } from '@verdzie/server/open-search-v2/index-version/index-version-service.module';
import { IndexVersionService } from '@verdzie/server/open-search-v2/index-version/index-version.service';
import { USER_SEARCH_V1_INDEX_NAME } from '@verdzie/server/open-search-v2/index-version/user-index-version.config';
import { OSIndexingService } from '@verdzie/server/open-search-v2/indexing/indexing.service';

async function createUsers() {
  try {
    const users = [
      {
        handle: 'thudson',
        name: 'Thomas Hudson',
        imageUrl: 'https://wildcards.world/images/avatars/1.png',
        wallet_address: 'thudson',
        updated_at: new Date().toISOString(),
        follower_count: 10,
        wildr_boost: 5,
        profile_picture: true,
      },
      {
        handle: 'thurston',
        name: 'Thurston Backer',
        imageUrl: 'https://wildcards.world/images/avatars/2.png',
        wallet_address: 'thurston',
        updated_at: new Date().toISOString(),
        follower_count: 100,
        wildr_boost: 1,
        profile_picture: true,
      },
      {
        handle: 'thermion',
        name: 'Thermion Wildcard',
        imageUrl: 'https://wildcards.world/images/avatars/2.png',
        wallet_address: 'thermion',
        updated_at: new Date().toISOString(),
        follower_count: 1000,
        wildr_boost: 1,
        profile_picture: false,
      },
      {
        handle: 'thanos',
        name: 'Thanos Wildcard',
        imageUrl: 'https://wildcards.world/images/avatars/2.png',
        wallet_address: 'thanos',
        updated_at: new Date().toISOString(),
        follower_count: 100,
        wildr_boost: 1,
        profile_picture: true,
      },
      {
        handle: 'brad',
        name: 'Brad Wildcard',
        imageUrl: 'https://wildcards.world/images/avatars/3.png',
        wallet_address: 'brad',
        updated_at: new Date().toISOString(),
        follower_count: 0,
        wildr_boost: 1,
        profile_picture: false,
      },
      {
        handle: 'james',
        name: 'James Wildcard',
        imageUrl: 'https://wildcards.world/images/avatars/4.png',
        wallet_address: 'james',
        updated_at: new Date().toISOString(),
        wildr_boost: 1,
        follower_count: 50,
        profile_picture: true,
      },
      {
        handle: 'om_swami',
        name: 'Om Swami',
        imageUrl: 'https://wildcards.world/images/avatars/5.png',
        wallet_address: 'om_swami',
        updated_at: new Date().toISOString(),
        wildr_boost: 1,
        follower_count: 1000,
        profile_picture: false,
      },
      {
        handle: 'sam',
        name: 'Sam Wildcard',
        imageUrl: 'https://wildcards.world/images/avatars/6.png',
        wallet_address: 'sam',
        updated_at: new Date().toISOString(),
        wildr_boost: 1,
        follower_count: 500,
        profile_picture: false,
      },
      {
        handle: 'jow_Jeff',
        name: 'Jow Jeff',
        imageUrl: 'https://wildcards.world/images/avatars/7.png',
        wallet_address: 'jow_Jeff',
        updated_at: new Date().toISOString(),
        wildr_boost: 1,
        follower_count: 100,
        profile_picture: false,
      },
    ];

    const userIds = await Promise.all(
      users.map(async (user, i) => {
        await createDocument('users_2', `${i}`, user);
        return i;
      })
    );

    console.log('\nCreated users');

    return { users, userIds };
  } catch (error) {
    logAxiosError(error);
  }
}

async function search(query: string) {
  const module = await Test.createTestingModule({
    imports: [
      WildrTypeormModule,
      WildrBullModule,
      OSIndexingModule,
      OSIndexVersionModule,
      OSQueryModule,
    ],
  }).compile();
  const indexingService = module.get(OSIndexingService);
  const indexVersionService = module.get(IndexVersionService);

  try {
    const q =
      // @ts-ignore
      indexVersionService.indexVersionConfigs[
        USER_SEARCH_V1_INDEX_NAME
      ].getQuery(query);
    // @ts-ignore
    const sort = indexingService.getSort(USER_SEARCH_V1_INDEX_NAME, query);
    console.log({ query, sort });

    const result = await client.post(`/${USER_SEARCH_V1_INDEX_NAME}/_search`, {
      query: q,
      sort,
    });

    console.table(
      result?.data.hits.hits.map((hit: any) => {
        const row = { username: hit._source.handle };

        const addDetails = (explanation: any, row: any) => {
          if (
            explanation.details.length &&
            explanation.details[0].description !== '_score: '
          ) {
            for (const detail of explanation.details) {
              addDetails(detail, row);
            }
          } else {
            const rowNames = [
              'wildr_boost',
              'follower_count',
              'profile_picture',
              'name',
              'handle',
            ];
            for (const rowName of rowNames) {
              if (explanation.description.includes(rowName)) {
                row[rowName] = explanation.value;
              }
            }
          }
        };

        addDetails(hit._explanation, row);

        // @ts-ignore
        row.total = hit._score;

        return row;
      })
    );

    if (!result?.data.hits.hits.length) {
      console.log('No results');
      return;
    }

    return result;
  } catch (error) {
    logAxiosError(error);
  }
}

async function deleteUsers(userIds: number[]) {
  try {
    await Promise.all(
      userIds.map(async userId => {
        await deleteDocument('users_2', `${userId}`);
      })
    );
    console.log('Deleted users');
  } catch (error) {
    logAxiosError(error);
  }
}

async function main() {
  try {
    const result = await createUsers();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const queries = [
      '',
      'om',
      'sw',
      'om_swami',
      'om swami',
      't',
      'th',
      'thu',
      'hud',
      'thudson',
      'j',
      'je',
    ];

    for (const query of queries) {
      console.log('\nIndexed Users');
      console.table(
        result?.users.map(u => {
          return {
            handle: u.handle,
            name: u.name,
            wildr_boost: u.wildr_boost,
            follower_count: u.follower_count,
            profile_picture: u.profile_picture,
          };
        })
      );
      await search(query);
      console.log('\n');
    }

    if (result?.userIds) {
      await deleteUsers(result.userIds);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    logAxiosError(error);
  }
}

main();
