import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { UpdateUsersInBatchProducer } from '@verdzie/server/worker/batch-update-users/updateUsersInBatch.producer';
import { PrepareInitialFeedModule } from '@verdzie/server/worker/prepare-initial-feed/prepareInitialFeed.module';

@Module({
  imports: [
    PrepareInitialFeedModule,
    BullModule.registerQueue({
      name: 'update-users-in-batch-queue',
    }),
  ],
  providers: [UpdateUsersInBatchProducer],
  exports: [UpdateUsersInBatchProducer],
})
export class UpdateUsersInBatchModule {}
