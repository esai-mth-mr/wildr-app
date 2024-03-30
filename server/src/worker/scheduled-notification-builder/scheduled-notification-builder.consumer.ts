import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { ScheduledNotificationBuilderService } from '@verdzie/server/notification-scheduler/orchestrator/notification-builder/notification-builder.service';
import {
  SCHEDULED_NOTIFICATION_BUILDER_BUILD_JOB_NAME,
  SCHEDULED_NOTIFICATION_BUILDER_QUEUE_NAME,
  ScheduledNotificationBuilderJob,
} from '@verdzie/server/worker/scheduled-notification-builder/scheduled-notification-builder.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(SCHEDULED_NOTIFICATION_BUILDER_QUEUE_NAME)
export class ScheduledNotificationBuilderConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly scheduledNotificationBuilder: ScheduledNotificationBuilderService
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  @Process(SCHEDULED_NOTIFICATION_BUILDER_BUILD_JOB_NAME)
  async scheduleNotification(job: Job<ScheduledNotificationBuilderJob>) {
    const result = await this.scheduledNotificationBuilder.buildAndEnqueue(
      job.data
    );
    if (result.isErr()) {
      throw result.error;
    }
  }
}
