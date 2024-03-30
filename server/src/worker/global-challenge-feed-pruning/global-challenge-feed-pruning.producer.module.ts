import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME,
  GlobalChallengeFeedPruningProducer,
} from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME,
    }),
  ],
  providers: [GlobalChallengeFeedPruningProducer],
  exports: [GlobalChallengeFeedPruningProducer],
})
export class GlobalChallengeFeedPruningProducerModule {}
