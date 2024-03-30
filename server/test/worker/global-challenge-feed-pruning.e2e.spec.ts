import { getQueueToken } from '@nestjs/bull';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import {
  globalActiveChallengesFeedId,
  globalPastChallengesFeedId,
} from '@verdzie/server/challenge/challenge.service';
import { GlobalChallengeFeedPruningModule } from '@verdzie/server/challenge/global-challenge-feed-pruning/global-challenge-feed-pruning.module';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import {
  FeedEntityFake,
  FeedPageFake,
} from '@verdzie/server/feed/testing/feed-entity.fake';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { GlobalChallengeFeedPruningConsumer } from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.consumer';
import {
  GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME,
  GlobalChallengeFeedPruningProducer,
} from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.producer';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { Connection } from 'typeorm';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { add, sub } from 'date-fns';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';

describe('GlobalChallengeFeedPruning', () => {
  let producer: GlobalChallengeFeedPruningProducer;
  let consumer: GlobalChallengeFeedPruningConsumer;
  let conn: Connection;

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [
        WildrTypeormModule,
        WildrBullModule,
        GlobalChallengeFeedPruningModule,
      ],
      providers: [
        GlobalChallengeFeedPruningProducer,
        GlobalChallengeFeedPruningConsumer,
        {
          provide: getQueueToken(GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME),
          useValue: {
            add: jest.fn().mockResolvedValue(undefined),
            on: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });
    producer = module.get(GlobalChallengeFeedPruningProducer);
    consumer = module.get(GlobalChallengeFeedPruningConsumer);
    conn = await getTestConnection();
    await conn.synchronize(true);
  });

  beforeEach(async () => {
    await conn.getRepository(FeedEntity).delete({});
    await conn.getRepository(ChallengeEntity).delete({});
    await conn.getRepository(UserEntity).delete({});
  });

  afterAll(async () => {
    await conn.close();
  });

  describe('Consumer', () => {
    describe('createFeedPruningBatchJobs', () => {
      it(`should create pruning batch jobs from global feed`, async () => {
        const feed = FeedEntityFake({
          id: globalActiveChallengesFeedId,
          page: FeedPageFake({
            ids: Array.from(
              { length: 150 },
              (_, i) => `fake-challenge-id-${i}`
            ),
          }),
        });
        await conn.getRepository(FeedEntity).insert(feed);
        producer['createPruningBatchJob'] = jest.fn();
        await consumer.createFeedPruningBatchJobs(
          JobFake({
            data: {
              globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
            },
          }) as any
        );
        expect(producer['createPruningBatchJob']).toHaveBeenCalledTimes(2);
        const calls = (producer['createPruningBatchJob'] as jest.Mock).mock
          .calls;
        expect(calls[0][0]).toEqual({
          delayMS: expect.any(Number),
          job: {
            challengeIds: Array.from(
              { length: 100 },
              (_, i) => `fake-challenge-id-${i}`
            ),
            globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
            feedPage: 1,
          },
        });
        expect(calls[1][0]).toEqual({
          delayMS: expect.any(Number),
          job: {
            challengeIds: Array.from(
              { length: 50 },
              (_, i) => `fake-challenge-id-${i + 100}`
            ),
            globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
            feedPage: 1,
          },
        });
      });

      it(`should return if global challenges feed does not exist`, async () => {
        producer['createPruningBatchJob'] = jest.fn();
        await consumer.createFeedPruningBatchJobs(
          JobFake({
            data: {
              globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
            },
          }) as any
        );
        expect(producer['createPruningBatchJob']).toHaveBeenCalledTimes(0);
      });
    });

    describe('pruneFeedBatch', () => {
      describe('active challenges feed', () => {
        it(`should move expired challenges from the active feed to the past feed`, async () => {
          const author = UserEntityFake();
          await conn.getRepository(UserEntity).insert(author);
          const challenges = Array.from({ length: 10 }, (_, i) => {
            if (i < 5) {
              return ChallengeEntityFake({
                authorId: author.id,
                endDate: sub(new Date(), { days: 1 }),
              });
            } else {
              return ChallengeEntityFake({
                authorId: author.id,
                endDate: add(new Date(), { days: 1 }),
              });
            }
          });
          await conn.getRepository(ChallengeEntity).insert(challenges);
          const feeds = [
            FeedEntityFake({
              id: globalActiveChallengesFeedId,
              page: FeedPageFake({
                ids: challenges.slice(2).map(c => c.id),
              }),
            }),
            FeedEntityFake({
              id: globalPastChallengesFeedId,
              page: FeedPageFake({
                ids: challenges.slice(0, 2).map(c => c.id),
              }),
            }),
          ];
          await conn.getRepository(FeedEntity).insert(feeds);
          await consumer.pruneFeedBatch({
            data: {
              challengeIds: challenges.slice(0, 7).map(c => c.id),
              globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
              feedPage: 1,
            },
          } as any);
          const activeFeed = await conn
            .getRepository(FeedEntity)
            .findOneOrFail(globalActiveChallengesFeedId);
          expect(activeFeed.page.ids).toEqual(
            challenges.slice(5).map(c => c.id)
          );
          const pastFeed = await conn
            .getRepository(FeedEntity)
            .findOneOrFail(globalPastChallengesFeedId);
          expect(pastFeed.page.ids).toEqual(
            challenges.slice(0, 5).map(c => c.id)
          );
        });

        it(`should add challenges to the past feed in reverse chronological order of end date`, async () => {
          const author = UserEntityFake();
          await conn.getRepository(UserEntity).insert(author);
          const challenges = [
            ChallengeEntityFake({
              authorId: author.id,
              endDate: sub(new Date(), { days: 5 }),
            }),
            ChallengeEntityFake({
              authorId: author.id,
              endDate: sub(new Date(), { days: 1 }),
            }),
            ChallengeEntityFake({
              authorId: author.id,
              endDate: sub(new Date(), { days: 3 }),
            }),
            ChallengeEntityFake({
              authorId: author.id,
              endDate: sub(new Date(), { days: 2 }),
            }),
          ];
          await conn.getRepository(ChallengeEntity).insert(challenges);
          const feeds = [
            FeedEntityFake({
              id: globalActiveChallengesFeedId,
              page: FeedPageFake({
                ids: challenges.slice(1).map(c => c.id),
              }),
            }),
            FeedEntityFake({
              id: globalPastChallengesFeedId,
              page: FeedPageFake({
                ids: challenges.slice(0, 1).map(c => c.id),
              }),
            }),
          ];
          await conn.getRepository(FeedEntity).insert(feeds);
          await consumer.pruneFeedBatch({
            data: {
              challengeIds: challenges.slice(1).map(c => c.id),
              globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
              feedPage: 1,
            },
          } as any);
          const pastFeed = await conn
            .getRepository(FeedEntity)
            .findOneOrFail(globalPastChallengesFeedId);
          expect(pastFeed.page.ids).toEqual([
            challenges[0].id,
            challenges[2].id,
            challenges[3].id,
            challenges[1].id,
          ]);
        });

        it(`should not allow duplicates in past challenges feed`, async () => {
          const author = UserEntityFake();
          await conn.getRepository(UserEntity).insert(author);
          const challenges = Array.from({ length: 10 }, (_, i) => {
            if (i < 5) {
              return ChallengeEntityFake({
                authorId: author.id,
                endDate: sub(new Date(), { days: 1 }),
              });
            } else {
              return ChallengeEntityFake({
                authorId: author.id,
                endDate: add(new Date(), { days: 1 }),
              });
            }
          });
          await conn.getRepository(ChallengeEntity).insert(challenges);
          const feeds = [
            FeedEntityFake({
              id: globalActiveChallengesFeedId,
              page: FeedPageFake({
                ids: challenges.slice(2).map(c => c.id),
              }),
            }),
            FeedEntityFake({
              id: globalPastChallengesFeedId,
              page: FeedPageFake({
                // duplicates
                ids: challenges.slice(0, 4).map(c => c.id),
              }),
            }),
          ];
          await conn.getRepository(FeedEntity).insert(feeds);
          await consumer.pruneFeedBatch({
            data: {
              challengeIds: challenges.slice(0, 7).map(c => c.id),
              globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
              feedPage: 1,
            },
          } as any);
          const activeFeed = await conn
            .getRepository(FeedEntity)
            .findOneOrFail(globalActiveChallengesFeedId);
          expect(activeFeed.page.ids).toEqual(
            challenges.slice(5).map(c => c.id)
          );
          const pastFeed = await conn
            .getRepository(FeedEntity)
            .findOneOrFail(globalPastChallengesFeedId);
          expect(pastFeed.page.ids).toEqual(
            challenges.slice(0, 5).map(c => c.id)
          );
        });

        it(`should not allow duplicates in active challenges feed`, async () => {
          const author = UserEntityFake();
          await conn.getRepository(UserEntity).insert(author);
          const challenges = Array.from({ length: 10 }, (_, i) => {
            if (i < 5) {
              return ChallengeEntityFake({
                authorId: author.id,
                endDate: sub(new Date(), { days: 1 }),
              });
            } else {
              return ChallengeEntityFake({
                authorId: author.id,
                endDate: add(new Date(), { days: 1 }),
              });
            }
          });
          await conn.getRepository(ChallengeEntity).insert(challenges);
          const feeds = [
            FeedEntityFake({
              id: globalActiveChallengesFeedId,
              page: FeedPageFake({
                ids: [
                  ...challenges.map(c => c.id),
                  ...challenges.map(c => c.id),
                ],
              }),
            }),
            FeedEntityFake({
              id: globalPastChallengesFeedId,
              page: FeedPageFake({
                ids: [],
              }),
            }),
          ];
          await conn.getRepository(FeedEntity).insert(feeds);
          await consumer.pruneFeedBatch({
            data: {
              challengeIds: challenges.map(c => c.id),
              globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
              feedPage: 1,
            },
          } as any);
          const activeFeed = await conn
            .getRepository(FeedEntity)
            .findOneOrFail(globalActiveChallengesFeedId);
          expect(activeFeed.page.ids).toEqual(
            challenges.slice(5).map(c => c.id)
          );
          const pastFeed = await conn
            .getRepository(FeedEntity)
            .findOneOrFail(globalPastChallengesFeedId);
          expect(pastFeed.page.ids).toEqual(
            challenges.slice(0, 5).map(c => c.id)
          );
        });

        it(`should create the past challenges feed if it does not exist`, async () => {
          const author = UserEntityFake();
          await conn.getRepository(UserEntity).insert(author);
          const challenges = Array.from({ length: 10 }, (_, i) => {
            return ChallengeEntityFake({
              authorId: author.id,
              endDate: sub(new Date(), { days: 1 }),
            });
          });
          await conn.getRepository(ChallengeEntity).insert(challenges);
          const feeds = [
            FeedEntityFake({
              id: globalActiveChallengesFeedId,
              page: FeedPageFake({
                ids: challenges.map(c => c.id),
              }),
            }),
          ];
          await conn.getRepository(FeedEntity).insert(feeds);
          await consumer.pruneFeedBatch({
            data: {
              challengeIds: challenges.slice(0, 5).map(c => c.id),
              globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
              feedPage: 1,
            },
          } as any);
          const activeFeed = await conn
            .getRepository(FeedEntity)
            .findOneOrFail(globalActiveChallengesFeedId);
          expect(activeFeed.page.ids).toEqual(
            challenges.slice(5).map(c => c.id)
          );
          const pastFeed = await conn
            .getRepository(FeedEntity)
            .findOneOrFail(globalPastChallengesFeedId);
          expect(pastFeed.page.ids).toEqual(
            challenges.slice(0, 5).map(c => c.id)
          );
        });
      });
    });
  });
});
