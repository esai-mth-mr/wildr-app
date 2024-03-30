import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { ScheduledNotificationType } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Logger } from 'winston';

export const SCHEDULED_NOTIFICATION_BUILDER_QUEUE_NAME =
  'scheduled-notification-builder-queue';
export const SCHEDULED_NOTIFICATION_BUILDER_BUILD_JOB_NAME =
  'scheduled-notification-builder-build-job';

export type NotificationBuilderJobItem = {
  recipientId: string;
  notificationType: ScheduledNotificationType;
};

export interface ScheduledNotificationBuilderJob {
  parentId: string;
  items: NotificationBuilderJobItem[];
}

@Injectable()
export class ScheduledNotificationBuilderProducer extends WildrProducer {
  constructor(
    @InjectQueue(SCHEDULED_NOTIFICATION_BUILDER_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createJob(
    job: ScheduledNotificationBuilderJob
  ): Promise<Result<undefined, InternalServerErrorException>> {
    try {
      await this.produceUnsafe(
        SCHEDULED_NOTIFICATION_BUILDER_BUILD_JOB_NAME,
        job
      );
      return ok(undefined);
    } catch (error) {
      return err(
        new InternalServerErrorException('[createJob] ' + error, {
          error,
          job,
        })
      );
    }
  }
}
