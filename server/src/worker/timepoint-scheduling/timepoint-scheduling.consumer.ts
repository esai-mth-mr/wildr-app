import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { TimepointService } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.service';
import {
  CANCEL_NOTIFICATION_JOB_NAME,
  SCHEDULE_NOTIFICATION_JOB_NAME,
  ScheduleNotificationJobData,
  TIMEPOINT_SCHEDULING_QUEUE_NAME,
} from '@verdzie/server/worker/timepoint-scheduling/timepoint-scheduling.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(TIMEPOINT_SCHEDULING_QUEUE_NAME)
export class TimepointSchedulingConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly timepointService: TimepointService
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  @Process(SCHEDULE_NOTIFICATION_JOB_NAME)
  async scheduleNotification(job: Job<ScheduleNotificationJobData>) {
    const result = await this.timepointService.scheduleNotification(job.data);
    if (result.isErr()) {
      throw result.error;
    }
  }

  @Process(CANCEL_NOTIFICATION_JOB_NAME)
  async cancelNotification(job: Job<ScheduleNotificationJobData>) {
    const result = await this.timepointService.cancelNotification(job.data);
    if (result.isErr()) {
      throw result.error;
    }
  }
}
