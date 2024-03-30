import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { UpdateUserRepliesStateProducer } from '@verdzie/server/worker/existence-state/update-user-replies-state/updateUserRepliesState.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'update-user-replies-state-queue',
    }),
  ],
  exports: [UpdateUserRepliesStateProducer],
  providers: [UpdateUserRepliesStateProducer],
})
export class UpdateUserRepliesStateWorkerModule {}
