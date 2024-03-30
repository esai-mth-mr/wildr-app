import { RankAndDistributePostConsumer } from '@verdzie/server/worker/rank-and-distribute-post/rankAndDistributePost.consumer';
import { RankAndDistributePostProducerModule } from './rankAndDistributePost.producer.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { Module, forwardRef } from '@nestjs/common';
import { PostModule } from '@verdzie/server/post/post.module';
import { UpdateUserExploreFeedProducerModule } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.producer.module';
import { RankPostService } from '@verdzie/server/worker/rank-and-distribute-post/rank-post.service';

@Module({
  imports: [
    RankAndDistributePostProducerModule,
    FeedModule,
    UserModule,
    forwardRef(() => PostModule),
    UpdateUserExploreFeedProducerModule,
  ],
  providers: [RankAndDistributePostConsumer, RankPostService],
})
export class RankAndDistributePostConsumerModule {}
