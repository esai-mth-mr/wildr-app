import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PostService } from '@verdzie/server/post/post.service';
import { Job } from 'bull';
import { RepostParentDeletedJob } from '@verdzie/server/worker/repost-parent-deleted/repostParentDeleted.producer';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import {
  UpdatePostsInBatchJobType,
  UpdatePostsInBatchProducer,
} from '@verdzie/server/worker/update-posts-in-batch/updatePostsInBatch.producer';
import _ from 'lodash';
import { PaginateEntriesResponse } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';

@Processor('repost-parent-deleted-queue')
export class RepostParentDeletedConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly postService: PostService,
    private readonly feedService: FeedService,
    private readonly updatePostsInBatchWorker: UpdatePostsInBatchProducer
  ) {
    console.info('RepostParentDeletedConsumer created');
    this.logger = this.logger.child({
      context: RepostParentDeletedConsumer.name,
    });
  }

  @Process('repost-parent-deleted')
  async repostParentDeleted(job: Job<RepostParentDeletedJob>) {
    //get all repost post ids
    const feedId = toFeedId(
      FeedEntityType.REPOSTED_POSTS,
      job.data.parentPostId
    );
    const feed = await this.feedService.find(feedId);
    if (!feed) {
      this.logger.warn('RepostFeed not found', { feedId });
      return;
    }
    const take = 100;
    let after: string | undefined = undefined;
    let hasNextPage = true;
    while (hasNextPage) {
      const result: PaginateEntriesResponse =
        await this.feedService.paginateEntries(feedId, {
          take,
          after,
        });
      this.logger.info('repostParentDeleted', { result });
      after = _.last(result.ids);
      if (!after) break;
      await this.updatePostsInBatchWorker.updatePosts({
        postIds: result.ids,
        job: UpdatePostsInBatchJobType.REPOST_PARENT_DELETED,
      });
      hasNextPage = result.hasMoreItems;
    }
  }
}
