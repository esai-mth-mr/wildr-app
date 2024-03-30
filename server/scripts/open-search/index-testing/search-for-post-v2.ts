import '../../../tsconfig-paths-bootstrap';
import '../../../env/admin-local-config';

import { client, logAxiosError } from '../open-search-client';
import { Test } from '@nestjs/testing';
import { OSIndexingModule } from '@verdzie/server/open-search-v2/indexing/indexing.module';
import { OSQueryModule } from '@verdzie/server/open-search-v2/query/query.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { OSIndexVersionModule } from '@verdzie/server/open-search-v2/index-version/index-version-service.module';
import {
  IndexingJobType,
  IndexingRequest,
  OSIndexingService,
} from '@verdzie/server/open-search-v2/indexing/indexing.service';
import { ImagePostFake } from '@verdzie/server/post/testing/post.fake';
import { Connection } from 'typeorm';
import { PostEntity } from '@verdzie/server/post/post.entity';
import {
  POST_EXPLORE_V1_INDEX_NAME,
  POST_SEARCH_V1_INDEX_NAME,
} from '@verdzie/server/open-search-v2/index-version/post-index-version.config';
import { deleteOpenSearchMapping } from '@verdzie/test/utils/open-search';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  IndexVersionName,
  IndexVersionService,
} from '@verdzie/server/open-search-v2/index-version/index-version.service';

const SEVEN_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 7;

async function createAndIndexPosts({
  indexingService,
  conn,
  indexName,
}: {
  indexingService: OSIndexingService;
  conn: Connection;
  indexName: string;
}) {
  try {
    const author = UserEntityFake();
    author.setStats({ followerCount: 10 });
    const moderatelyPopularPost = ImagePostFake({
      authorId: author.id,
      categoryIds: ['1'],
      _stats: {
        likeCount: 100,
        commentCount: 10,
        shareCount: 1,
        realCount: 0,
        applauseCount: 0,
        reportCount: 0,
        repostCount: 0,
      },
      createdAt: new Date(),
    });
    const recentExtremelyPopularPost = ImagePostFake({
      authorId: author.id,
      categoryIds: ['1'],
      _stats: {
        likeCount: 1000,
        commentCount: 100,
        shareCount: 10,
        realCount: 0,
        applauseCount: 0,
        reportCount: 0,
        repostCount: 0,
      },
      createdAt: new Date(),
    });
    const oldExtremelyPopularPost = ImagePostFake({
      authorId: author.id,
      categoryIds: ['1'],
      _stats: {
        likeCount: 1000,
        commentCount: 100,
        shareCount: 10,
        realCount: 0,
        applauseCount: 0,
        reportCount: 0,
        repostCount: 0,
      },
      createdAt: new Date(Date.now() - SEVEN_DAYS_IN_MS),
    });
    const unpopularPost = ImagePostFake({
      authorId: author.id,
      categoryIds: ['1'],
      _stats: {
        likeCount: 1,
        commentCount: 0,
        shareCount: 0,
        realCount: 0,
        applauseCount: 0,
        reportCount: 0,
        repostCount: 0,
      },
      createdAt: new Date(),
    });
    const posts = [
      moderatelyPopularPost,
      recentExtremelyPopularPost,
      oldExtremelyPopularPost,
      unpopularPost,
    ];
    await conn.getRepository(UserEntity).insert(author);
    await conn.getRepository(PostEntity).insert(posts);
    const requests: IndexingRequest[] = posts.map(p => {
      return {
        id: `${p.id}`,
        requests: {
          production: POST_SEARCH_V1_INDEX_NAME,
        },
      };
    });
    await indexingService.indexMany(
      'PostEntity',
      requests,
      IndexingJobType.RE_INDEX
    );
    return { posts };
  } catch (error) {
    logAxiosError(error);
  }
}

async function search({
  query,
  indexName,
  indexVersionService,
}: {
  query: string;
  indexName: IndexVersionName;
  indexVersionService: IndexVersionService;
}) {
  try {
    const config = indexVersionService.findIndexVersions(PostEntity, [
      indexName,
    ])[0];
    if (!config) throw new Error('No config');
    const q = config.getQuery(query);
    const sort = !!config.getSort && config.getSort(query);
    const result = await client.post(`/${indexName}_production/_search`, {
      query: q,
      sort: sort ? sort : undefined,
      explain: true,
    });
    console.table(
      result?.data.hits.hits.map((hit: any) => {
        const row = { id: hit._id };
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
              'wildr-boost',
              'reaction_count',
              'comment_count',
              'created_at',
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

async function cleanUp({
  conn,
  indexName,
}: {
  conn: Connection;
  indexName?: string;
}) {
  try {
    if (indexName) await deleteOpenSearchMapping(`${indexName}_production`);
    await conn.synchronize(true);
  } catch (error) {
    logAxiosError(error);
  }
}

async function main() {
  try {
    SSMParamsService.Instance.updateParams();
    const module = await Test.createTestingModule({
      imports: [
        WinstonBeanstalkModule.forRoot(),
        WildrTypeormModule,
        WildrBullModule,
        OSIndexingModule,
        OSIndexVersionModule,
        OSQueryModule,
      ],
    }).compile();
    const indexingService = module.get(OSIndexingService);
    const indexName = POST_EXPLORE_V1_INDEX_NAME;
    await cleanUp({
      conn: module.get(Connection),
    });
    await indexingService.upsertMapping({
      entityName: 'PostEntity',
      indexVersionName: indexName,
      indexVersionAlias: 'production',
    });
    console.log('\nUpserted mapping');
    const result = await createAndIndexPosts({
      indexingService,
      indexName,
      conn: module.get(Connection),
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const queries = [''];
    for (const query of queries) {
      console.log('\nIndexed Posts');
      console.table(
        result?.posts.map(p => {
          return {
            id: p.id,
            likes: p._stats.likeCount,
            comments: p._stats.commentCount,
            shares: p._stats.shareCount,
            reposts: p._stats.repostCount,
            created: p.createdAt.toDateString(),
          };
        })
      );
      await search({
        query,
        indexName,
        indexVersionService: module.get(IndexVersionService),
      });
      console.log('\n');
    }
    await cleanUp({
      conn: module.get(Connection),
      indexName,
    });
  } catch (error) {
    logAxiosError(error);
  } finally {
    process.exit(0);
  }
}

main();
