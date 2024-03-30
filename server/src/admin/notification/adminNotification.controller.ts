import { Body, Controller, Inject, Injectable, Post } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  AdminNotificationService,
  prepareFCMDataFromBody,
} from '@verdzie/server/admin/notification/adminNotification.service';
import { SendTrendingPostNotificationBodyDto } from '@verdzie/server/admin/notification/dto/send-trending-post-notification.dto';
import {
  NotificationScope,
  SendGeneralNotificationBodyDto,
} from '@verdzie/server/admin/notification/dto/send-general-notification.dto';
import { SendTrendingChallengeNotificationBodyDto } from '@verdzie/server/admin/notification/dto/send-trending-challenge-notification.dto';
import { sendNotificationToChallengeParticipantsBodyDto } from '@verdzie/server/admin/notification/dto/send-challenge-participant-notification.dto';
import { SendChallengeAnnouncementNotificationDto } from '@verdzie/server/admin/notification/dto/send-challenge-announcement-notification.dto';
import { CreateNotificationDto } from '@verdzie/server/admin/notification/dto/create-notification.dto';

@Injectable()
@Controller('notification')
export class AdminNotificationController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private adminNotificationService: AdminNotificationService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Post()
  async sendGeneralNotification(@Body() body: SendGeneralNotificationBodyDto) {
    if (body.scope === NotificationScope.ALL) {
      const result =
        await this.adminNotificationService.sendNotificationToAllUsers({
          title: body.title,
          body: body.body,
          fcmData: prepareFCMDataFromBody(body),
          imageUrl: body.imageUrl,
        });
      this.logger.warn('[sendGeneralNotification] result', {
        warnings: result.warnings,
      });
      return {
        status: 'OK',
        message: result.message,
        notificationsSentCount: result.notificationSentCount,
        warnings: result.warnings,
      };
    } else if (body.scope === NotificationScope.USERS) {
      const result =
        await this.adminNotificationService.sendNotificationToListOfUsers({
          title: body.title,
          body: body.body,
          userIds: body.userIds ?? [],
          fcmData: prepareFCMDataFromBody(body),
          imageUrl: body.imageUrl,
        });
      this.logger.warn('[sendGeneralNotification] result', {
        warnings: result.warnings,
      });
      return {
        status: 'OK',
        message: result.message,
        notificationsSent: result.notificationSentCount,
        warnings: result.warnings,
      };
    }
  }

  @Post('/trending-post-notification')
  async sendTrendingPostNotification(
    @Body() body: SendTrendingPostNotificationBodyDto
  ) {
    const result =
      await this.adminNotificationService.sendTrendingPostNotification({
        title: body.title,
        body: body.body,
        postId: body.postId,
        handles: body.handles,
      });
    if (result.isErr()) {
      this.logger.error('[sendTrendingPostNotification] error', {
        error: result.error,
      });
      return {
        status: 'ERROR',
        message: result.error.message,
      };
    }
    return {
      status: 'OK',
      ...result.value,
    };
  }

  @Post('/trending-challenge-notification')
  async sendTrendingChallengeNotification(
    @Body() body: SendTrendingChallengeNotificationBodyDto
  ) {
    const result =
      await this.adminNotificationService.sendTrendingChallengeNotification({
        title: body.title,
        body: body.body,
        challengeId: body.challengeId,
        handles: body.handles,
      });
    if (result.isErr()) {
      this.logger.error('[sendTrendingChallengeNotification] error', {
        error: result.error,
      });
      return {
        status: 'ERROR',
        message: result.error.message,
      };
    }
    return {
      status: 'OK',
      ...result.value,
    };
  }

  @Post('/challenge-participants-notification')
  async sendNotificationToChallengeParticipants(
    @Body() body: sendNotificationToChallengeParticipantsBodyDto
  ) {
    const result =
      await this.adminNotificationService.sendNotificationToChallengeParticipants(
        {
          title: body.title,
          body: body.body,
          challengeId: body.challengeId,
          includeAuthor: body.includeAuthor,
        }
      );
    if (result.isErr()) {
      this.logger.error('[sendNotificationToChallengeParticipants] error', {
        error: result.error,
      });
      return {
        status: 'ERROR',
        message: result.error.message,
      };
    }
    return {
      status: 'OK',
      ...result.value,
    };
  }

  @Post('/challenge-launch-announcement')
  async challengeLaunchAnnouncement(
    @Body() body: SendChallengeAnnouncementNotificationDto
  ) {
    const result =
      await this.adminNotificationService.sendChallengeLaunchAnnouncement(body);
    this.logger.warn('[challengeLaunchAnnouncement] result', {
      warnings: result.warnings,
    });
    return {
      status: 'OK',
      message: result.message,
      notificationsSentCount: result.notificationSentCount,
      warnings: result.warnings,
    };
  }

  @Post('/create-notification')
  async createNotification(@Body() body: CreateNotificationDto) {
    const result = await this.adminNotificationService.createNotification(body);
    if (result.isErr()) {
      this.logger.error('[createNotification] error', {
        error: result.error,
      });
      return {
        status: 'ERROR',
        message: result.error.message,
      };
    }
    return {
      status: 'OK',
      ...result.value,
    };
  }
}
