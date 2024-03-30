import { Module } from '@nestjs/common';
import { DistributePostsToFollowingPostsFeedProducerModule } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowing.producer.module';
import { DistributePostToListsProducerModule } from '@verdzie/server/worker/distribute-post/distribute-post-to-lists-worker/distributePostToLists.producer.module';
import { NotifyFollowersAboutPostsWorkerModule } from '../notify-followers-about-posts/notifyFollowersAboutPostsWorker.module';
import { DistributePostsProducerModule } from '@verdzie/server/worker/distribute-post/distributePosts.producer.module';

@Module({
  imports: [
    NotifyFollowersAboutPostsWorkerModule,
    DistributePostsProducerModule,
    DistributePostToListsProducerModule,
    DistributePostsToFollowingPostsFeedProducerModule,
  ],
})
export class DistributePostsWorkerModule {}
