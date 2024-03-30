import { Module } from '@nestjs/common';
import { FCMModule } from '@verdzie/server/fcm/fcm.module';
import { AdminNotificationController } from '@verdzie/server/admin/notification/adminNotification.controller';
import { AdminNotificationService } from '@verdzie/server/admin/notification/adminNotification.service';
import { AdminUserModule } from '@verdzie/server/admin/user/adminUser.module';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { NotificationContentSchema } from '@verdzie/server/admin/notification/notificationContent.schema';

@Module({
  imports: [
    FCMModule,
    AdminUserModule,
    TypeOrmModule.forFeature([
      PostEntity,
      ChallengeEntity,
      NotificationContentSchema,
    ]),
    FeedModule,
  ],
  controllers: [AdminNotificationController],
  providers: [AdminNotificationService],
  exports: [AdminNotificationService],
})
export class AdminNotificationModule {}
