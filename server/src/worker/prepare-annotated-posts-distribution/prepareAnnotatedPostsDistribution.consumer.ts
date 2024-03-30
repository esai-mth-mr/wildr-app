import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { DistributeAnnotatedPostProducer } from '@verdzie/server/worker/distribute-annotated-post/distributeAnnotatedPost.producer';
import {
  PrepareAnnotatedPostsDistributionJob,
  PrepareAnnotatedPostsDistributionProducer,
} from '@verdzie/server/worker/prepare-annotated-posts-distribution/prepareAnnotatedPostsDistribution.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import _ from 'lodash';

const GET_ANNOTATED_POSTS_BATCH_SIZE = 50;

@Processor('prepare-annotated-posts-distribution-queue')
export class PrepareAnnotatedPostsDistributionConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private feedService: FeedService,
    private worker: PrepareAnnotatedPostsDistributionProducer,
    private distributeAnnotatedPostWorker: DistributeAnnotatedPostProducer
  ) {
    console.info('PrepareAnnotatedPostsDistributionConsumer created');
    this.logger = this.logger.child({
      context: 'PrepareAnnotatedPostsDistributionConsumer',
    });
  }

  //Called from cron
  @Process('prepare-annotated-posts-distribution-job')
  async prepareAnnotatedPostsDistribution(
    job: Job<PrepareAnnotatedPostsDistributionJob>
  ) {
    this.logger.debug('prepareAnnotatedPostsDistribution()', {
      job: { ...job.data },
    });
    const annotatedUndistributedPostsFeed =
      await this.feedService.getAnnotatedUndistributedPostsFeed();
    const annotatedUndistributedPostIds =
      annotatedUndistributedPostsFeed.page.ids;
    if (annotatedUndistributedPostIds.length === 0) {
      this.logger.info(
        'annotatedUndistributedPostIds is empty' + ' returning...'
      );
      return;
    }
    const endCursor = job.data.endCursor;
    let postIdsToDistribute: string[] = [];
    let endCursorIndex = 0;
    if (endCursor) {
      endCursorIndex = annotatedUndistributedPostIds.indexOf(endCursor);
    }
    postIdsToDistribute = annotatedUndistributedPostIds.slice(
      endCursorIndex,
      endCursorIndex + GET_ANNOTATED_POSTS_BATCH_SIZE
    );
    const newEndCursor = _.last(postIdsToDistribute);
    if (newEndCursor === undefined) {
      this.logger.info('postIdsToDistribute is empty');
      return;
    }
    const inProgressFeed =
      await this.feedService.getAnnotatedDistributionInProgressPostsFeed();
    inProgressFeed.page.ids.push(...postIdsToDistribute);
    annotatedUndistributedPostsFeed.page.ids =
      annotatedUndistributedPostsFeed.page.ids.filter(
        id => !postIdsToDistribute.includes(id)
      );
    await this.feedService.update(annotatedUndistributedPostsFeed.id, {
      page: annotatedUndistributedPostsFeed.page,
    });
    await this.feedService.update(inProgressFeed.id, {
      page: inProgressFeed.page,
    });
    for (const postId of postIdsToDistribute) {
      await this.distributeAnnotatedPostWorker.distributeAnnotatedPost(
        {
          postId,
        },
        { delay: Math.random() * 1000 * 60 * 60 * 3 }
      );
    }
    if (newEndCursor === endCursor) {
      this.logger.info(`${newEndCursor} === ${endCursor}`);
      return;
    }
    await this.worker.prepareAnnotatedPostsDistribution({
      endCursor: newEndCursor,
    }); //Spawning same worker to keep the job light
  }
}
