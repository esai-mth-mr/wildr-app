import { INestApplication } from '@nestjs/common';
import { GraphQLWithUploadModule } from '@verdzie/server/app.module';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import { ChallengeAccessControlModule } from '@verdzie/server/challenge/challenge-access-control/challengeAccessControl.module';
import { ChallengeCommentModule } from '@verdzie/server/challenge/challenge-comment/challenge-comment-module';
import { ChallengeEntriesModule } from '@verdzie/server/challenge/challenge-entries/challengeEntries.module';
import { ChallengeParticipantsModule } from '@verdzie/server/challenge/challenge-participants/challengeParticipants.module';
import { ChallengePostEntryModule } from '@verdzie/server/challenge/challenge-post-entry/challengePostEntry.module';
import { ChallengeRepositoryModule } from '@verdzie/server/challenge/challenge-repository/challenge.repository.module';
import { ChallengeResolverModule } from '@verdzie/server/challenge/challenge-resolver/challengeResolver.module';
import { ChallengeUpdateStatsModule } from '@verdzie/server/challenge/challenge-update-stats/challengeUpdateStats.module';
import { ChallengeModule } from '@verdzie/server/challenge/challenge.module';
import { FeedResolverModule } from '@verdzie/server/feed/feed.resolver.module';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { Connection } from 'typeorm';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import {
  ChallengeCoverEnum,
  ChallengeListType,
  ChallengeState,
  CreateChallengeInput,
  ReportType,
  SegmentType,
} from '@verdzie/server/generated-graphql';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  getChallengeLeaderboardFeedId,
  getChallengeParticipantsFeedId,
  getUserPostEntriesOnChallengeFeedId,
  toChallengeParticipantIdString,
  toFeaturedChallengesIdString,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { toChallengeLeaderboardEdge } from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.common';
import supertest from 'supertest';
import { getJWT } from '@verdzie/test/utils/auth';
import { last } from 'lodash';
import {
  globalActiveChallengesFeedId,
  globalAllChallengesFeedId,
  globalFeaturedChallengesFeedId,
  globalPastChallengesFeedId,
} from '@verdzie/server/challenge/challenge.service';
import { getFirstFeedPageId } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { PostEntity } from '@verdzie/server/post/post.entity';
import {
  PostCategoryEntity,
  toPostCategoryTypeLabel,
} from '@verdzie/server/post-category/postCategory.entity';
import { PostCategoryEntityFake } from '@verdzie/server/post-category/testing/postCategory-entity.fake';
import {
  addJoinedChallenge,
  fromUserJoinedChallengeString,
  toUserJoinedChallengeString,
} from '@verdzie/server/challenge/userJoinedChallenges.helper';
import { sub } from 'date-fns';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';

describe('Challenge', () => {
  let app: INestApplication;
  let conn: Connection;

  beforeAll(async () => {
    const appModule = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        WildrBullModule,
        GraphQLWithUploadModule.forRoot(),
        AuthModule,
        FeedResolverModule,
        ChallengeModule,
        ChallengeRepositoryModule,
        ChallengePostEntryModule,
        ChallengeAccessControlModule,
        ChallengeEntriesModule,
        ChallengeParticipantsModule,
        ChallengeResolverModule,
        ChallengeUpdateStatsModule,
        ChallengeCommentModule,
      ],
    });
    app = appModule.createNestApplication();
    conn = await getTestConnection();
    await conn.synchronize(true);
    await app.init();
  });

  const cleanDb = async () => {
    await conn.getRepository(PostEntity).delete({});
    await conn.getRepository(ChallengeEntity).delete({});
    await conn.getRepository(UserEntity).delete({});
    await conn.getRepository(FeedEntity).delete({});
  };

  beforeEach(cleanDb);

  afterAll(async () => {
    await cleanDb();
    await app.close();
    await conn.close();
  });

  describe('categories', () => {
    const getChallengeWithCategoriesQuery = /* GraphQL */ `
      query GetChallengeWithCategories($input: GetChallengeInput!) {
        getChallenge(input: $input) {
          ... on GetChallengeResult {
            challenge {
              __typename
              id
              categories {
                __typename
                id
                value
                type
              }
            }
          }
          ... on SmartError {
            __typename
            message
          }
        }
      }
    `;

    beforeEach(async () => {
      await conn.getRepository(PostCategoryEntity).delete({});
    });

    it('should return the categories of a challenge', async () => {
      const user = UserEntityFake();
      const challengeAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([user, challengeAuthor]);
      const categories = Array.from({ length: 3 }, () =>
        PostCategoryEntityFake()
      );
      await conn.getRepository(PostCategoryEntity).insert(categories);
      const challenge = ChallengeEntityFake({
        authorId: challengeAuthor.id,
        categoryIds: [categories[0].id, categories[1].id],
      });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: getChallengeWithCategoriesQuery,
          variables: {
            input: {
              id: challenge.id,
            },
          },
        });
      expect(result.body.data.getChallenge.challenge.categories).toEqual([
        {
          __typename: 'PostCategory',
          id: categories[0].id,
          value: categories[0].name,
          type: toPostCategoryTypeLabel(categories[0].type),
        },
        {
          __typename: 'PostCategory',
          id: categories[1].id,
          value: categories[1].name,
          type: toPostCategoryTypeLabel(categories[1].type),
        },
      ]);
    });

    it('should return an empty list if challenge has no categories', async () => {
      const user = UserEntityFake();
      const challengeAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert([user, challengeAuthor]);
      const categories = Array.from({ length: 3 }, () =>
        PostCategoryEntityFake()
      );
      await conn.getRepository(PostCategoryEntity).insert(categories);
      const challenge = ChallengeEntityFake({
        authorId: challengeAuthor.id,
        categoryIds: [],
      });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(user)}`)
        .send({
          query: getChallengeWithCategoriesQuery,
          variables: {
            input: {
              id: challenge.id,
            },
          },
        });
      expect(result.body.data.getChallenge.challenge.categories).toEqual([]);
    });
  });

  describe('getChallenges', () => {
    const getChallengesQuery = /* GraphQL */ `
      query GetChallenges($input: GetChallengesInput!) {
        getChallenges(input: $input) {
          ... on GetChallengesResult {
            __typename
            edges {
              cursor
              node {
                id
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
              pageNumber
              count
              totalCount
            }
          }
          ... on SmartError {
            __typename
            message
          }
        }
      }
    `;

    describe(ChallengeListType.FEATURED, () => {
      it('should paginate through the featured challenges', async () => {
        const author = UserEntityFake();
        const author2 = UserEntityFake();
        await conn.getRepository(UserEntity).insert([author, author2]);
        const oldChallenges = [
          ChallengeEntityFake({
            authorId: author.id,
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          }),
          ChallengeEntityFake({
            authorId: author.id,
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          }),
        ];
        const newChallenges = Array.from({ length: 4 }, () =>
          ChallengeEntityFake({
            authorId: author2.id,
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
          })
        );
        await conn
          .getRepository(ChallengeEntity)
          .insert([...oldChallenges, ...newChallenges]);
        const globalFeaturedChallengesFeed = FeedEntityFake({
          id: globalFeaturedChallengesFeedId,
        });
        globalFeaturedChallengesFeed.page.ids = [
          ...oldChallenges
            .slice()
            .reverse()
            .map(c =>
              toFeaturedChallengesIdString({
                id: c.id,
                endDate: c.endDate,
              })
            ),
          ...newChallenges
            .slice()
            .reverse()
            .map(c =>
              toFeaturedChallengesIdString({
                id: c.id,
                endDate: c.endDate,
              })
            ),
        ];
        await conn
          .getRepository(FeedEntity)
          .delete(globalFeaturedChallengesFeed.id);
        await conn
          .getRepository(FeedEntity)
          .insert(globalFeaturedChallengesFeed);
        const firstPageResult = await supertest(app.getHttpServer())
          .post('/graphql')
          .send({
            query: getChallengesQuery,
            variables: {
              input: {
                type: ChallengeListType.FEATURED,
                paginationInput: {
                  take: 3,
                },
              },
            },
          })
          .expect(200);
        const firstPageEdges = firstPageResult.body.data.getChallenges.edges;
        expect(firstPageEdges.length).toEqual(3);
        expect(firstPageEdges[0].node.id).toEqual(newChallenges[0].id);
        expect(firstPageEdges[1].node.id).toEqual(newChallenges[1].id);
        expect(firstPageEdges[2].node.id).toEqual(newChallenges[2].id);
        expect(firstPageResult.body.data.getChallenges.pageInfo).toEqual({
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: firstPageEdges[0].cursor,
          endCursor: firstPageEdges[2].cursor,
          count: 3,
          pageNumber: null,
          totalCount: 6,
        });
        const secondPageResult = await supertest(app.getHttpServer())
          .post('/graphql')
          .send({
            query: getChallengesQuery,
            variables: {
              input: {
                type: ChallengeListType.FEATURED,
                paginationInput: {
                  take: 3,
                  after:
                    firstPageResult.body.data.getChallenges.pageInfo.endCursor,
                },
              },
            },
          })
          .expect(200);
        const secondPageEdges = secondPageResult.body.data.getChallenges.edges;
        expect(secondPageEdges.length).toEqual(3);
        expect(secondPageEdges[0].node.id).toEqual(newChallenges[3].id);
        expect(secondPageEdges[1].node.id).toEqual(oldChallenges[0].id);
        expect(secondPageEdges[2].node.id).toEqual(oldChallenges[1].id);
        expect(secondPageResult.body.data.getChallenges.pageInfo).toEqual({
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: secondPageEdges[0].cursor,
          endCursor: secondPageEdges[2].cursor,
          count: 3,
          pageNumber: null,
          totalCount: 6,
        });
      });
    });

    describe(ChallengeListType.ALL, () => {
      it('should paginate through all challenges', async () => {
        const author = UserEntityFake();
        const author2 = UserEntityFake();
        await conn.getRepository(UserEntity).insert([author, author2]);
        const challenges = Array.from({ length: 6 }, () => {
          return ChallengeEntityFake({
            authorId: author.id,
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
          });
        });
        await conn.getRepository(ChallengeEntity).insert(challenges);
        const globalAllChallengesFeed = FeedEntityFake({
          id: globalAllChallengesFeedId,
        });
        globalAllChallengesFeed.page.ids = [...challenges.map(c => c.id)];
        globalAllChallengesFeed.count = challenges.length;
        await conn.getRepository(FeedEntity).insert(globalAllChallengesFeed);
        const firstPageResult = await supertest(app.getHttpServer())
          .post('/graphql')
          .send({
            query: getChallengesQuery,
            variables: {
              input: {
                type: ChallengeListType.ALL,
                paginationInput: {
                  take: 3,
                },
              },
            },
          })
          .expect(200);
        const firstPageEdges = firstPageResult.body.data.getChallenges.edges;
        expect(firstPageEdges.length).toEqual(3);
        expect(firstPageResult.body.data.getChallenges.pageInfo).toEqual({
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: firstPageEdges[0].cursor,
          endCursor: firstPageEdges[2].cursor,
          count: 3,
          pageNumber: null,
          totalCount: 6,
        });
        const secondPageResult = await supertest(app.getHttpServer())
          .post('/graphql')
          .send({
            query: getChallengesQuery,
            variables: {
              input: {
                type: ChallengeListType.ALL,
                paginationInput: {
                  take: 3,
                  after:
                    firstPageResult.body.data.getChallenges.pageInfo.endCursor,
                },
              },
            },
          })
          .expect(200);
        const secondPageEdges = secondPageResult.body.data.getChallenges.edges;
        expect(secondPageEdges.length).toEqual(3);
        expect(secondPageResult.body.data.getChallenges.pageInfo).toEqual({
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: secondPageEdges[0].cursor,
          endCursor: secondPageEdges[2].cursor,
          count: 3,
          pageNumber: null,
          totalCount: 6,
        });
      });
    });

    describe(ChallengeListType.ALL_ACTIVE, () => {
      it('should paginate through the active challenges', async () => {
        const author = UserEntityFake();
        const author2 = UserEntityFake();
        await conn.getRepository(UserEntity).insert([author, author2]);
        const oldChallenges = Array.from({ length: 3 }, () => {
          return ChallengeEntityFake({
            authorId: author.id,
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          });
        });
        const activeChallenges = Array.from({ length: 6 }, () =>
          ChallengeEntityFake({
            authorId: author2.id,
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
          })
        );
        const futureChallenges = Array.from({ length: 3 }, () =>
          ChallengeEntityFake({
            authorId: author2.id,
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          })
        );
        await conn
          .getRepository(ChallengeEntity)
          .insert([...oldChallenges, ...activeChallenges, ...futureChallenges]);
        const globalActiveChallengesFeed = FeedEntityFake({
          id: globalActiveChallengesFeedId,
        });
        globalActiveChallengesFeed.page.ids = [
          ...oldChallenges
            .slice()
            .reverse()
            .map(c => c.id),
          ...activeChallenges
            .slice()
            .reverse()
            .map(c => c.id),
          ...futureChallenges
            .slice()
            .reverse()
            .map(c => c.id),
        ];
        await conn
          .getRepository(FeedEntity)
          .delete(globalActiveChallengesFeed.id);
        await conn.getRepository(FeedEntity).insert(globalActiveChallengesFeed);
        const firstPageResult = await supertest(app.getHttpServer())
          .post('/graphql')
          .send({
            query: getChallengesQuery,
            variables: {
              input: {
                type: ChallengeListType.ALL_ACTIVE,
                paginationInput: {
                  take: 3,
                },
              },
            },
          })
          .expect(200);
        const firstPageEdges = firstPageResult.body.data.getChallenges.edges;
        expect(firstPageEdges.length).toEqual(3);
        for (let i = 0; i < 3; i++) {
          expect(firstPageEdges[i].node.id).toEqual(activeChallenges[i].id);
        }
        expect(firstPageResult.body.data.getChallenges.pageInfo).toEqual({
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: activeChallenges[0].id,
          endCursor: activeChallenges[2].id,
          count: 3,
          pageNumber: null,
          totalCount: 12,
        });
        const secondPageResult = await supertest(app.getHttpServer())
          .post('/graphql')
          .send({
            query: getChallengesQuery,
            variables: {
              input: {
                type: ChallengeListType.ALL_ACTIVE,
                paginationInput: {
                  take: 3,
                  after:
                    firstPageResult.body.data.getChallenges.pageInfo.endCursor,
                },
              },
            },
          })
          .expect(200);
        const secondPageEdges = secondPageResult.body.data.getChallenges.edges;
        expect(secondPageEdges.length).toEqual(3);
        for (let i = 3; i < 6; i++) {
          expect(secondPageEdges[i - 3].node.id).toEqual(
            activeChallenges[i].id
          );
        }
        expect(secondPageResult.body.data.getChallenges.pageInfo).toEqual({
          hasNextPage: true,
          hasPreviousPage: true,
          startCursor: activeChallenges[3].id,
          endCursor: activeChallenges[5].id,
          count: 3,
          pageNumber: null,
          totalCount: 12,
        });
      });
    });

    describe(ChallengeListType.ALL_PAST, () => {
      it('should paginate through the past challenges', async () => {
        const author = UserEntityFake();
        const author2 = UserEntityFake();
        await conn.getRepository(UserEntity).insert([author, author2]);
        const pastChallenges = Array.from({ length: 6 }, () => {
          return ChallengeEntityFake({
            authorId: author.id,
            startDate: sub(new Date(), { days: 2 }),
            endDate: sub(new Date(), { days: 1 }),
          });
        });
        await conn.getRepository(ChallengeEntity).insert(pastChallenges);
        const globalPastChallengeFeed = FeedEntityFake({
          id: globalPastChallengesFeedId,
        });
        globalPastChallengeFeed.page.ids = pastChallenges
          .slice()
          .reverse() // Feed goes from right to left
          .map(c => c.id);
        await conn.getRepository(FeedEntity).delete(globalPastChallengeFeed.id);
        await conn.getRepository(FeedEntity).insert(globalPastChallengeFeed);
        const firstPageResult = await supertest(app.getHttpServer())
          .post('/graphql')
          .send({
            query: getChallengesQuery,
            variables: {
              input: {
                type: ChallengeListType.ALL_PAST,
                paginationInput: {
                  take: 3,
                },
              },
            },
          })
          .expect(200);
        const firstPageEdges = firstPageResult.body.data.getChallenges.edges;
        expect(firstPageEdges.length).toEqual(3);
        for (let i = 0; i < 3; i++) {
          expect(firstPageEdges[i].node.id).toEqual(pastChallenges[i].id);
        }
        expect(firstPageResult.body.data.getChallenges.pageInfo).toEqual({
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: pastChallenges[0].id,
          endCursor: pastChallenges[2].id,
          count: 3,
          pageNumber: null,
          totalCount: 6,
        });
        const secondPageResult = await supertest(app.getHttpServer())
          .post('/graphql')
          .send({
            query: getChallengesQuery,
            variables: {
              input: {
                type: ChallengeListType.ALL_PAST,
                paginationInput: {
                  take: 3,
                  after:
                    firstPageResult.body.data.getChallenges.pageInfo.endCursor,
                },
              },
            },
          })
          .expect(200);
        const secondPageEdges = secondPageResult.body.data.getChallenges.edges;
        expect(secondPageEdges.length).toEqual(3);
        for (let i = 3; i < 6; i++) {
          expect(secondPageEdges[i - 3].node.id).toEqual(pastChallenges[i].id);
        }
        expect(secondPageResult.body.data.getChallenges.pageInfo).toEqual({
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: pastChallenges[3].id,
          endCursor: pastChallenges[5].id,
          count: 3,
          pageNumber: null,
          totalCount: 6,
        });
      });
    });
  });

  describe('getJoinedChallenges', () => {
    const getJoinedChallengesQuery = /* GraphQL */ `
      query GetJoinedChallenges($input: GetJoinedChallengesInput!) {
        getJoinedChallenges(input: $input) {
          ... on GetJoinedChallengesResult {
            __typename
            challenges {
              id
            }
          }
          ... on SmartError {
            __typename
            message
          }
        }
      }
    `;

    it('should get the active challenges that a user has joined', async () => {
      const author = UserEntityFake();
      await conn.getRepository(UserEntity).insert(author);
      const challenges = Array.from({ length: 10 }).map((v, i) => {
        if (i < 2) {
          return ChallengeEntityFake({
            authorId: author.id,
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          });
        } else if (i > 8) {
          return ChallengeEntityFake({
            authorId: author.id,
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          });
        }
        return ChallengeEntityFake({
          authorId: author.id,
          startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        });
      });
      await conn.getRepository(ChallengeEntity).insert(challenges);
      const participant = UserEntityFake({
        challengeContext: {
          joinedChallenges: challenges.map(c =>
            toUserJoinedChallengeString({
              authorId: c.authorId,
              challengeId: c.id,
              endDate: c.endDate,
              startDate: c.startDate,
              joinedAt: new Date(),
            })
          ),
        },
      });
      await conn.getRepository(UserEntity).insert(participant);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: getJoinedChallengesQuery,
          variables: {
            input: {
              challengeState: ChallengeState.ACTIVE,
            },
          },
        });
      expect(result.body.data.getJoinedChallenges).toBeDefined();
      const foundChallenges = result.body.data.getJoinedChallenges.challenges;
      expect(foundChallenges.length).toEqual(7);
    });

    it('should get the ended challenges that a user has joined', async () => {
      const author = UserEntityFake();
      await conn.getRepository(UserEntity).insert([author]);
      const challenges = Array.from({ length: 10 }).map((v, i) => {
        if (i < 2) {
          return ChallengeEntityFake({
            authorId: author.id,
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          });
        } else if (i > 8) {
          return ChallengeEntityFake({
            authorId: author.id,
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          });
        }
        return ChallengeEntityFake({
          authorId: author.id,
          startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        });
      });
      await conn.getRepository(ChallengeEntity).insert(challenges);
      const participant = UserEntityFake({
        challengeContext: {
          joinedChallenges: challenges.map(c =>
            toUserJoinedChallengeString({
              authorId: c.authorId,
              challengeId: c.id,
              endDate: c.endDate,
              startDate: c.startDate,
              joinedAt: new Date(),
            })
          ),
        },
      });
      await conn.getRepository(UserEntity).insert(participant);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: getJoinedChallengesQuery,
          variables: {
            input: {
              challengeState: ChallengeState.ENDED,
            },
          },
        });
      expect(result.body.data.getJoinedChallenges).toBeDefined();
      const foundChallenges = result.body.data.getJoinedChallenges.challenges;
      expect(foundChallenges.length).toEqual(2);
    });

    it('should get the created challenges that a user has joined', async () => {
      const author = UserEntityFake();
      await conn.getRepository(UserEntity).insert([author]);
      const challenges = Array.from({ length: 10 }).map((v, i) => {
        if (i < 2) {
          return ChallengeEntityFake({
            authorId: author.id,
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          });
        } else if (i > 8) {
          return ChallengeEntityFake({
            authorId: author.id,
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          });
        }
        return ChallengeEntityFake({
          authorId: author.id,
          startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        });
      });
      await conn.getRepository(ChallengeEntity).insert(challenges);
      const participant = UserEntityFake({
        challengeContext: {
          joinedChallenges: challenges.map(c =>
            toUserJoinedChallengeString({
              authorId: c.authorId,
              challengeId: c.id,
              endDate: c.endDate,
              startDate: c.startDate,
              joinedAt: new Date(),
            })
          ),
        },
      });
      await conn.getRepository(UserEntity).insert(participant);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: getJoinedChallengesQuery,
          variables: {
            input: {
              challengeState: ChallengeState.CREATED,
            },
          },
        });
      expect(result.body.data.getJoinedChallenges).toBeDefined();
      const foundChallenges = result.body.data.getJoinedChallenges.challenges;
      expect(foundChallenges.length).toEqual(1);
    });

    it('should get the all challenges that a user has joined', async () => {
      const author = UserEntityFake();
      await conn.getRepository(UserEntity).insert([author]);
      const challenges = Array.from({ length: 10 }).map((v, i) => {
        if (i < 2) {
          return ChallengeEntityFake({
            authorId: author.id,
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          });
        } else if (i > 8) {
          return ChallengeEntityFake({
            authorId: author.id,
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          });
        }
        return ChallengeEntityFake({
          authorId: author.id,
          startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        });
      });
      await conn.getRepository(ChallengeEntity).insert(challenges);
      const participant = UserEntityFake({
        challengeContext: {
          joinedChallenges: challenges.map(c =>
            toUserJoinedChallengeString({
              authorId: c.authorId,
              challengeId: c.id,
              endDate: c.endDate,
              startDate: c.startDate,
              joinedAt: new Date(),
            })
          ),
        },
      });
      await conn.getRepository(UserEntity).insert(participant);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: getJoinedChallengesQuery,
          variables: {
            input: {
              challengeState: undefined,
            },
          },
        });
      expect(result.body.data.getJoinedChallenges).toBeDefined();
      const foundChallenges = result.body.data.getJoinedChallenges.challenges;
      expect(foundChallenges.length).toEqual(10);
    });
  });

  describe('participantsConnection', () => {
    const getChallengeParticipantsQuery = /* GraphQL */ `
      query GetChallengeParticipants(
        $input: GetChallengeInput!
        $challengeId: ID!
        $paginationInput: PaginationInput!
      ) {
        getChallenge(input: $input) {
          ... on GetChallengeResult {
            challenge {
              id
              participantsConnection(
                challengeId: $challengeId
                paginationInput: $paginationInput
              ) {
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                  startCursor
                  endCursor
                  count
                  totalCount
                }
                edges {
                  cursor
                  node {
                    user {
                      id
                    }
                    entryCount
                    isFriend
                    isCreator
                  }
                }
              }
            }
          }
        }
      }
    `;

    it('should paginate through participants of a challenge', async () => {
      const author = UserEntityFake();
      const participant = UserEntityFake();
      const otherParticipants = Array.from({ length: 10 }, () =>
        UserEntityFake()
      );
      const participantsList = [author, participant, ...otherParticipants];
      await conn.getRepository(UserEntity).insert(participantsList);
      const challenge = ChallengeEntityFake({
        authorId: author.id,
      });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [
        author,
        participant,
        ...otherParticipants,
      ].map(user =>
        toChallengeParticipantIdString({
          id: user.id,
          postId: '',
          entryCount: 0,
        })
      );
      challengeParticipantsFeed._count =
        challengeParticipantsFeed.page.ids.length;
      const authorPostEntriesOnChallengeFeed = FeedEntityFake({
        id: getUserPostEntriesOnChallengeFeedId(author.id, challenge.id),
      });
      authorPostEntriesOnChallengeFeed.page.ids = [];
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      const response = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: getChallengeParticipantsQuery,
          variables: {
            input: {
              id: challenge.id,
            },
            challengeId: challenge.id,
            paginationInput: {
              take: 5,
            },
          },
        });
      const firstPageInfo =
        response.body.data.getChallenge.challenge.participantsConnection
          .pageInfo;
      const expectedParticipantIds = participantsList
        .map(user => user.id)
        .reverse()
        .slice(0, 5);
      expectedParticipantIds.unshift(author.id);
      const actualParticipantIds =
        response.body.data.getChallenge.challenge.participantsConnection.edges.map(
          (edge: any) => edge.node.user.id
        );
      expect(actualParticipantIds).toEqual(expectedParticipantIds);
      expect(firstPageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: author.id,
        endCursor: otherParticipants[5].id,
        count: 6,
        totalCount: null,
      });
      const secondResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: getChallengeParticipantsQuery,
          variables: {
            input: {
              id: challenge.id,
            },
            challengeId: challenge.id,
            paginationInput: {
              take: 5,
              after: otherParticipants[5].id,
            },
          },
        });
      const secondPageInfo =
        secondResponse.body.data.getChallenge.challenge.participantsConnection
          .pageInfo;
      const expectedSecondParticipantIds = participantsList
        .map(user => user.id)
        .reverse()
        .slice(5, 10);
      const actualSecondParticipantIds =
        secondResponse.body.data.getChallenge.challenge.participantsConnection.edges.map(
          (edge: any) => edge.node.user.id
        );
      expect(actualSecondParticipantIds).toEqual(expectedSecondParticipantIds);
      expect(secondPageInfo).toEqual({
        hasNextPage: true,
        hasPreviousPage: true,
        startCursor: otherParticipants[4].id,
        endCursor: otherParticipants[0].id,
        count: 5,
        totalCount: null,
      });
      const thirdResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: getChallengeParticipantsQuery,
          variables: {
            input: {
              id: challenge.id,
            },
            challengeId: challenge.id,
            paginationInput: {
              take: 5,
              after: otherParticipants[0].id,
            },
          },
        });
      const expectedThirdParticipantIds = [participant.id];
      const actualThirdParticipantIds =
        thirdResponse.body.data.getChallenge.challenge.participantsConnection.edges.map(
          (edge: any) => edge.node.user.id
        );
      expect(actualThirdParticipantIds).toEqual(expectedThirdParticipantIds);
      const fourthResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: getChallengeParticipantsQuery,
          variables: {
            input: {
              id: challenge.id,
            },
            challengeId: challenge.id,
            paginationInput: {
              take: 5,
              before: otherParticipants[7].id,
            },
          },
        });
      const expectedFourthParticipantIds = participantsList
        .map(user => user.id)
        .reverse()
        .slice(0, 2);
      expectedFourthParticipantIds.unshift(author.id);
      const actualFourthParticipantIds =
        fourthResponse.body.data.getChallenge.challenge.participantsConnection.edges.map(
          (edge: any) => edge.node.user.id
        );
      expect(actualFourthParticipantIds).toEqual(expectedFourthParticipantIds);
    });
  });

  describe('createChallenge', () => {
    const createChallengeMutation = /* GraphQL */ `
      mutation createChallenge($input: CreateChallengeInput!) {
        createChallenge(input: $input) {
          ... on CreateChallengeResult {
            __typename
            challenge {
              __typename
              id
              name
            }
          }
          ... on ChallengeTrollDetectionError {
            __typename
            message
            description {
              message
              result
            }
            name {
              message
              result
            }
          }
          ... on SmartError {
            __typename
            message
          }
        }
      }
    `;

    const getCreateChallengeVariables = () => {
      const input: CreateChallengeInput = {
        name: "Bob's Challenge 4",
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
        description: {
          textSegments: [
            {
              position: 0,
              text: {
                chunk: 'BobChallenge 4',
              },
            },
          ],
          segments: [
            {
              position: 0,
              segmentType: SegmentType.TEXT,
            },
          ],
        },
        coverEnum: ChallengeCoverEnum.TYPE_1,
      };
      return {
        input,
      };
    };

    it('should create a challenge', async () => {
      const challengeAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert(challengeAuthor);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .send({
          query: createChallengeMutation,
          variables: getCreateChallengeVariables(),
        });
      expect(result.body.data.createChallenge.challenge).toBeDefined();
      const createdChallenge = await conn
        .getRepository(ChallengeEntity)
        .findOne({
          id: result.body.data.createChallenge.challenge.id,
        });
      expect(createdChallenge).toBeDefined();
    });

    it('should add the created challenge to the authors joined challenges', async () => {
      const challengeAuthor = UserEntityFake();
      await conn.getRepository(UserEntity).insert(challengeAuthor);
      const variables = getCreateChallengeVariables();
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(challengeAuthor)}`)
        .send({
          query: createChallengeMutation,
          variables,
        });
      expect(result.body.data.createChallenge.challenge).toBeDefined();
      const author = await conn
        .getRepository(UserEntity)
        .findOne(challengeAuthor.id);
      expect(author?.challengeContext?.joinedChallenges?.[0]).toBeDefined();
      if (author?.challengeContext?.joinedChallenges?.[0]) {
        expect(
          fromUserJoinedChallengeString(
            author.challengeContext.joinedChallenges[0]
          )
        ).toEqual({
          authorId: challengeAuthor.id,
          challengeId: result.body.data.createChallenge.challenge.id,
          endDate: variables.input.endDate,
          startDate: variables.input.startDate,
          joinedAt: expect.any(Date),
        });
      }
    });
  });

  describe('commentPostingAccessControlContext', () => {
    const getChallengeWithCommentPostingAccessControlContext = /* GraphQL */ `
      query GetChallenge($getChallengeInput: GetChallengeInput!) {
        getChallenge(input: $getChallengeInput) {
          ... on GetChallengeResult {
            challenge {
              commentPostingAccessControlContext {
                canComment
              }
            }
          }
        }
      }
    `;

    it('should indicate that an author can post comments', async () => {
      const author = UserEntityFake();
      await conn.getRepository(UserEntity).insert(author);
      const challenge = ChallengeEntityFake({
        authorId: author.id,
      });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [author.id];
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(author)}`)
        .send({
          query: getChallengeWithCommentPostingAccessControlContext,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
          },
        });
      expect(result.body.data.getChallenge).toBeDefined();
      expect(result.body.data.getChallenge.challenge).toBeDefined();
      expect(
        result.body.data.getChallenge.challenge
          .commentPostingAccessControlContext
      ).toEqual({ canComment: true });
    });
  });

  describe('commentVisibilityAccessControlContext', () => {
    const getChallengeWithAccessControlQuery = /* GraphQL */ `
      query GetChallenge($getChallengeInput: GetChallengeInput!) {
        getChallenge(input: $getChallengeInput) {
          ... on GetChallengeResult {
            challenge {
              commentVisibilityAccessControlContext {
                canViewComment
              }
            }
          }
        }
      }
    `;

    it('should indicate that a challenge author can post comments', async () => {
      const author = UserEntityFake();
      await conn.getRepository(UserEntity).insert(author);
      const challenge = ChallengeEntityFake({
        authorId: author.id,
      });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [author.id];
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(author)}`)
        .send({
          query: getChallengeWithAccessControlQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
          },
        });
      expect(result.body.data.getChallenge).toBeDefined();
      expect(result.body.data.getChallenge.challenge).toBeDefined();
      expect(
        result.body.data.getChallenge.challenge
          .commentVisibilityAccessControlContext
      ).toEqual({ canViewComment: true });
    });
  });

  describe('previewParticipants', () => {
    const joinChallengeMutation = /* GraphQL */ `
      mutation joinChallenge($input: JoinChallengeInput!) {
        joinChallenge(input: $input) {
          ... on JoinChallengeResult {
            __typename
          }
        }
      }
    `;

    const challengeWithParticipantPreviewQuery = /* GraphQL */ `
      query getChallenge($getChallengeInput: GetChallengeInput!) {
        getChallenge(input: $getChallengeInput) {
          ... on GetChallengeResult {
            challenge {
              previewParticipants {
                displayText
              }
            }
          }
        }
      }
    `;

    it('should show 3 joined participants', async () => {
      const author = UserEntityFake();
      const participants = Array.from({ length: 3 }, (_, i) => {
        if (i === 0) return UserEntityFake({ name: '' });
        return UserEntityFake();
      });
      await conn.getRepository(UserEntity).insert([author, ...participants]);
      const challenge = ChallengeEntityFake({
        authorId: author.id,
      });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [author.id];
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      for (const participant of participants) {
        await supertest(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${getJWT(participant)}`)
          .send({
            query: joinChallengeMutation,
            variables: {
              input: {
                id: challenge.id,
              },
            },
          });
      }
      const getChallengeResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(author)}`)
        .send({
          query: challengeWithParticipantPreviewQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
          },
        });
      expect(getChallengeResponse.body.data.getChallenge).toBeDefined();
      expect(
        getChallengeResponse.body.data.getChallenge.challenge
      ).toBeDefined();
      expect(
        getChallengeResponse.body.data.getChallenge.challenge
          .previewParticipants.displayText
      ).toBe(
        `${participants[0].handle}, ${participants[1].name.split(' ')[0]} and ${
          participants[2].name.split(' ')[0]
        }`
      );
    });

    it('should show many joined participants', async () => {
      const author = UserEntityFake();
      const participants = Array.from({ length: 4 }, () => {
        return UserEntityFake({ name: '' });
      });
      await conn.getRepository(UserEntity).insert([author, ...participants]);
      const challenge = ChallengeEntityFake({
        authorId: author.id,
      });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [author.id];
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      for (const participant of participants) {
        await supertest(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${getJWT(participant)}`)
          .send({
            query: joinChallengeMutation,
            variables: {
              input: {
                id: challenge.id,
              },
            },
          });
      }
      const getChallengeResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(author)}`)
        .send({
          query: challengeWithParticipantPreviewQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
          },
        });
      expect(getChallengeResponse.body.data.getChallenge).toBeDefined();
      expect(
        getChallengeResponse.body.data.getChallenge.challenge
      ).toBeDefined();
      expect(
        getChallengeResponse.body.data.getChallenge.challenge
          .previewParticipants.displayText
      ).toBe(
        `${participants[0].handle}, ${participants[1].handle} and 2 others`
      );
    });

    it('should not show duplicate participants', async () => {
      const author = UserEntityFake();
      const participants = Array.from({ length: 2 }, (_, i) => {
        if (i === 0) return UserEntityFake({ name: '' });
        return UserEntityFake();
      });
      await conn.getRepository(UserEntity).insert([author, ...participants]);
      const challenge = ChallengeEntityFake({
        authorId: author.id,
      });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [author.id];
      await conn.getRepository(FeedEntity).insert(challengeParticipantsFeed);
      for (const participant of participants) {
        await supertest(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${getJWT(participant)}`)
          .send({
            query: joinChallengeMutation,
            variables: {
              input: {
                id: challenge.id,
              },
            },
          });
      }
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participants[0])}`)
        .send({
          query: joinChallengeMutation,
          variables: {
            input: {
              id: challenge.id,
            },
          },
        });
      const getChallengeResponse = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(author)}`)
        .send({
          query: challengeWithParticipantPreviewQuery,
          variables: {
            getChallengeInput: {
              id: challenge.id,
            },
          },
        });
      expect(getChallengeResponse.body.data.getChallenge).toBeDefined();
      expect(
        getChallengeResponse.body.data.getChallenge.challenge
      ).toBeDefined();
      expect(
        getChallengeResponse.body.data.getChallenge.challenge
          .previewParticipants.displayText
      ).toBe(
        `${participants[0].handle} and ${participants[1].name.split(' ')[0]}`
      );
    });
  });

  describe('leaveChallenge', () => {
    const leaveChallengeMutation = /* GraphQL */ `
      mutation LeaveChallenge($input: LeaveChallengeInput!) {
        leaveChallenge(input: $input) {
          ... on LeaveChallengeResult {
            challenge {
              id
            }
          }
        }
      }
    `;

    it('should remove the participant from the challenge', async () => {
      const author = UserEntityFake();
      const participant = UserEntityFake();
      const challenge = ChallengeEntityFake({
        authorId: author.id,
        stats: {
          participantCount: 2,
          entryCount: 5,
          previewParticipants: `${author.id}#${participant.id}`,
          commentCount: 0,
          shareCount: 0,
          hasHiddenComments: false,
          reportCount: 0,
        },
      });
      addJoinedChallenge({ user: participant, challenge });
      await conn.getRepository(UserEntity).insert([author, participant]);
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const challengeParticipantsFeed = FeedEntityFake({
        id: getChallengeParticipantsFeedId(challenge.id),
      });
      challengeParticipantsFeed.page.ids = [
        toChallengeParticipantIdString({
          id: author.id,
          entryCount: 3,
        }),
        toChallengeParticipantIdString({
          id: participant.id,
          entryCount: 2,
        }),
      ];
      challengeParticipantsFeed.count = 2;
      const challengeLeaderboardFeed = FeedEntityFake({
        id: getChallengeLeaderboardFeedId(challenge.id),
      });
      challengeLeaderboardFeed.page.ids = [
        toChallengeLeaderboardEdge({
          participantId: participant.id,
          entryCount: 2,
          latestEntryId: 'latestEntryId',
        }),
        toChallengeLeaderboardEdge({
          participantId: author.id,
          entryCount: 3,
          latestEntryId: 'latestEntryId',
        }),
      ];
      challengeLeaderboardFeed.count = 2;
      await conn
        .getRepository(FeedEntity)
        .insert([challengeParticipantsFeed, challengeLeaderboardFeed]);
      await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: leaveChallengeMutation,
          variables: {
            input: {
              id: challenge.id,
            },
          },
        });
      const challengeParticipantsFeedResult = await conn
        .getRepository(FeedEntity)
        .findOneOrFail(challengeParticipantsFeed.id);
      expect(challengeParticipantsFeedResult.page.ids).toEqual([
        toChallengeParticipantIdString({
          id: author.id,
          entryCount: 3,
        }),
      ]);
      const challengeLeaderboardFeedResult = await conn
        .getRepository(FeedEntity)
        .findOneOrFail(challengeLeaderboardFeed.id);
      expect(challengeLeaderboardFeedResult.page.ids).toEqual([
        toChallengeLeaderboardEdge({
          participantId: author.id,
          entryCount: 3,
          latestEntryId: 'latestEntryId',
        }),
      ]);
      const participantResult = await conn
        .getRepository(UserEntity)
        .findOneOrFail(participant.id);
      expect(participantResult.challengeContext?.joinedChallenges).toEqual([
        toUserJoinedChallengeString({
          challengeId: challenge.id,
          authorId: author.id,
          startDate: challenge.startDate,
          endDate: challenge.endDate,
        }),
      ]);
      const challengeResult = await conn
        .getRepository(ChallengeEntity)
        .findOneOrFail(challenge.id);
      expect(challengeResult.stats.participantCount).toBe(1);
    });
  });

  describe('getMyChallenges', () => {
    const getMyChallengesQuery = /* GraphQL */ `
      query GetMyChallenges($getMyChallengesInput: GetMyChallengesInput!) {
        getMyChallenges(input: $getMyChallengesInput) {
          ... on GetMyChallengesResult {
            __typename
            pageInfo {
              __typename
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
              pageNumber
              count
              totalCount
            }
            edges {
              __typename
              cursor
              node {
                id
                name
              }
            }
          }
        }
      }
    `;

    it(`should paginate through a user's challenges`, async () => {
      const author = UserEntityFake();
      await conn.getRepository(UserEntity).insert([author]);
      const challenges = Array.from({ length: 10 }).map((v, i) => {
        if (i === 3 || i === 7) {
          return ChallengeEntityFake({
            authorId: author.id,
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          });
        } else if (i === 4) {
          const challenge = ChallengeEntityFake({
            authorId: author.id,
          });
          challenge.endDate = undefined;
        }
        return ChallengeEntityFake({
          authorId: author.id,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        });
      });
      await conn.getRepository(ChallengeEntity).insert(challenges);
      const participant = UserEntityFake({
        challengeContext: {
          joinedChallenges: challenges.map(challenge => {
            return toUserJoinedChallengeString({
              authorId: challenge.authorId,
              challengeId: challenge.id,
              endDate: challenge.endDate,
              startDate: challenge.startDate,
              joinedAt: new Date(),
            });
          }),
        },
      });
      await conn.getRepository(UserEntity).insert(participant);
      const firstPageResult = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: getMyChallengesQuery,
          variables: {
            getMyChallengesInput: {
              paginationInput: {
                take: 5,
              },
            },
          },
        });
      expect(firstPageResult.body.errors).toBeUndefined();
      expect(firstPageResult.body.data).toBeDefined();
      expect(firstPageResult.body.data.getMyChallenges).toBeDefined();
      expect(firstPageResult.body.data.getMyChallenges.pageInfo).toEqual({
        __typename: 'PageInfo',
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: last(challenges)?.id,
        endCursor: challenges[4].id,
        pageNumber: null,
        count: 5,
        totalCount: 10,
      });
      const firstPageEdges = firstPageResult.body.data.getMyChallenges.edges;
      expect(firstPageEdges).toHaveLength(5);
      expect(firstPageEdges[0].node.id).toBe(last(challenges)?.id);
      expect(firstPageEdges[1].node.id).toBe(challenges[8].id);
      expect(firstPageEdges[2].node.id).toBe(challenges[6].id);
      expect(firstPageEdges[3].node.id).toBe(challenges[5].id);
      expect(firstPageEdges[4].node.id).toBe(challenges[4].id);
      const secondPageResult = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: getMyChallengesQuery,
          variables: {
            getMyChallengesInput: {
              paginationInput: {
                take: 5,
                after:
                  firstPageResult.body.data.getMyChallenges.pageInfo.endCursor,
              },
            },
          },
        });
      expect(secondPageResult.body.errors).toBeUndefined();
      expect(secondPageResult.body.data).toBeDefined();
      expect(secondPageResult.body.data.getMyChallenges).toBeDefined();
      expect(secondPageResult.body.data.getMyChallenges.pageInfo).toEqual({
        __typename: 'PageInfo',
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: challenges[2].id,
        endCursor: challenges[3].id,
        pageNumber: null,
        count: 5,
        totalCount: 10,
      });
      const secondPageEdges = secondPageResult.body.data.getMyChallenges.edges;
      expect(secondPageEdges).toHaveLength(5);
      expect(secondPageEdges[0].node.id).toBe(challenges[2].id);
      expect(secondPageEdges[1].node.id).toBe(challenges[1].id);
      expect(secondPageEdges[2].node.id).toBe(challenges[0].id);
      expect(secondPageEdges[3].node.id).toBe(challenges[7].id);
      expect(secondPageEdges[4].node.id).toBe(challenges[3].id);
    });
  });

  describe('reportChallenge', () => {
    const reportChallengeMutation = /* GraphQL */ `
      mutation ReportChallenge($input: ReportChallengeInput!) {
        reportChallenge(input: $input) {
          ... on ReportChallengeResult {
            challenge {
              id
              stats {
                reportCount
              }
            }
          }
          ... on SmartError {
            __typename
            message
          }
        }
      }
    `;

    it('should report a challenge', async () => {
      const author = UserEntityFake();
      const participant = UserEntityFake();
      await conn.getRepository(UserEntity).insert([author, participant]);
      const challenge = ChallengeEntityFake({
        authorId: author.id,
      });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: reportChallengeMutation,
          variables: {
            input: {
              challengeId: challenge.id,
              type: ReportType.ONE,
            },
          },
        });
      expect(result.body.data.reportChallenge).toBeDefined();
      expect(result.body.data.reportChallenge.challenge.stats).toBeDefined();
      expect(
        result.body.data.reportChallenge.challenge.stats.reportCount
      ).toEqual(1);
      const reportedChallenge = await conn
        .getRepository(ChallengeEntity)
        .findOne(challenge.id);
      expect(reportedChallenge?.stats.reportCount).toEqual(1);
      const userReportedChallengesFeed = await conn
        .getRepository(FeedEntity)
        .findOne(
          getFirstFeedPageId(FeedEntityType.REPORT_CHALLENGES, participant.id)
        );
      expect(userReportedChallengesFeed?.page.ids).toEqual([challenge.id]);
      expect(userReportedChallengesFeed?.count).toEqual(1);
    });

    it('should unreport a challenge', async () => {
      const author = UserEntityFake();
      const participant = UserEntityFake();
      await conn.getRepository(UserEntity).insert([author, participant]);
      const challenge = ChallengeEntityFake({
        authorId: author.id,
      });
      await conn.getRepository(ChallengeEntity).insert(challenge);
      const userReportedChallengesFeed = FeedEntityFake({
        id: getFirstFeedPageId(
          FeedEntityType.REPORT_CHALLENGES,
          participant.id
        ),
      });
      userReportedChallengesFeed.page.ids = [challenge.id];
      userReportedChallengesFeed.count = 1;
      await conn.getRepository(FeedEntity).insert(userReportedChallengesFeed);
      const result = await supertest(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getJWT(participant)}`)
        .send({
          query: reportChallengeMutation,
          variables: {
            input: {
              challengeId: challenge.id,
              type: ReportType.UNREPORT,
            },
          },
        });
      expect(result.body.data.reportChallenge).toBeDefined();
      expect(result.body.data.reportChallenge.challenge.stats).toBeDefined();
      expect(
        result.body.data.reportChallenge.challenge.stats.reportCount
      ).toEqual(0);
      const reportedChallenge = await conn
        .getRepository(ChallengeEntity)
        .findOne(challenge.id);
      expect(reportedChallenge?.stats.reportCount).toEqual(0);
      const foundUserReportedChallengesFeed = await conn
        .getRepository(FeedEntity)
        .findOne(
          getFirstFeedPageId(FeedEntityType.REPORT_CHALLENGES, participant.id)
        );
      expect(foundUserReportedChallengesFeed?.page.ids).toEqual([]);
      expect(foundUserReportedChallengesFeed?.count).toEqual(0);
    });
  });
});
