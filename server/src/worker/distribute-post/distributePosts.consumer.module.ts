import { Module } from '@nestjs/common';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { UserListModule } from '@verdzie/server/user-list/userList.module';
import { UserPropertyMapModule } from '@verdzie/server/user-property-map/userPropertyMap.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { DistributePostsToFollowingPostsFeedProducerModule } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowing.producer.module';
import { DistributePostToListsProducerModule } from '@verdzie/server/worker/distribute-post/distribute-post-to-lists-worker/distributePostToLists.producer.module';
import { DistributePostsConsumer } from '@verdzie/server/worker/distribute-post/distributePosts.consumer';
import { DistributePostsProducerModule } from '@verdzie/server/worker/distribute-post/distributePosts.producer.module';
import { NotifyFollowersAboutPostsWorkerModule } from '@verdzie/server/worker/notify-followers-about-posts/notifyFollowersAboutPostsWorker.module';
import { UpdateUserExploreFeedProducerModule } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.producer.module';

@Module({
  imports: [
    UserModule,
    PostModule,
    FeedModule,
    UserPropertyMapModule,
    UserListModule,
    NotifyFollowersAboutPostsWorkerModule,
    DistributePostsProducerModule,
    DistributePostToListsProducerModule,
    DistributePostsToFollowingPostsFeedProducerModule,
    UpdateUserExploreFeedProducerModule,
    DistributePostsProducerModule,
  ],
  providers: [DistributePostsConsumer],
  exports: [DistributePostsConsumer],
})
export class DistributePostsConsumerModule {}
