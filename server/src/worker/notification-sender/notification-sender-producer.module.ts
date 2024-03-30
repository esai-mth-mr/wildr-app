import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  SCHEDULED_NOTIFICATION_SENDER_QUEUE_NAME,
  ScheduledNotificationSenderProducer,
} from '@verdzie/server/worker/notification-sender/notification-sender.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SCHEDULED_NOTIFICATION_SENDER_QUEUE_NAME,
    }),
  ],
  providers: [ScheduledNotificationSenderProducer],
  exports: [ScheduledNotificationSenderProducer],
})
export class ScheduledNotificationSenderProducerModule {}
