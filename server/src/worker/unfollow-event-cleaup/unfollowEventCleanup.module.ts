import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { UnfollowEventCleanupProducer } from '@verdzie/server/worker/unfollow-event-cleaup/unfollowEventCleanup.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'unfollow-event-cleanup-queue',
    }),
  ],
  providers: [UnfollowEventCleanupProducer],
  exports: [UnfollowEventCleanupProducer],
})
export class UnfollowEventCleanupModule {}
