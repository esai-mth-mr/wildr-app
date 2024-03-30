import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { UpdatePostsInBatchProducer } from '@verdzie/server/worker/update-posts-in-batch/updatePostsInBatch.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'update-posts-batch-queue',
    }),
  ],
  providers: [UpdatePostsInBatchProducer],
  exports: [UpdatePostsInBatchProducer],
})
@Module({})
export class UpdatePostsInBatchModule {}
