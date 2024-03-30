import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';
import { JobOptions } from 'bull';

@Injectable()
export class DistributeAnnotatedPostProducer {
  constructor(
    @InjectQueue('distribute-annotated-posts-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({
      context: 'DistributeAnnotatedPostsProducer',
    });
  }

  /**
   * - Can be called from PrepareAnnotatedPostsDistributionProducer.
   * - Can be called from Admin portal once an 'admin' annotates the post.
   * - After a post has been annotated, based on environment variables config,
   * the postId will either be stored in ANNOTATED_UNDISTRIBUTED_POSTS or
   * will directly be passed to this worker. (which means the Post will be
   * present inside ANNOTATION_PENDING_POSTS) and hence needs to be removed
   * from ANNOTATION_PENDING_POSTS and put under
   * ANNOTATED_DISTRIBUTION_IN_PROGRESS_POSTS.
   */
  // Can be called from batch worker
  // Can be called directly form admin portal
  async distributeAnnotatedPost(
    job: DistributeAnnotatedPostJob,
    jobOptions?: JobOptions
  ) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'distribute-annotated-post-job',
      job,
      {
        postId: job.postId,
      },
      true,
      jobOptions
    );
  }
}

export interface DistributeAnnotatedPostJob {
  postId: string;
  skip?: number;
  followersListEndCursor?: string;
}
