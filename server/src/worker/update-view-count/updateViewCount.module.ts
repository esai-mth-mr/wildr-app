import { Module } from '@nestjs/common';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { BullModule } from '@nestjs/bull';
import { UpdateViewCountProducer } from '@verdzie/server/worker/update-view-count/updateViewCount.producer';
import { UserModule } from '@verdzie/server/user/user.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'update-view-count-queue',
    }),
  ],
  providers: [UpdateViewCountProducer],
  exports: [UpdateViewCountProducer],
})
export class UpdateViewCountModule {}
