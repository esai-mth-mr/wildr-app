import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WildrProducer } from '../common/wildrProducer';

export const NOTIFY_FOLLOWERS_ABOUT_POSTS_QUEUE_NAME =
  'notify-followers-about-posts-queue';
export const NOTIFY_FOLLOWERS_ABOUT_POST_JOB_NAME =
  'notify-followers-about-post-job';

@Injectable()
export class NotifyFollowersAboutPostsProducer extends WildrProducer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    protected logger: Logger,
    @InjectQueue(NOTIFY_FOLLOWERS_ABOUT_POSTS_QUEUE_NAME)
    protected queue: Queue
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async notifyFollowersAboutPosts(job: NotifyFollowersAboutPostsJob) {
    await this.produce(NOTIFY_FOLLOWERS_ABOUT_POST_JOB_NAME, job, {
      attempts: 3,
    });
  }
}

export interface NotifyFollowersAboutPostsJob {
  postId: string;
  followerIds: string[];
}
