import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { ObjectRoutedFCMData } from '@verdzie/server/fcm/fcm.service';
import { ScheduledNotificationType } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Logger } from 'winston';

export const SCHEDULED_NOTIFICATION_SENDER_QUEUE_NAME =
  'scheduled-notification-sender-queue';
export const SCHEDULED_NOTIFICATION_SEND_JOB_NAME =
  'scheduled-notification-sender-job';

export type NotificationSenderJobItem = {
  recipientId: string;
  notificationType: ScheduledNotificationType;
};

export interface ScheduledNotificationSenderJob {
  fcmToken: string;
  notificationStrings: {
    title: string;
    body: string;
  };
  notificationData: ObjectRoutedFCMData;
}

@Injectable()
export class ScheduledNotificationSenderProducer extends WildrProducer {
  constructor(
    @InjectQueue(SCHEDULED_NOTIFICATION_SENDER_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async sendNotification(
    job: ScheduledNotificationSenderJob
  ): Promise<Result<undefined, InternalServerErrorException>> {
    try {
      await this.produceUnsafe(SCHEDULED_NOTIFICATION_SEND_JOB_NAME, job);
      return ok(undefined);
    } catch (error) {
      return err(
        new InternalServerErrorException('[sendNotification] ' + error, {
          error,
          methodName: 'sendNotification',
        })
      );
    }
  }
}
