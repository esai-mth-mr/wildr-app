import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { GlobalChallengeFeedPruningModule } from '@verdzie/server/challenge/global-challenge-feed-pruning/global-challenge-feed-pruning.module';
import { GlobalChallengeFeedPruningConsumer } from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.consumer';
import { GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME } from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME,
    }),
    GlobalChallengeFeedPruningModule,
  ],
  providers: [GlobalChallengeFeedPruningConsumer],
  exports: [GlobalChallengeFeedPruningConsumer],
})
export class GlobalChallengeFeedPruningConsumerModule {}
