import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { JobOptions } from 'bull';

@Injectable()
export class RankAndDistributePostProducer {
  constructor(
    @InjectQueue('rank-and-distribute-post-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({
      context: 'DistributePostToUserProducer',
    });
  }

  async rankAndDistribute(
    job: RankAndDistributePostJob,
    jobOptions?: JobOptions
  ) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'rank-distribute-post-to-user-job',
      job,
      {
        userId: job.userId,
      },
      false,
      jobOptions
    );
  }
}

export interface RankAndDistributePostJob {
  checkIsFollowing?: boolean;
  isFollower?: boolean;
  postId: string;
  userId: string;
  shouldNotifyUserAboutFeedCreated?: boolean;
  categoryRank?: number | undefined;
}
