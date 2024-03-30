import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { SqsPruneGlobalChallengesFeedHandler } from '@verdzie/server/sqs/sqs-prune-global-challenges-feed-handler/sqs-prune-global-challenges-feed.handler';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe(SqsPruneGlobalChallengesFeedHandler.name, () => {
  let handler: SqsPruneGlobalChallengesFeedHandler;

  beforeEach(async () => {
    handler = (
      await createMockedTestingModule({
        providers: [SqsPruneGlobalChallengesFeedHandler],
      })
    ).get(SqsPruneGlobalChallengesFeedHandler);
  });

  describe('handleMessage', () => {
    it('should validate the message', async () => {
      const message = {
        Body: JSON.stringify({
          feed: 'invalid feed type',
        }),
      };
      await handler.handleMessage(message as any);
      expect(
        handler['globalChallengeFeedPruningProducer'].createBatchJobs
      ).not.toHaveBeenCalled();
    });

    it('should handle malformed json', async () => {
      const message = {
        Body: 'malformed json',
      };
      await handler.handleMessage(message as any);
      expect(
        handler['globalChallengeFeedPruningProducer'].createBatchJobs
      ).not.toHaveBeenCalled();
    });

    it('should create job for pruning global challenges feed', async () => {
      const message = {
        Body: JSON.stringify({ feed: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES }),
      };
      await handler.handleMessage(message as any);
      expect(
        handler['globalChallengeFeedPruningProducer'].createBatchJobs
      ).toHaveBeenCalledWith({
        globalChallengeFeedType: FeedEntityType.GLOBAL_ACTIVE_CHALLENGES,
      });
    });
  });
});
