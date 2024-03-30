import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { PostNotFoundException } from '@verdzie/server/post/post.exceptions';
import { DistributePostsToFollowingPostsFeedService } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowing.service';
import {
  DISTRIBUTE_POST_TO_FOLLOWERS_JOB_NAME,
  DISTRIBUTE_POST_TO_FOLLOWERS_QUEUE_NAME,
  DistributePostToFollowingPostsJobData,
} from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowingPostsFeedWorker.config';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(DISTRIBUTE_POST_TO_FOLLOWERS_QUEUE_NAME)
export class DistributePostsToFollowingPostsFeedConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly distPostsToFollowingService: DistributePostsToFollowingPostsFeedService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(DISTRIBUTE_POST_TO_FOLLOWERS_JOB_NAME)
  async distributePostToFollowingPostsFeed(
    job: Job<DistributePostToFollowingPostsJobData>
  ) {
    const logContext = {
      postId: job.data.postId,
      userIdCount: job.data.userIds.length,
      methodName: this.distributePostToFollowingPostsFeed.name,
    };
    this.logger.info('distributing post to follower feed', logContext);
    const result =
      await this.distPostsToFollowingService.distributePostToFollowingPostsFeed(
        job.data
      );
    if (result.isErr()) {
      const error = result.error;
      if (error instanceof PostNotFoundException) {
        this.logger.error(
          'post not found while distributing post to follower feeds',
          {
            error,
            ...logContext,
          }
        );
        return;
      } else if (error instanceof InternalServerErrorException) {
        this.logger.error('error distributing posts to follower feeds', {
          error,
          ...logContext,
        });
        throw error;
      } else {
        const _exhaustiveCheck: never = error;
      }
    }
    this.logger.info('done distributing posts', { data: job.data.postId });
  }
}
