import { INestApplication } from '@nestjs/common';
import { AdminPostModule } from '@verdzie/server/admin/post/adminPost.module';
import { OSIndexingModule } from '@verdzie/server/open-search-v2/indexing/indexing.module';
import {
  IndexingJobType,
  IndexingRequest,
  OSIndexingService,
} from '@verdzie/server/open-search-v2/indexing/indexing.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostEntityFake } from '@verdzie/server/post/testing/post.fake';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { Connection } from 'typeorm';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import supertest from 'supertest';
import {
  contentIOFake,
  textSegmentIOFake,
} from '@verdzie/server/content/testing/content-io.fake';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';

describe('AdminPostController', () => {
  let app: INestApplication;
  let conn: Connection;
  let osIndexingService: OSIndexingService;

  beforeAll(async () => {
    const [osIndexingModule, adminPostModule] = await Promise.all([
      createMockedTestingModule({
        imports: [WildrTypeormModule, WildrBullModule, OSIndexingModule],
      }),
      createMockedTestingModule({
        imports: [WildrTypeormModule, WildrBullModule, AdminPostModule],
      }),
    ]);
    osIndexingService = osIndexingModule.get(OSIndexingService);
    app = adminPostModule.createNestApplication();
    conn = await getTestConnection();
    await conn.synchronize(true);
    await app.init();
    await app.listen(Number(process.env.ADMIN_HTTP_PORT));
  });

  afterEach(async () => {
    await conn.getRepository(PostEntity).delete({});
    await conn.getRepository(UserEntity).delete({});
  });

  afterAll(async () => {
    await app.close();
    await conn.close();
  });

  describe('getUnannotatedPosts', () => {
    it('should return unannotated posts', async () => {
      const author = UserEntityFake();
      const posts = Array.from({ length: 3 }, () => {
        const fakePost = PostEntityFake({ authorId: author.id });
        fakePost.categoryIds = undefined;
        return fakePost;
      });
      await conn.getRepository(UserEntity).insert(author);
      await conn.getRepository(PostEntity).insert(posts);
      const response = await supertest(app.getHttpServer())
        .get('/post/unannotated')
        .query({
          date: new Date().toISOString(),
          limit: 10,
          skip: 0,
        });
      expect(response.body.data).toHaveLength(3);
      for (const post of posts) {
        const matchingPost = response.body.data.find(
          (p: any) => p.id === post.id
        );
        expect(matchingPost).toBeDefined();
        expect(matchingPost._stats).toEqual(post._stats);
        expect(matchingPost.multiPostProperties).toEqual(
          post.multiPostProperties
        );
        expect(matchingPost.activityData).toEqual(post.activityData);
        expect(matchingPost.isPrivate).toEqual(post.isPrivate);
        expect(matchingPost.categoryIds).toEqual(null);
      }
    });
  });

  describe.skip('search', () => {
    it('should return posts from open search', async () => {
      const authors = Array.from({ length: 3 }, () => UserEntityFake());
      await conn.getRepository(UserEntity).insert(authors);
      const posts = authors.map((author, i) => {
        if (i < 1) {
          const fakePost = PostEntityFake({ authorId: author.id });
          fakePost.caption = contentIOFake({
            segments: Array.from({ length: 3 }, () => {
              return {
                segment: textSegmentIOFake({ chunk: 'banana' }),
              };
            }),
          });
          return fakePost;
        } else {
          const fakePost = PostEntityFake({ authorId: author.id });
          fakePost.caption = contentIOFake({
            segments: Array.from({ length: 3 }, () => {
              return {
                segment: textSegmentIOFake({ chunk: 'potato' }),
              };
            }),
          });
          return fakePost;
        }
      });
      await conn.getRepository(PostEntity).insert(posts);
      const postIndexingRequests: IndexingRequest[] = [];
      for (const post of posts) {
        postIndexingRequests.push({
          id: post.id,
          requests: {
            production: 'post_search_v1',
          },
        });
      }
      await osIndexingService.indexMany(
        'PostEntity',
        postIndexingRequests,
        IndexingJobType.RE_INDEX
      );
      // Wait for open search index update to propagate
      await new Promise(r => setTimeout(r, 1000));
      const response = await supertest(app.getHttpServer())
        .post('/post/search')
        .send({
          searchQuery: 'banana',
        });
      expect(response.body.posts).toHaveLength(1);
    });
  });
});
