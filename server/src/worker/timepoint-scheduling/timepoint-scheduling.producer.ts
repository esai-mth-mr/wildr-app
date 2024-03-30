import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { ScheduledNotificationType } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export const TIMEPOINT_SCHEDULING_QUEUE_NAME = 'timepoint-scheduling-queue';
export const SCHEDULE_NOTIFICATION_JOB_NAME = 'schedule-notification-job';
export const CANCEL_NOTIFICATION_JOB_NAME = 'cancel-notification-job';

export interface ScheduleNotificationJobData {
  parentId: string;
  recipientId: string;
  notificationType: ScheduledNotificationType;
}

export interface CancelNotificationJobData {
  parentId: string;
  recipientId: string;
  notificationType: ScheduledNotificationType;
}

@Injectable()
export class TimepointSchedulingProducer extends WildrProducer {
  constructor(
    @InjectQueue(TIMEPOINT_SCHEDULING_QUEUE_NAME)
    protected readonly queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async scheduleNotification(job: ScheduleNotificationJobData): Promise<void> {
    await this.produce(SCHEDULE_NOTIFICATION_JOB_NAME, job);
  }

  async cancelNotification(job: CancelNotificationJobData): Promise<void> {
    await this.produce(CANCEL_NOTIFICATION_JOB_NAME, job);
  }
}
