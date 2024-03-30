import { getQueueToken } from '@nestjs/bull';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import {
  GLOBAL_CHALLENGE_FEED_PRUNING_BATCH_CREATION_JOB_NAME,
  GLOBAL_CHALLENGE_FEED_PRUNING_BATCH_JOB_NAME,
  GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME,
  GlobalChallengeFeedPruningProducer,
} from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.producer';

describe('GlobalChallengeFeedPruningProducer', () => {
  let producer: GlobalChallengeFeedPruningProducer;

  beforeEach(async () => {
    producer = (
      await createMockedTestingModule({
        providers: [
          GlobalChallengeFeedPruningProducer,
          {
            provide: getQueueToken(GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME),
            useValue: {
              add: jest.fn().mockResolvedValue(undefined),
              on: jest.fn().mockResolvedValue(undefined),
            },
          },
        ],
      })
    ).get(GlobalChallengeFeedPruningProducer);
  });

  describe('createBatchJobs', () => {
    it('should produce a job', async () => {
      await producer.createBatchJobs({
        globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
      } as any);
      expect(producer['queue'].add).toHaveBeenCalledWith(
        GLOBAL_CHALLENGE_FEED_PRUNING_BATCH_CREATION_JOB_NAME,
        { globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES },
        {}
      );
    });
  });

  describe('createPruningBatchJob', () => {
    it('should produce a job', async () => {
      await producer.createPruningBatchJob({
        delayMS: 500,
        job: {
          challengeIds: ['1'],
          globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
          feedPage: 1,
        },
      });
      expect(producer['queue'].add).toHaveBeenCalledWith(
        GLOBAL_CHALLENGE_FEED_PRUNING_BATCH_JOB_NAME,
        {
          challengeIds: ['1'],
          globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
          feedPage: 1,
        },
        { delay: 500 }
      );
    });
  });
});
