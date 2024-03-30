import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeSchema } from '@verdzie/server/challenge/challenge-data-objects/challenge.schema';
import { GlobalChallengeFeedPruningService } from '@verdzie/server/challenge/global-challenge-feed-pruning/global-challenge-feed-pruning.service';
import { FeedSchema } from '@verdzie/server/feed/feed.schema';
import { GlobalChallengeFeedPruningProducerModule } from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.producer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChallengeSchema, FeedSchema]),
    GlobalChallengeFeedPruningProducerModule,
  ],
  providers: [GlobalChallengeFeedPruningService],
  exports: [GlobalChallengeFeedPruningService],
})
export class GlobalChallengeFeedPruningModule {}
