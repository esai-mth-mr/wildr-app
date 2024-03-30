import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';
import { JobOptions, Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export const NOTIFY_FOLLOWERS_OF_CHALLENGE_CREATION_QUEUE_NAME =
  'notify-followers-challenge-creation';
export const NOTIFY_FOLLOWERS_OF_CHALLENGE_CREATION_JOB_NAME =
  'notify-followers-challenge-creation-job';
export const NOTIFY_FOLLOWER_BATCH_OF_CHALLENGE_CREATION_JOB_NAME =
  'notify-follower-batch-challenge-creation-job';

export interface NotifyFollowersOfChallengeCreationJobData {
  challengeId: string;
}

export interface NotifyFollowerBatchOfChallengeCreationJobData {
  challengeId: string;
  followerIds: string[];
}

@Injectable()
export class NotifyFollowersOfChallengeCreationProducer extends WildrProducer {
  constructor(
    @InjectQueue(NOTIFY_FOLLOWERS_OF_CHALLENGE_CREATION_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async notifyAllFollowers(jobData: NotifyFollowersOfChallengeCreationJobData) {
    if (process.env.SKIP_CREATE_CHALLENGE_NOTIFICATIONS === 'true') {
      return;
    }
    await this.produce(
      NOTIFY_FOLLOWERS_OF_CHALLENGE_CREATION_JOB_NAME,
      jobData,
      {
        attempts: 1,
      }
    );
  }

  async notifyFollowerBatch({
    jobData,
    options,
  }: {
    jobData: NotifyFollowerBatchOfChallengeCreationJobData;
    options?: JobOptions;
  }) {
    if (process.env.SKIP_CREATE_CHALLENGE_NOTIFICATIONS === 'true') {
      return;
    }
    await this.produce(
      NOTIFY_FOLLOWER_BATCH_OF_CHALLENGE_CREATION_JOB_NAME,
      jobData,
      { attempts: 2, ...options }
    );
  }
}
