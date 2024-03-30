import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { ScheduledNotificationSenderService } from '@verdzie/server/notification-scheduler/orchestrator/notification-sender/notification-sender.service';
import {
  SCHEDULED_NOTIFICATION_SENDER_QUEUE_NAME,
  SCHEDULED_NOTIFICATION_SEND_JOB_NAME,
  ScheduledNotificationSenderJob,
} from '@verdzie/server/worker/notification-sender/notification-sender.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(SCHEDULED_NOTIFICATION_SENDER_QUEUE_NAME)
export class ScheduledNotificationSenderConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly scheduledNotificationSender: ScheduledNotificationSenderService
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  @Process(SCHEDULED_NOTIFICATION_SEND_JOB_NAME)
  async sendNotification(job: Job<ScheduledNotificationSenderJob>) {
    const result = await this.scheduledNotificationSender.send(job.data);
    if (result.isErr()) {
      throw result.error;
    }
  }
}
