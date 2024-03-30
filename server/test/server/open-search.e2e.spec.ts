import { INestApplication } from '@nestjs/common';
import { OSIndexingModule } from '@verdzie/server/open-search-v2/indexing/indexing.module';
import {
  IndexingJobType,
  IndexingRequest,
  OSIndexingService,
} from '@verdzie/server/open-search-v2/indexing/indexing.service';
import { OpenSearchModule } from '@verdzie/server/open-search/openSearch.module';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { Connection } from 'typeorm';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import {
  ImagePostFake,
  PostEntityFake,
  PublicPostEntityFake,
} from '@verdzie/server/post/testing/post.fake';
import {
  contentIOFake,
  textSegmentIOFake,
} from '@verdzie/server/content/testing/content-io.fake';
import supertest from 'supertest';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import { USER_RECENTLY_CREATED_INDEX_NAME } from '@verdzie/server/open-search-v2/index-version/user-index-version.config';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import Redis from 'ioredis';
import { getRedisConnection } from '@verdzie/test/utils/wildr-redis';
import { ESearchType } from '@verdzie/server/generated-graphql';
import { deleteOpenSearchMapping } from '@verdzie/test/utils/open-search';
import { TestingModule } from '@nestjs/testing';
import { sub } from 'date-fns';
import { POST_EXPLORE_V1_INDEX_NAME } from '@verdzie/server/open-search-v2/index-version/post-index-version.config';
import { tryAssertion } from '@verdzie/test/utils/try-assertion';
import { PostBaseType } from '@verdzie/server/post/postBaseType.enum';

describe('OpenSearch', () => {
  let app: INestApplication;
  let conn: Connection;
  let redis: Redis;
  let osIndexingService: OSIndexingService;
  let osIndexingModule: TestingModule;
  let openSearchModule: TestingModule;

  beforeAll(async () => {
    [osIndexingModule, openSearchModule] = await Promise.all([
      createMockedTestingModule({
        imports: [WildrTypeormModule, WildrBullModule, OSIndexingModule],
      }),
      createMockedTestingModule({
        imports: [
          GraphQLWithUploadModule.forRoot(),
          WildrTypeormModule,
          WildrBullModule,
          AuthModule,
          OpenSearchModule,
        ],
      }),
    ]);
    osIndexingService = osIndexingModule.get(OSIndexingService);
    app = openSearchModule.createNestApplication();
    conn = await getTestConnection();
    redis = await getRedisConnection();
    await conn.synchronize(true);
    await app.init();
  });

  beforeEach(async () => {
    await redis.flushall();
  });

  afterAll(async () => {
    await app.close();
    await redis.flushall();
    await conn.close();
    await osIndexingModule.close();
    await openSearchModule.close();
  });

  describe('Post Search', () => {
    const postSearchQuery = /* GraphQL */ `
      query PostSearch($input: ESInput!) {
        elasticSearch(input: $input) {
          ... on ESResult {
            result {
              ... on MultiMediaPost {
                id
              }
              ... on ImagePost {
                id
              }
              ... on TextPost {
                id
              }
            }
          }
          ... on SmartError {
            message
          }
        }
      }
    `;

    beforeEach(async () => {
      await conn.getRepository(PostEntity).delete({});
      await conn.getRepository(UserEntity).delete({});
    });

    afterAll(async () => {
      await conn.getRepository(PostEntity).delete({});
      await conn.getRepository(UserEntity).delete({});
    });

    describe('post_search_v1', () => {
      it('should return relevant posts', async () => {
        const authors = Array.from({ length: 3 }, () => UserEntityFake());
        await conn.getRepository(UserEntity).insert(authors);
        const posts = authors.map((author, i) => {
          if (i < 1) {
            const fakePost = PublicPostEntityFake({ authorId: author.id });
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
        await osIndexingService.upsertMapping({
          entityName: 'PostEntity',
          indexVersionName: 'post_search_v1',
          indexVersionAlias: 'production',
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        await osIndexingService.indexMany(
          'PostEntity',
          postIndexingRequests,
          IndexingJobType.INCREMENTAL_INDEX
        );
        await tryAssertion({
          assertionFn: async () => {
            const response = await supertest(app.getHttpServer())
              .post('/graphql')
              .send({
                query: postSearchQuery,
                variables: {
                  input: {
                    type: ESearchType.POST,
                    query: 'banana',
                  },
                },
              });
            const result = response.body.data.elasticSearch.result;
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(posts[0].id);
          },
          maxRetries: 20,
          retryInterval: 100,
        });
      });

      it('should return error when no posts are found', async () => {
        const authors = Array.from({ length: 3 }, () => UserEntityFake());
        await conn.getRepository(UserEntity).insert(authors);
        const posts = authors.map((author, i) => {
          if (i < 1) {
            const fakePost = PublicPostEntityFake({ authorId: author.id });
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
        await osIndexingService.upsertMapping({
          entityName: 'PostEntity',
          indexVersionName: 'post_search_v1',
          indexVersionAlias: 'production',
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        await osIndexingService.indexMany(
          'PostEntity',
          postIndexingRequests,
          IndexingJobType.INCREMENTAL_INDEX
        );
        await tryAssertion({
          assertionFn: async () => {
            const response = await supertest(app.getHttpServer())
              .post('/graphql')
              .send({
                query: postSearchQuery,
                variables: {
                  input: {
                    type: ESearchType.POST,
                    query: 'strawberry',
                  },
                },
              });
            const result = response.body.data.elasticSearch;
            expect(result.message).toBe('No posts found');
          },
          maxRetries: 20,
          retryInterval: 100,
        });
      });
    });

    describe('post_explore_v1', () => {
      const testAlias = 'production';
      const ALLOWED_CATEGORIES = ['banana', 'potato', 'apple'];

      beforeAll(async () => {
        await osIndexingService.upsertMapping({
          entityName: PostEntity.kEntityName,
          indexVersionName: POST_EXPLORE_V1_INDEX_NAME,
          indexVersionAlias: testAlias,
        });
      });

      afterAll(async () => {
        await deleteOpenSearchMapping(
          `${POST_EXPLORE_V1_INDEX_NAME}_${testAlias}`
        );
      });

      it('should return posts ordered by popularity', async () => {
        const author = UserEntityFake();
        await conn.getRepository(UserEntity).insert(author);
        const newPopularPost = ImagePostFake({
          authorId: author.id,
          categoryIds: ALLOWED_CATEGORIES,
          stats: {
            likeCount: 2000,
            realCount: 0,
            applauseCount: 0,
            shareCount: 100,
            commentCount: 500,
            reportCount: 0,
            repostCount: 30,
          },
          createdAt: sub(new Date(), { days: 1 }),
        });
        const oldPopularPost = ImagePostFake({
          authorId: author.id,
          categoryIds: ALLOWED_CATEGORIES,
          stats: {
            likeCount: 1000,
            realCount: 0,
            applauseCount: 0,
            shareCount: 100,
            commentCount: 500,
            reportCount: 0,
            repostCount: 30,
          },
          createdAt: sub(new Date(), { days: 14 }),
        });
        const newUnpopularPost = ImagePostFake({
          authorId: author.id,
          categoryIds: ALLOWED_CATEGORIES,
          stats: {
            likeCount: 10,
            realCount: 0,
            applauseCount: 0,
            shareCount: 10,
            commentCount: 1,
            reportCount: 0,
            repostCount: 0,
          },
          createdAt: sub(new Date(), { days: 1 }),
        });
        const newModeratelyPopularPost = ImagePostFake({
          authorId: author.id,
          categoryIds: ALLOWED_CATEGORIES,
          stats: {
            likeCount: 100,
            realCount: 0,
            applauseCount: 0,
            shareCount: 10,
            commentCount: 10,
            reportCount: 0,
            repostCount: 5,
          },
          createdAt: sub(new Date(), { days: 1 }),
        });
        const posts = [
          newPopularPost,
          oldPopularPost,
          newUnpopularPost,
          newModeratelyPopularPost,
        ];
        await conn.getRepository(PostEntity).insert(posts);
        const postIndexingRequests: IndexingRequest[] = [];
        for (const post of posts) {
          postIndexingRequests.push({
            id: post.id,
            requests: {
              [testAlias]: POST_EXPLORE_V1_INDEX_NAME,
            },
          });
        }
        await osIndexingService.indexMany(
          PostEntity.kEntityName,
          postIndexingRequests,
          IndexingJobType.RE_INDEX
        );
        await new Promise(resolve => setTimeout(resolve, 500));
        await tryAssertion({
          assertionFn: async () => {
            const response = await supertest(app.getHttpServer())
              .post('/graphql')
              .send({
                query: postSearchQuery,
                variables: {
                  input: {
                    type: ESearchType.POST,
                    query: '',
                  },
                },
              });
            const result = response.body.data.elasticSearch.result;
            expect(result.length).toBe(4);
            expect(result[0].id).toBe(newPopularPost.id);
            expect(result[1].id).toBe(newModeratelyPopularPost.id);
            expect(result[2].id).toBe(oldPopularPost.id);
            expect(result[3].id).toBe(newUnpopularPost.id);
          },
          maxRetries: 20,
          retryInterval: 100,
        });
      });

      it('should not show reposts or stories', async () => {
        const author = UserEntityFake();
        await conn.getRepository(UserEntity).insert(author);
        const popularRepost = ImagePostFake({
          authorId: author.id,
          categoryIds: ALLOWED_CATEGORIES,
          stats: {
            likeCount: 2000,
            realCount: 0,
            applauseCount: 0,
            shareCount: 100,
            commentCount: 500,
            reportCount: 0,
            repostCount: 30,
          },
          createdAt: sub(new Date(), { days: 1 }),
          baseType: PostBaseType.REPOST,
        });
        const popularStory = ImagePostFake({
          authorId: author.id,
          categoryIds: ALLOWED_CATEGORIES,
          stats: {
            likeCount: 2000,
            realCount: 0,
            applauseCount: 0,
            shareCount: 100,
            commentCount: 500,
            reportCount: 0,
            repostCount: 30,
          },
          createdAt: sub(new Date(), { days: 1 }),
          baseType: PostBaseType.STORY,
        });
        const posts = [popularRepost, popularStory];
        await conn.getRepository(PostEntity).insert(posts);
        const postIndexingRequests: IndexingRequest[] = [];
        for (const post of posts) {
          postIndexingRequests.push({
            id: post.id,
            requests: {
              [testAlias]: POST_EXPLORE_V1_INDEX_NAME,
            },
          });
        }
        await osIndexingService.indexMany(
          PostEntity.kEntityName,
          postIndexingRequests,
          IndexingJobType.RE_INDEX
        );
        await new Promise(resolve => setTimeout(resolve, 500));
        await tryAssertion({
          assertionFn: async () => {
            const response = await supertest(app.getHttpServer())
              .post('/graphql')
              .send({
                query: postSearchQuery,
                variables: {
                  input: {
                    type: ESearchType.POST,
                    query: '',
                  },
                },
              });
            const result = response.body.data.elasticSearch;
            expect(result.message).toBe('No posts found');
          },
          maxRetries: 20,
          retryInterval: 100,
        });
      });

      it('should not show posts without categories', async () => {
        const author = UserEntityFake();
        await conn.getRepository(UserEntity).insert(author);
        const popularRepost = ImagePostFake({
          authorId: author.id,
          stats: {
            likeCount: 2000,
            realCount: 0,
            applauseCount: 0,
            shareCount: 100,
            commentCount: 500,
            reportCount: 0,
            repostCount: 30,
          },
          createdAt: sub(new Date(), { days: 1 }),
        });
        const posts = [popularRepost];
        await conn.getRepository(PostEntity).insert(posts);
        const postIndexingRequests: IndexingRequest[] = [];
        for (const post of posts) {
          postIndexingRequests.push({
            id: post.id,
            requests: {
              [testAlias]: POST_EXPLORE_V1_INDEX_NAME,
            },
          });
        }
        await osIndexingService.indexMany(
          PostEntity.kEntityName,
          postIndexingRequests,
          IndexingJobType.RE_INDEX
        );
        await new Promise(resolve => setTimeout(resolve, 500));
        await tryAssertion({
          assertionFn: async () => {
            const response = await supertest(app.getHttpServer())
              .post('/graphql')
              .send({
                query: postSearchQuery,
                variables: {
                  input: {
                    type: ESearchType.POST,
                    query: '',
                  },
                },
              });
            const result = response.body.data.elasticSearch;
            expect(result.message).toBe('No posts found');
          },
          maxRetries: 20,
          retryInterval: 100,
        });
      });

      it('should only show posts with allowed categories', async () => {
        const author = UserEntityFake();
        await conn.getRepository(UserEntity).insert(author);
        const popularRepost = ImagePostFake({
          authorId: author.id,
          categoryIds: ['strawberry'],
          stats: {
            likeCount: 2000,
            realCount: 0,
            applauseCount: 0,
            shareCount: 100,
            commentCount: 500,
            reportCount: 0,
            repostCount: 30,
          },
          createdAt: sub(new Date(), { days: 1 }),
        });
        const posts = [popularRepost];
        await conn.getRepository(PostEntity).insert(posts);
        const postIndexingRequests: IndexingRequest[] = [];
        for (const post of posts) {
          postIndexingRequests.push({
            id: post.id,
            requests: {
              [testAlias]: POST_EXPLORE_V1_INDEX_NAME,
            },
          });
        }
        await osIndexingService.indexMany(
          PostEntity.kEntityName,
          postIndexingRequests,
          IndexingJobType.RE_INDEX
        );
        await new Promise(resolve => setTimeout(resolve, 500));
        await tryAssertion({
          assertionFn: async () => {
            const response = await supertest(app.getHttpServer())
              .post('/graphql')
              .send({
                query: postSearchQuery,
                variables: {
                  input: {
                    type: ESearchType.POST,
                    query: '',
                  },
                },
              });
            const result = response.body.data.elasticSearch;
            expect(result.message).toBe('No posts found');
          },
          maxRetries: 20,
          retryInterval: 100,
        });
      });

      it('should not allow private posts', async () => {
        const author = UserEntityFake();
        await conn.getRepository(UserEntity).insert(author);
        const popularRepost = ImagePostFake({
          authorId: author.id,
          categoryIds: ['strawberry'],
          stats: {
            likeCount: 2000,
            realCount: 0,
            applauseCount: 0,
            shareCount: 100,
            commentCount: 500,
            reportCount: 0,
            repostCount: 30,
          },
          createdAt: sub(new Date(), { days: 1 }),
          isPrivate: true,
        });
        const posts = [popularRepost];
        await conn.getRepository(PostEntity).insert(posts);
        const postIndexingRequests: IndexingRequest[] = [];
        for (const post of posts) {
          postIndexingRequests.push({
            id: post.id,
            requests: {
              [testAlias]: POST_EXPLORE_V1_INDEX_NAME,
            },
          });
        }
        await osIndexingService.indexMany(
          PostEntity.kEntityName,
          postIndexingRequests,
          IndexingJobType.RE_INDEX
        );
        await new Promise(resolve => setTimeout(resolve, 500));
        await tryAssertion({
          assertionFn: async () => {
            const response = await supertest(app.getHttpServer())
              .post('/graphql')
              .send({
                query: postSearchQuery,
                variables: {
                  input: {
                    type: ESearchType.POST,
                    query: '',
                  },
                },
              });
            const result = response.body.data.elasticSearch;
            expect(result.message).toBe('No posts found');
          },
          maxRetries: 20,
          retryInterval: 100,
        });
      });
    });
  });

  describe('User Search', () => {
    const userSearchQuery = /* GraphQL */ `
      query UserSearch($input: ESInput!) {
        elasticSearch(input: $input) {
          ... on ESResult {
            result {
              ... on User {
                id
              }
            }
          }
          ... on SmartError {
            message
          }
        }
      }
    `;

    beforeEach(async () => {
      await conn.getRepository(UserEntity).delete({});
    });

    afterAll(async () => {
      await conn.getRepository(UserEntity).delete({});
    });

    describe('user_search_v1', () => {
      beforeAll(async () => {
        await osIndexingService.upsertMapping({
          entityName: 'UserEntity',
          indexVersionName: 'user_search_v1',
          indexVersionAlias: 'production',
        });
      });

      afterAll(async () => {
        await deleteOpenSearchMapping('user_search_v1_production');
      });

      it('should return users with matching handles', async () => {
        const users = [
          UserEntityFake({ handle: 'banana' }),
          UserEntityFake({ handle: 'potato' }),
          UserEntityFake({ handle: 'apple' }),
        ];
        await conn.getRepository(UserEntity).insert(users);
        const userIndexingRequests: IndexingRequest[] = [];
        for (const user of users) {
          userIndexingRequests.push({
            id: user.id,
            requests: {
              production: 'user_search_v1',
            },
          });
        }
        await osIndexingService.indexMany(
          'UserEntity',
          userIndexingRequests,
          IndexingJobType.INCREMENTAL_INDEX
        );
        for (let i = 0; i < 20; i++) {
          try {
            const response = await supertest(app.getHttpServer())
              .post('/graphql')
              .send({
                query: userSearchQuery,
                variables: {
                  input: {
                    type: ESearchType.USER,
                    query: 'banana',
                  },
                },
              });
            const result = response.body.data.elasticSearch.result;
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(users[0].id);
          } catch (error) {
            if (i === 19) throw error;
            // waiting for indexing to finish
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      });

      it('should return users with matching names', async () => {
        const users = [
          UserEntityFake({ name: 'banana' }),
          UserEntityFake({ name: 'potato' }),
          UserEntityFake({ name: 'apple' }),
        ];
        await conn.getRepository(UserEntity).insert(users);
        const userIndexingRequests: IndexingRequest[] = [];
        for (const user of users) {
          userIndexingRequests.push({
            id: user.id,
            requests: {
              production: 'user_search_v1',
            },
          });
        }
        await osIndexingService.indexMany(
          'UserEntity',
          userIndexingRequests,
          IndexingJobType.INCREMENTAL_INDEX
        );
        for (let i = 0; i < 20; i++) {
          try {
            const response = await supertest(app.getHttpServer())
              .post('/graphql')
              .send({
                query: userSearchQuery,
                variables: {
                  input: {
                    type: ESearchType.USER,
                    query: 'banana',
                  },
                },
              });
            const result = response.body.data.elasticSearch.result;
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(users[0].id);
          } catch (error) {
            if (i === 19) throw error;
            // waiting for indexing to finish
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      });

      it('should return error when no users are found', async () => {
        const users = [
          UserEntityFake({ name: 'banana' }),
          UserEntityFake({ name: 'potato' }),
          UserEntityFake({ name: 'apple' }),
        ];
        await conn.getRepository(UserEntity).insert(users);
        const userIndexingRequests: IndexingRequest[] = [];
        for (const user of users) {
          userIndexingRequests.push({
            id: user.id,
            requests: {
              production: 'user_search_v1',
            },
          });
        }
        await osIndexingService.indexMany(
          'UserEntity',
          userIndexingRequests,
          IndexingJobType.INCREMENTAL_INDEX
        );
        await tryAssertion({
          assertionFn: async () => {
            const response = await supertest(app.getHttpServer())
              .post('/graphql')
              .send({
                query: userSearchQuery,
                variables: {
                  input: {
                    type: ESearchType.USER,
                    query: 'strawberry',
                  },
                },
              });
            const result = response.body.data.elasticSearch;
            expect(result.message).toBe('No users found');
          },
          maxRetries: 20,
          retryInterval: 100,
        });
      });
    });

    describe('recently_created_users_v1', () => {
      beforeAll(async () => {
        await osIndexingService.upsertMapping({
          entityName: 'UserEntity',
          indexVersionName: USER_RECENTLY_CREATED_INDEX_NAME,
          indexVersionAlias: 'production',
        });
      });

      afterAll(async () => {
        await deleteOpenSearchMapping(
          `${USER_RECENTLY_CREATED_INDEX_NAME}_production`
        );
      });

      it('should return recently created users excluding those without avatars', async () => {
        const userWithoutAvatar = UserEntityFake();
        userWithoutAvatar.avatarImage = undefined;
        userWithoutAvatar.createdAt = new Date(Date.now());
        const firstUser = UserEntityFake({
          createdAt: sub(new Date(), { days: 1 }),
        });
        const secondUser = UserEntityFake({
          createdAt: sub(new Date(), { days: 2 }),
        });
        const thirdUser = UserEntityFake({
          createdAt: sub(new Date(), { days: 3 }),
        });
        const users = [userWithoutAvatar, secondUser, thirdUser, firstUser];
        await conn.getRepository(UserEntity).insert(users);
        const userIndexingRequests: IndexingRequest[] = [];
        for (const user of users) {
          userIndexingRequests.push({
            id: user.id,
            requests: {
              production: USER_RECENTLY_CREATED_INDEX_NAME,
            },
          });
        }
        await osIndexingService.indexMany(
          'UserEntity',
          userIndexingRequests,
          IndexingJobType.INCREMENTAL_INDEX
        );
        for (let i = 0; i < 20; i++) {
          try {
            const response = await supertest(app.getHttpServer())
              .post('/graphql')
              .send({
                query: userSearchQuery,
                variables: {
                  input: {
                    type: ESearchType.USER,
                    query: '',
                  },
                },
              });
            // filtered out user without avatar
            const result = response.body.data.elasticSearch.result;
            expect(result.length).toBe(3);
            expect(result[0].id).toBe(firstUser.id);
            expect(result[1].id).toBe(secondUser.id);
            expect(result[2].id).toBe(thirdUser.id);
          } catch (error) {
            if (i === 19) throw error;
            // waiting for indexing to finish
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      });
    });
  });
});
