import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '../../worker.helper';
import {
  DISTRIBUTE_POSTS_TO_LISTS_JOB_NAME,
  DISTRIBUTE_POSTS_TO_LISTS_QUEUE_NAME,
  DistributePostToListsJob,
} from '@verdzie/server/worker/distribute-post/distribute-post-to-lists-worker/distributePostToListsWorker.config';

/**
 * @warn Call this worker from DistributePostsToFollowersInBatchesProducer
 */
@Injectable()
export class DistributePostToListsProducer {
  constructor(
    @InjectQueue(DISTRIBUTE_POSTS_TO_LISTS_QUEUE_NAME)
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({
      context: 'DistributePostsToListsProducer',
    });
  }

  async distributePostsToLists(job: DistributePostToListsJob) {
    this.logger.info('distributePostsToLists()', {});
    await queueWithLogging(
      this.logger,
      this.queue,
      DISTRIBUTE_POSTS_TO_LISTS_JOB_NAME,
      job,
      {
        postId: job.postId,
      }
    );
  }
}
