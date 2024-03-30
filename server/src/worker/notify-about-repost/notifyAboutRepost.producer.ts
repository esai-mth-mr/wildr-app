import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';

@Injectable()
export class NotifyAboutRepostProducer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectQueue('repost-notification-queue')
    private queue: Queue
  ) {
    this.logger = this.logger.child({
      context: NotifyAboutRepostProducer.name,
    });
  }

  async notify(job: NotifyAboutRepostJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'repost-notification-job',
      job,
      { job }
    );
  }
}

//post.author mentioned subject in a post
export interface NotifyAboutRepostJob {
  repostId: string;
  parentPostId: string;
}
