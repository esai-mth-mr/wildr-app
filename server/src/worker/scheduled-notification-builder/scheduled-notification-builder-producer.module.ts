import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  SCHEDULED_NOTIFICATION_BUILDER_QUEUE_NAME,
  ScheduledNotificationBuilderProducer,
} from '@verdzie/server/worker/scheduled-notification-builder/scheduled-notification-builder.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SCHEDULED_NOTIFICATION_BUILDER_QUEUE_NAME,
    }),
  ],
  providers: [ScheduledNotificationBuilderProducer],
  exports: [ScheduledNotificationBuilderProducer],
})
export class ScheduledNotificationBuilderProducerModule {}
