import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';

@Injectable()
export class NotifyAboutMentionProducer {
  private readonly canNotify: boolean;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectQueue('notify-about-mentions-queue')
    private queue: Queue
  ) {
    this.logger = this.logger.child({ context: 'NotifyAboutMentionProducer' });
    this.canNotify = process.env.CAN_NOTIFY === 'true';
  }

  async mentionedInPost(job: NotifyAboutMentionedInPostJob) {
    this.logger.info('mentionedInPost');
    if (!this.canNotify) {
      this.logger.info('Can not notify', {});
      return;
    }
    await queueWithLogging(
      this.logger,
      this.queue,
      'mentioned-in-post-job',
      job,
      {
        job,
      }
    );
  }

  async mentionedInComment(job: NotifyAboutMentionedInCommentJob) {
    this.logger.info('mentionedInComment()', {});
    if (!this.canNotify) {
      this.logger.info('Can not notify', {});
      return;
    }
    await queueWithLogging(
      this.logger,
      this.queue,
      'mentioned-in-comment-job',
      job,
      {
        job,
      }
    );
  }

  async mentionedInReply(job: NotifyAboutMentionedInReplyJob) {
    this.logger.info('mentionedInReply()', {});
    if (!this.canNotify) {
      this.logger.info('Can not notify', {});
      return;
    }
    await queueWithLogging(
      this.logger,
      this.queue,
      'mentioned-in-reply-job',
      job,
      {
        job,
      }
    );
  }
}

/**
 * post.author mentioned subject in a post
 */
export interface NotifyAboutMentionedInPostJob {
  postId: string;
  objectId: string;
  pageIndex: number;
}

/**
 * `author of the comment` mentioned `object` in a `comment`
 */
export interface NotifyAboutMentionedInCommentJob {
  commentId: string;
  objectId: string;
}

export interface NotifyAboutMentionedInReplyJob {
  replyId: string;
  objectId: string;
}
