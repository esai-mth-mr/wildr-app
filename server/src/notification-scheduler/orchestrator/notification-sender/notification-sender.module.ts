import { Module } from '@nestjs/common';
import { FCMModule } from '@verdzie/server/fcm/fcm.module';
import { ScheduledNotificationSenderService } from '@verdzie/server/notification-scheduler/orchestrator/notification-sender/notification-sender.service';

@Module({
  imports: [FCMModule],
  providers: [ScheduledNotificationSenderService],
  exports: [ScheduledNotificationSenderService],
})
export class ScheduledNotificationSenderModule {}
