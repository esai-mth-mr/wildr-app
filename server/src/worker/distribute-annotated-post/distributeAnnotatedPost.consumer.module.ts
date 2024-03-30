import { Module, forwardRef } from '@nestjs/common';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { DistributeAnnotatedPostConsumer } from '@verdzie/server/worker/distribute-annotated-post/distributeAnnotatedPost.consumer';
import { NotifyFollowersAboutPostsWorkerModule } from '@verdzie/server/worker/notify-followers-about-posts/notifyFollowersAboutPostsWorker.module';
import { RankAndDistributePostProducerModule } from '@verdzie/server/worker/rank-and-distribute-post/rankAndDistributePost.producer.module';

@Module({
  imports: [
    UserModule,
    PostModule,
    FeedModule,
    NotifyFollowersAboutPostsWorkerModule,
    forwardRef(() => RankAndDistributePostProducerModule),
  ],
  providers: [DistributeAnnotatedPostConsumer],
  exports: [DistributeAnnotatedPostConsumer],
})
export class DistributePostsConsumerModule {}
