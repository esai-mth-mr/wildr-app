import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { GlobalActiveChallengesFeedNotFoundException } from '@verdzie/server/feed/feed.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { GlobalChallengeFeedPruningConsumer } from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.consumer';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { err, ok } from 'neverthrow';

describe('GlobalChallengeFeedPruningConsumer', () => {
  let consumer: GlobalChallengeFeedPruningConsumer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [GlobalChallengeFeedPruningConsumer],
    });
    consumer = module.get(GlobalChallengeFeedPruningConsumer);
  });

  describe('createFeedPruningBatchJobs', () => {
    it('should create feed pruning batch jobs', async () => {
      consumer['globalChallengeFeedPruningService'].createPruningBatchJobs =
        jest.fn().mockResolvedValue(ok(undefined));
      await consumer.createFeedPruningBatchJobs(
        JobFake({
          data: {
            globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
          },
        }) as any
      );
      expect(
        consumer['globalChallengeFeedPruningService'].createPruningBatchJobs
      ).toHaveBeenCalledWith({
        globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
      });
    });

    it('should throw error if feed pruning batch jobs creation fails', async () => {
      consumer['globalChallengeFeedPruningService'].createPruningBatchJobs =
        jest
          .fn()
          .mockResolvedValue(err(new InternalServerErrorException('SEGFAULT')));
      try {
        await consumer.createFeedPruningBatchJobs(
          JobFake({
            data: {
              globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
            },
          }) as any
        );
        throw new Error('Should not reach here');
      } catch (e) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
      }
    });

    it('should not throw error if feed not found', async () => {
      consumer['globalChallengeFeedPruningService'].createPruningBatchJobs =
        jest
          .fn()
          .mockResolvedValue(
            err(new GlobalActiveChallengesFeedNotFoundException())
          );
      await consumer.createFeedPruningBatchJobs(
        JobFake({
          data: {
            globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
          },
        }) as any
      );
    });
  });

  describe('pruneFeedBatch', () => {
    it('should prune feed batch', async () => {
      consumer['globalChallengeFeedPruningService'].pruneChallengeBatch = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      await consumer.pruneFeedBatch(
        JobFake({
          data: {
            challengeIds: ['1', '2'],
            globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
            feedPage: 1,
          },
        }) as any
      );
      expect(
        consumer['globalChallengeFeedPruningService'].pruneChallengeBatch
      ).toHaveBeenCalledWith({
        challengeIds: ['1', '2'],
        globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
        feedPage: 1,
      });
    });

    it('should throw error if feed pruning batch fails', async () => {
      consumer['globalChallengeFeedPruningService'].pruneChallengeBatch = jest
        .fn()
        .mockResolvedValue(err(new InternalServerErrorException('SEGFAULT')));
      try {
        await consumer.pruneFeedBatch(
          JobFake({
            data: {
              challengeIds: [],
              globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
              feedPage: 1,
            },
          }) as any
        );
        throw new Error('Should not reach here');
      } catch (e) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
      }
    });

    it('should not throw error if feed not found', async () => {
      consumer['globalChallengeFeedPruningService'].pruneChallengeBatch = jest
        .fn()
        .mockResolvedValue(
          err(new GlobalActiveChallengesFeedNotFoundException())
        );
      await consumer.pruneFeedBatch(
        JobFake({
          data: {
            challengeIds: [],
            globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
            feedPage: 1,
          },
        }) as any
      );
    });
  });
});
