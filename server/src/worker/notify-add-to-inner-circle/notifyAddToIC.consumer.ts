import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ActivityService } from '@verdzie/server/activity/activity.service';
import { UserAddedToInnerCircleJob } from '@verdzie/server/worker/notify-add-to-inner-circle/notifyAddedToIC.producer';
import { Job } from 'bull';

@Processor('notify-added-to-ic-queue')
export class NotifyAddToICConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private activityService: ActivityService
  ) {
    this.logger = this.logger.child({
      context: NotifyAddToICConsumer.name,
    });
  }

  @Process('notify-added-to-ic-job')
  async notifyAddedToIC(job: Job<UserAddedToInnerCircleJob>) {
    await this.activityService.addedToInnerCircle(job.data);
  }

  @Process('notify-auto-added-to-ic-job')
  async notifyAutoAddedToIC(job: Job<UserAddedToInnerCircleJob>) {
    await this.activityService.automaticallyAddedToInnerCircle(job.data);
  }
}
