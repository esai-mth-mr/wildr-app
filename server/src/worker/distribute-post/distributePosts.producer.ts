import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { PostVisibility } from '../../generated-graphql';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '../worker.helper';
import { PostAccessControl } from '@verdzie/server/post/postAccessControl';
import { WildrProducer } from '../common/wildrProducer';

export const DISTRIBUTE_POSTS_QUEUE_NAME = 'distribute-post-queue';
export const DISTRIBUTE_POST_IN_BATCHES_JOB_NAME = 'distribute-post-job';

/**
 * @warn Call this worker from DistributePostsToFollowersInBatchesProducer
 */
@Injectable()
export class DistributePostsProducer extends WildrProducer {
  constructor(
    @InjectQueue(DISTRIBUTE_POSTS_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async distributePostInBatches(job: DistributePostInBatchesJob) {
    await this.produce(DISTRIBUTE_POST_IN_BATCHES_JOB_NAME, job);
  }

  /**
   * @deprecated Use {@link distributePostInBatches}
   * @param job
   */
  async distributePostToFollowersInBatches(
    job: DistributePostToFollowersInBatchesJob
  ) {
    this.logger.debug('distributePostToFollowersInBatches()');
    await queueWithLogging(
      this.logger,
      this.queue,
      'distribute-post-to-followers-in-batches-job',
      job,
      {
        postId: job.postId,
      }
    );
  }

  async distributePostToListsInBatches(job: DistributePostToListsInBatchesJob) {
    this.logger.debug('DistributePostToListsInBatchesJob()');
    await queueWithLogging(
      this.logger,
      this.queue,
      'distribute-post-to-lists-in-batches-job',
      job,
      {
        postId: job.postId,
      }
    );
  }
}

export interface DistributePostInBatchesJob {
  postId: string;
  postVisibility: PostVisibility;
  onlyNotify?: boolean;
  shouldNotify?: boolean;
  userIdsToSkip?: string[];
  accessControl: PostAccessControl;
}

export type DistributePostToFollowersInBatchesJob = DistributePostInBatchesJob;

export interface DistributePostToListsInBatchesJob
  extends DistributePostInBatchesJob {
  listIds: string[];
}
