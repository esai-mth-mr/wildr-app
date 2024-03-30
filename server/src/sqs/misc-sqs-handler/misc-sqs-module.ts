import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { MiscSQSHandler } from './misc-sqs-handler';
import { UpdateUsersInviteCountWorkerModule } from '@verdzie/server/worker/update-users-invite-count/updateUsersInviteCount.module';
import { PrepareUpdateUsersBatchWorkerModule } from '@verdzie/server/worker/prepare-update-users-batch/prepareUpdateUsersBatch.module';
import { UpdateUsersInBatchProducer } from '@verdzie/server/worker/batch-update-users/updateUsersInBatch.producer';
import { UpdateUsersInBatchModule } from '@verdzie/server/worker/batch-update-users/updateUsersInBatch.module';

@Module({
  imports: [
    SqsModule.register({
      consumers: [
        {
          name: process.env.SQS_MISC_QUEUE_NAME ?? '',
          queueUrl: process.env.SQS_MISC_QUEUE_URL ?? '',
        },
      ],
    }),
    UpdateUsersInviteCountWorkerModule,
    PrepareUpdateUsersBatchWorkerModule,
    UpdateUsersInBatchModule,
  ],
  providers: [MiscSQSHandler, MiscSQSHandler],
  exports: [MiscSQSHandler],
})
export class MiscSQSModule {}
