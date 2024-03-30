import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { UpdateUserPostsStateProducer } from '@verdzie/server/worker/existence-state/update-user-posts-state/updateUserPostsState.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'update-user-posts-state-queue',
    }),
  ],
  providers: [UpdateUserPostsStateProducer],
  exports: [UpdateUserPostsStateProducer],
})
export class UpdateUserPostsStateWorkerModule {}
