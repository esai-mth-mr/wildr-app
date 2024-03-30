import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  DISTRIBUTE_POSTS_QUEUE_NAME,
  DistributePostsProducer,
} from '@verdzie/server/worker/distribute-post/distributePosts.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: DISTRIBUTE_POSTS_QUEUE_NAME,
    }),
  ],
  providers: [DistributePostsProducer],
  exports: [DistributePostsProducer],
})
export class DistributePostsProducerModule {}
