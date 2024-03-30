import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WildrProducer } from '../../common/wildrProducer';
import {
  DISTRIBUTE_POST_TO_FOLLOWERS_JOB_NAME,
  DISTRIBUTE_POST_TO_FOLLOWERS_QUEUE_NAME,
  DistributePostToFollowingPostsJobData,
} from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowingPostsFeedWorker.config';

/**
 * @warn Call this worker from DistributePostsToFollowersInBatchesProducer
 */
@Injectable()
export class DistributePostsToFollowingPostsFeedProducer extends WildrProducer {
  constructor(
    @InjectQueue(DISTRIBUTE_POST_TO_FOLLOWERS_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async distributePostsToFollowingPostsFeed(
    job: DistributePostToFollowingPostsJobData
  ) {
    await this.produce(DISTRIBUTE_POST_TO_FOLLOWERS_JOB_NAME, job);
  }
}
export {
  DISTRIBUTE_POST_TO_FOLLOWERS_QUEUE_NAME,
  DistributePostToFollowingPostsJobData as DistributePostToFollowingPostsJob,
};
