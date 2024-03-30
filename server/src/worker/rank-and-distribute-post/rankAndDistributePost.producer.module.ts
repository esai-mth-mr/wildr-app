import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { RankAndDistributePostProducer } from '@verdzie/server/worker/rank-and-distribute-post/rankAndDistributePost.producer';

@Module({
  imports: [
    FeedModule,
    UserModule,
    forwardRef(() => PostModule),
    BullModule.registerQueue({ name: 'rank-and-distribute-post-queue' }),
  ],
  providers: [RankAndDistributePostProducer],
  exports: [RankAndDistributePostProducer],
})
export class RankAndDistributePostProducerModule {}
