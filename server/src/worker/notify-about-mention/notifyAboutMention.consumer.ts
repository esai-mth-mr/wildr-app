import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ActivityService } from '@verdzie/server/activity/activity.service';
import { Job } from 'bull';
import {
  NotifyAboutMentionedInCommentJob,
  NotifyAboutMentionedInPostJob,
  NotifyAboutMentionedInReplyJob,
} from '@verdzie/server/worker/notify-about-mention/notifyAboutMention.producer';

@Processor('notify-about-mentions-queue')
export class NotifyAboutMentionConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private activityService: ActivityService
  ) {
    console.info('NotifyAboutMentionConsumer created');
    this.logger = this.logger.child({
      context: 'NotifyAboutMentionConsumer',
    });
  }

  @Process('mentioned-in-post-job')
  async mentionedInPost(job: Job<NotifyAboutMentionedInPostJob>) {
    await this.activityService.mentionedInPost(job.data);
  }

  @Process('mentioned-in-comment-job')
  async mentionedInComment(job: Job<NotifyAboutMentionedInCommentJob>) {
    await this.activityService.mentionedInComment(job.data);
  }

  @Process('mentioned-in-reply-job')
  async mentionedInReply(job: Job<NotifyAboutMentionedInReplyJob>) {
    await this.activityService.mentionedInReply(job.data);
  }
}
