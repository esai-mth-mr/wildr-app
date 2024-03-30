import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { PrepareUpdateUsersBatchProducer } from '@verdzie/server/worker/prepare-update-users-batch/prepareUpdateUsersBatch.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'prepare-update-users-batch-queue',
    }),
  ],
  providers: [PrepareUpdateUsersBatchProducer],
  exports: [PrepareUpdateUsersBatchProducer],
})
export class PrepareUpdateUsersBatchWorkerModule {}
