import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PostService } from '@verdzie/server/post/post.service';
import { FeedService } from '@verdzie/server/feed/feed.service';
import {
  UpdatePostsInBatchJob,
  UpdatePostsInBatchJobType,
} from '@verdzie/server/worker/update-posts-in-batch/updatePostsInBatch.producer';
import { Job } from 'bull';

@Processor('update-posts-batch-queue')
export class UpdatePostsInBatchConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly postService: PostService,
    private readonly feedService: FeedService
  ) {
    console.info(UpdatePostsInBatchConsumer.name, ' created');
    this.logger = this.logger.child({
      context: UpdatePostsInBatchConsumer.name,
    });
  }

  @Process('update-posts-batch')
  async updatePostsInBatch(job: Job<UpdatePostsInBatchJob>) {
    switch (job.data.job) {
      case UpdatePostsInBatchJobType.REPOST_PARENT_DELETED:
        await this.onRepostParentDeleted(job.data);
        break;
    }
  }

  async onRepostParentDeleted(job: UpdatePostsInBatchJob) {
    this.logger.info('onRepostParentDeleted', job);
    await this.postService.update(job.postIds, {
      repostMeta: { isParentPostDeleted: true },
    });
  }
}
