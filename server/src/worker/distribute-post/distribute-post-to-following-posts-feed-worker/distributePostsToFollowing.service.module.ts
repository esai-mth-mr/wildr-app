import { Module } from '@nestjs/common';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { DistributePostsToFollowingPostsFeedService } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowing.service';
import { NotifyFollowersAboutPostsWorkerModule } from '@verdzie/server/worker/notify-followers-about-posts/notifyFollowersAboutPostsWorker.module';

@Module({
  imports: [FeedModule, PostModule, NotifyFollowersAboutPostsWorkerModule],
  providers: [DistributePostsToFollowingPostsFeedService],
  exports: [DistributePostsToFollowingPostsFeedService],
})
export class DistributePostsToFollowingPostsFeedServiceModule {}
