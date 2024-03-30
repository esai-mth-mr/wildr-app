import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ActivityService } from '@verdzie/server/activity/activity.service';
import { Job } from 'bull';
import { NotifyAboutRepostJob } from '@verdzie/server/worker/notify-about-repost/notifyAboutRepost.producer';

@Processor('repost-notification-queue')
export class NotifyAboutRepostConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private activityService: ActivityService
  ) {
    console.info(NotifyAboutRepostConsumer.name + ' created');
    this.logger = this.logger.child({
      context: NotifyAboutRepostConsumer.name,
    });
  }

  @Process('repost-notification-job')
  async notifyAboutRepost(job: Job<NotifyAboutRepostJob>) {
    try {
      await this.activityService.repost(job.data);
    } catch (e) {
      this.logger.error(e);
    }
  }
}
