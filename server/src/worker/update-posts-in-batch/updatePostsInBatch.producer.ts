import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';

@Injectable()
export class UpdatePostsInBatchProducer {
  constructor(
    @InjectQueue('update-posts-batch-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({
      context: UpdatePostsInBatchProducer.name,
    });
  }

  async updatePosts(job: UpdatePostsInBatchJob) {
    await queueWithLogging(this.logger, this.queue, 'update-posts-batch', job);
  }
}

export interface UpdatePostsInBatchJob {
  postIds: string[];
  job: UpdatePostsInBatchJobType;
}

export enum UpdatePostsInBatchJobType {
  REPOST_PARENT_DELETED = 1,
}
