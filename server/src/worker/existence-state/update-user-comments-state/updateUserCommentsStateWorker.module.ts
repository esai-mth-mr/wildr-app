import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { UpdateUserCommentsStateProducer } from '@verdzie/server/worker/existence-state/update-user-comments-state/updateUserCommentsState.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'update-user-comments-state-queue',
    }),
  ],
  providers: [UpdateUserCommentsStateProducer],
  exports: [UpdateUserCommentsStateProducer],
})
export class UpdateUserCommentsStateWorkerModule {}
