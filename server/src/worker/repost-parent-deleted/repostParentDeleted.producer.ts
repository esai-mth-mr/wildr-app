import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';

@Injectable()
export class RepostParentDeletedProducer {
  constructor(
    @InjectQueue('repost-parent-deleted-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({
      context: RepostParentDeletedProducer.name,
    });
  }

  async onParentPostDeleted(job: RepostParentDeletedJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'repost-parent-deleted',
      job
    );
  }
}

export interface RepostParentDeletedJob {
  parentPostId: string;
}
