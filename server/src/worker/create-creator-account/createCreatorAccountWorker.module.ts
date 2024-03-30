import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CreateCreatorAccountProducer } from '@verdzie/server/worker/create-creator-account/createCreatorAccount.producer';
import { CREATE_CREATOR_QUEUE_NAME } from '@verdzie/server/admin/creator-users/creator-user-queue-constants';

@Module({
  imports: [BullModule.registerQueue({ name: CREATE_CREATOR_QUEUE_NAME })],
  providers: [CreateCreatorAccountProducer],
  exports: [CreateCreatorAccountProducer],
})
export class CreateCreatorAccountWorkerModule {}
