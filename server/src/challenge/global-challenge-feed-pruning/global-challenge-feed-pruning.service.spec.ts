import { getQueueToken } from '@nestjs/bull';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChallengeSchema } from '@verdzie/server/challenge/challenge-data-objects/challenge.schema';
import {
  globalActiveChallengesFeedId,
  globalPastChallengesFeedId,
} from '@verdzie/server/challenge/challenge.service';
import { GlobalChallengeFeedPruningService } from '@verdzie/server/challenge/global-challenge-feed-pruning/global-challenge-feed-pruning.service';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { FeedSchema } from '@verdzie/server/feed/feed.schema';
import { GlobalActiveChallengesFeedNotFoundException } from '@verdzie/server/feed/feed.service';
import {
  FeedEntityFake,
  FeedPageFake,
} from '@verdzie/server/feed/testing/feed-entity.fake';
import {
  createMockQueryRunner,
  createMockRepo,
  createMockedTestingModule,
} from '@verdzie/server/testing/base.module';
import { GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME } from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.producer';
import { add, sub } from 'date-fns';

describe('GlobalChallengeFeedPruningService', () => {
  let service: GlobalChallengeFeedPruningService;

  beforeEach(async () => {
    service = (
      await createMockedTestingModule({
        providers: [
          GlobalChallengeFeedPruningService,
          {
            provide: getRepositoryToken(ChallengeSchema),
            useValue: createMockRepo({}),
          },
          {
            provide: getRepositoryToken(FeedSchema),
            useValue: createMockRepo({}),
          },
          {
            provide: getQueueToken(GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME),
            useValue: {
              add: jest.fn().mockResolvedValue(undefined),
              on: jest.fn().mockResolvedValue(undefined),
            },
          },
        ],
      })
    ).get(GlobalChallengeFeedPruningService);
  });

  describe('createPruningBatchJobs', () => {
    it('should create jobs for all ids in the feed', async () => {
      const feedRepo = createMockRepo({
        entities: [
          FeedEntityFake({
            id: globalActiveChallengesFeedId,
            page: {
              ids: Array.from({ length: 350 }, (_, i) => `${i}`),
              idsWithScore: { idsMap: {} },
            },
          }),
        ],
      });
      // @ts-expect-error
      service['feedRepo'] = feedRepo;
      await service.createPruningBatchJobs({
        globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
      });
      expect(service['producer'].createPruningBatchJob).toHaveBeenCalledTimes(
        4
      );
      // @ts-expect-error
      const calls = service['producer'].createPruningBatchJob.mock.calls;
      for (let i = 0; i < 4; i++) {
        expect(calls[i][0].job.challengeIds).toHaveLength(i === 3 ? 50 : 100);
        expect(calls[i][0].job.feedPage).toBe(1);
      }
    });
  });

  describe('pruneChallengeBatch', () => {
    describe('active challenges feed', () => {
      it('should move expired challenges from active feed to past feed', async () => {
        const globalActiveChallengesFeed = {
          id: globalActiveChallengesFeedId,
          page: FeedPageFake({
            ids: ['1', '2', '3', '4'],
          }),
        };
        const globalPastChallengesFeed = {
          id: globalPastChallengesFeedId,
          page: FeedPageFake({
            ids: [],
          }),
        };
        const feedRepo = {
          find: jest
            .fn()
            .mockResolvedValue([
              globalActiveChallengesFeed,
              globalPastChallengesFeed,
            ]),
          update: jest.fn(),
          upsert: jest.fn(),
        };
        const queryRunner = createMockQueryRunner({
          repositories: {
            FeedEntity: feedRepo,
          },
        });
        const challengeRepo = {
          find: jest.fn().mockResolvedValue([
            {
              id: '1',
              endDate: sub(new Date(), { days: 1 }),
            },
            {
              id: '2',
              endDate: add(new Date(), { days: 1 }),
            },
            {
              id: '3',
              endDate: add(new Date(), { days: 1 }),
            },
          ]),
          manager: {
            connection: {
              createQueryRunner: () => queryRunner,
            },
          },
        } as any;
        // @ts-expect-error
        service['challengeRepo'] = challengeRepo;
        const result = await service.pruneChallengeBatch({
          challengeIds: ['1', '2', '3'],
          feedPage: 1,
          globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
        });
        expect(result.isOk()).toBe(true);
        expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
        expect(result._unsafeUnwrap().removedChallengeIds).toEqual(['1']);
        expect(globalActiveChallengesFeed.page.ids).toEqual(['2', '3', '4']);
        expect(globalPastChallengesFeed.page.ids).toEqual(['1']);
        expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunner.release).toHaveBeenCalledTimes(1);
      });

      it('should return global challenges feed not found error it is not found', async () => {
        const feedRepo = {
          find: jest.fn().mockResolvedValue([]),
        };
        const queryRunner = createMockQueryRunner({
          repositories: {
            FeedEntity: feedRepo,
          },
        });
        const challengeRepo = {
          find: jest.fn().mockResolvedValue([
            {
              id: '1',
              endDate: sub(new Date(), { days: 1 }),
            },
            {
              id: '2',
              endDate: add(new Date(), { days: 1 }),
            },
            {
              id: '3',
              endDate: add(new Date(), { days: 1 }),
            },
          ]),
          manager: {
            connection: {
              createQueryRunner: () => queryRunner,
            },
          },
        } as any;
        // @ts-expect-error
        service['challengeRepo'] = challengeRepo;
        const result = await service.pruneChallengeBatch({
          challengeIds: ['1', '2', '3'],
          feedPage: 1,
          globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
        });
        expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          GlobalActiveChallengesFeedNotFoundException
        );
        expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunner.release).toHaveBeenCalledTimes(1);
      });

      it('should return internal server errors thrown from challenge repo', async () => {
        const challengeRepo = {
          find: jest.fn().mockRejectedValue(new Error('test')),
        } as any;
        // @ts-expect-error
        service['challengeRepo'] = challengeRepo;
        const result = await service.pruneChallengeBatch({
          challengeIds: ['1', '2', '3'],
          feedPage: 1,
          globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
        });
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          InternalServerErrorException
        );
      });

      it('should handle unknown exceptions from the query runner', async () => {
        const globalActiveChallengesFeed = {
          id: globalActiveChallengesFeedId,
          page: FeedPageFake({
            ids: ['1', '2', '3', '4'],
          }),
        };
        const globalPastChallengesFeed = {
          id: globalPastChallengesFeedId,
          page: FeedPageFake({
            ids: [],
          }),
        };
        const feedRepo = {
          find: jest
            .fn()
            .mockResolvedValue([
              globalActiveChallengesFeed,
              globalPastChallengesFeed,
            ]),
          update: jest.fn(),
          upsert: jest.fn(),
        };
        const queryRunner = createMockQueryRunner({
          repositories: {
            FeedEntity: feedRepo,
          },
        });
        queryRunner.startTransaction.mockRejectedValue(new Error('test'));
        const challengeRepo = {
          find: jest.fn().mockResolvedValue([
            {
              id: '1',
              endDate: sub(new Date(), { days: 1 }),
            },
            {
              id: '2',
              endDate: add(new Date(), { days: 1 }),
            },
            {
              id: '3',
              endDate: add(new Date(), { days: 1 }),
            },
          ]),
          manager: {
            connection: {
              createQueryRunner: () => queryRunner,
            },
          },
        } as any;
        // @ts-expect-error
        service['challengeRepo'] = challengeRepo;
        const result = await service.pruneChallengeBatch({
          challengeIds: ['1', '2', '3'],
          feedPage: 1,
          globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
        });
        expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          InternalServerErrorException
        );
        expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunner.release).toHaveBeenCalledTimes(1);
      });
    });
  });
});
