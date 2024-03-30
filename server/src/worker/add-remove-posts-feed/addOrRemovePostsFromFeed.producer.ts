import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';

@Injectable()
export class AddOrRemovePostsFromFeedProducer extends WildrProducer {
  constructor(
    @InjectQueue('add-remove-posts-from-feed-queue')
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async addTheirPostsToYourFeed(job: AddOrRemovePostsToFeedJob) {
    await this.produce('add-their-posts-job', job);
  }

  async addTheirPostsToYourInnerCircle(job: AddOrRemovePostsToFeedJob) {
    await this.produce('add-their-posts-to-inner-circle-feed-job', job);
  }

  async removePostsFromFeed(job: AddOrRemovePostsToFeedJob) {
    await this.produce('remove-their-posts-job', job);
  }

  async removePostsFromInnerCircle(job: AddOrRemovePostsToFeedJob) {
    await this.produce('remove-their-posts-from-inner-circle-feed-job', job);
  }

  async removeInnerCirclePostsFromFeed(job: AddOrRemovePostsToFeedJob) {
    await this.produce('remove-their-inner-circle-posts-job', job);
  }

  async removePostsIdsFromPostFeeds(job: RemovePostIdsFromPostFeedsJob) {
    await this.produce('remove-post-ids-from-post-feeds-job', job);
  }
}

export interface AddOrRemovePostsToFeedJob {
  whosePosts: string;
  whoseFeed: string;
}

export interface RemovePostIdsFromPostFeedsJob {
  postIds: string[];
  ownerId: string;
}
