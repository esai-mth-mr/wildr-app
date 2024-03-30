import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { SqsPruneGlobalChallengesFeedHandler } from '@verdzie/server/sqs/sqs-prune-global-challenges-feed-handler/sqs-prune-global-challenges-feed.handler';
import { GlobalChallengeFeedPruningProducerModule } from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.producer.module';

@Module({
  imports: [
    GlobalChallengeFeedPruningProducerModule,
    SqsModule.register({
      consumers: [
        {
          name: process.env.SQS_PRUNE_CHALLENGES_GLOBAL_FEED_QUEUE_NAME ?? '',
          queueUrl:
            process.env.SQS_PRUNE_CHALLENGES_GLOBAL_FEED_QUEUE_URL ?? '',
        },
      ],
    }),
  ],
  providers: [SqsPruneGlobalChallengesFeedHandler],
  exports: [SqsPruneGlobalChallengesFeedHandler],
})
export class SQSPruneGlobalChallengesFeedModule {}
