import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { DistributePostsToFollowingPostsFeedServiceModule } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowing.service.module';
import { DistributePostsToFollowingPostsFeedConsumer } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowingPostsFeed.consumer';
import { DISTRIBUTE_POST_TO_FOLLOWERS_QUEUE_NAME } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowingPostsFeedWorker.config';

@Module({
  imports: [
    BullModule.registerQueue({
      name: DISTRIBUTE_POST_TO_FOLLOWERS_QUEUE_NAME,
    }),
    DistributePostsToFollowingPostsFeedServiceModule,
  ],
  providers: [DistributePostsToFollowingPostsFeedConsumer],
  exports: [DistributePostsToFollowingPostsFeedConsumer],
})
export class DistributePostsToFollowingPostsFeedConsumerModule {}
