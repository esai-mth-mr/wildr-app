import { Module } from '@nestjs/common';
import { NotificationConfigModule } from '@verdzie/server/notification-scheduler/notification-config/notification-config.module';
import { ScheduledNotificationBuilderService } from '@verdzie/server/notification-scheduler/orchestrator/notification-builder/notification-builder.service';
import { ScheduledNotificationSenderProducerModule } from '@verdzie/server/worker/notification-sender/notification-sender-producer.module';

@Module({
  imports: [
    NotificationConfigModule,
    ScheduledNotificationSenderProducerModule,
  ],
  providers: [ScheduledNotificationBuilderService],
  exports: [ScheduledNotificationBuilderService],
})
export class ScheduledNotificationBuilderModule {}
