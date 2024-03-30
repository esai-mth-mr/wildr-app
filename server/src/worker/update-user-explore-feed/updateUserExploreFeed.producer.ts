import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export const UPDATE_USER_EXPLORE_FEED_QUEUE_NAME =
  'update-main-user-feed-queue';
export const UPDATE_USER_MAIN_FEED_JOB_NAME = 'update-user-main-feed-job';

@Injectable()
export class UpdateUserExploreFeedProducer extends WildrProducer {
  constructor(
    @InjectQueue(UPDATE_USER_EXPLORE_FEED_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    readonly logger: Logger
  ) {
    super(queue);
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async updateUserExploreFeed(job: UpdateUserMainFeedJob) {
    this.produce(UPDATE_USER_MAIN_FEED_JOB_NAME, job);
  }
}

export interface UpdateUserMainFeedJob {
  userId: string;
  shouldNotifyUserAboutFeedCreated?: boolean;
}
