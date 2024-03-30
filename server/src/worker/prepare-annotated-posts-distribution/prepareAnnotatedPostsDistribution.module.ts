import { Module } from '@nestjs/common';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { BullModule } from '@nestjs/bull';
import { PrepareAnnotatedPostsDistributionProducer } from '@verdzie/server/worker/prepare-annotated-posts-distribution/prepareAnnotatedPostsDistribution.producer';
import { DistributeAnnotatedPostModule } from '@verdzie/server/worker/distribute-annotated-post/distributeAnnotatedPost.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'prepare-annotated-posts-distribution-queue',
    }),
    FeedModule,
    DistributeAnnotatedPostModule,
  ],
  providers: [PrepareAnnotatedPostsDistributionProducer],
  exports: [PrepareAnnotatedPostsDistributionProducer],
})
export class PrepareAnnotatedPostsDistributionModule {}
