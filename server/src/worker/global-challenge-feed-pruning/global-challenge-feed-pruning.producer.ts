import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { GlobalChallengeFeedEnums } from '@verdzie/server/sqs/sqs-prune-global-challenges-feed-handler/prune-global-challenges-message.dto';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export const GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME =
  'global-challenge-feed-pruning-queue';

export const GLOBAL_CHALLENGE_FEED_PRUNING_BATCH_CREATION_JOB_NAME =
  'global-challenge-feed-pruning-job-creation-job';
export const GLOBAL_CHALLENGE_FEED_PRUNING_BATCH_JOB_NAME =
  'global-challenge-feed-pruning-job';

export interface GlobalChallengeFeedPruningBatchCreationJobData {
  globalChallengeFeedType: GlobalChallengeFeedEnums;
}

export interface GlobalChallengeFeedPruningBatchJobData {
  challengeIds: string[];
  globalChallengeFeedType: GlobalChallengeFeedEnums;
  feedPage: number;
}

@Injectable()
export class GlobalChallengeFeedPruningProducer extends WildrProducer {
  constructor(
    @InjectQueue(GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createBatchJobs(job: GlobalChallengeFeedPruningBatchCreationJobData) {
    await this.produce(
      GLOBAL_CHALLENGE_FEED_PRUNING_BATCH_CREATION_JOB_NAME,
      job
    );
  }

  async createPruningBatchJob({
    delayMS = 0,
    job,
  }: {
    delayMS: number;
    job: GlobalChallengeFeedPruningBatchJobData;
  }) {
    await this.produce(GLOBAL_CHALLENGE_FEED_PRUNING_BATCH_JOB_NAME, job, {
      delay: delayMS,
    });
  }
}
