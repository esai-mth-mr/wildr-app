import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FollowEventFillUpProducer } from '@verdzie/server/worker/follow-event-fillup/followEventFillup.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'follow-event-fill-up-queue',
    }),
  ],
  providers: [FollowEventFillUpProducer],
  exports: [FollowEventFillUpProducer],
})
export class FollowEventFillUpModule {}
