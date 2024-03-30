import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeSchema } from '@verdzie/server/challenge/challenge-data-objects/challenge.schema';
import { FeedSchema } from '@verdzie/server/feed/feed.schema';
import { ChallengeCreatorDailyNotificationConfig } from '@verdzie/server/notification-scheduler/notification-config/configs/challenge-creator-daily-notification.config';
import { ChallengeParticipantDailyNotificationConfig } from '@verdzie/server/notification-scheduler/notification-config/configs/challenge-participant-daily-notification.config';
import { NotificationConfigService } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChallengeSchema, FeedSchema])],
  providers: [
    ChallengeCreatorDailyNotificationConfig,
    ChallengeParticipantDailyNotificationConfig,
    NotificationConfigService,
  ],
  exports: [NotificationConfigService],
})
export class NotificationConfigModule {}
