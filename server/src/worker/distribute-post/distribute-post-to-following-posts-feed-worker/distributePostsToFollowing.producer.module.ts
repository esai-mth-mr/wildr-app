import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { DistributePostsToFollowingPostsFeedProducer } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowingPostsFeed.producer';
import { DISTRIBUTE_POST_TO_FOLLOWERS_QUEUE_NAME } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowingPostsFeedWorker.config';

@Module({
  imports: [
    BullModule.registerQueue({
      name: DISTRIBUTE_POST_TO_FOLLOWERS_QUEUE_NAME,
    }),
  ],
  providers: [DistributePostsToFollowingPostsFeedProducer],
  exports: [DistributePostsToFollowingPostsFeedProducer],
})
export class DistributePostsToFollowingPostsFeedProducerModule {}
