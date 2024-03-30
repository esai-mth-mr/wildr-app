import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { GlobalChallengeFeedPruningService } from '@verdzie/server/challenge/global-challenge-feed-pruning/global-challenge-feed-pruning.service';
import { GlobalActiveChallengesFeedNotFoundException } from '@verdzie/server/feed/feed.service';
import {
  GLOBAL_CHALLENGE_FEED_PRUNING_BATCH_CREATION_JOB_NAME,
  GLOBAL_CHALLENGE_FEED_PRUNING_BATCH_JOB_NAME,
  GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME,
  GlobalChallengeFeedPruningBatchCreationJobData,
  GlobalChallengeFeedPruningBatchJobData,
} from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(GLOBAL_CHALLENGE_FEED_PRUNING_QUEUE_NAME)
export class GlobalChallengeFeedPruningConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger,
    private readonly globalChallengeFeedPruningService: GlobalChallengeFeedPruningService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(GLOBAL_CHALLENGE_FEED_PRUNING_BATCH_CREATION_JOB_NAME)
  async createFeedPruningBatchJobs(
    job: Job<GlobalChallengeFeedPruningBatchCreationJobData>
  ) {
    const result =
      await this.globalChallengeFeedPruningService.createPruningBatchJobs(
        job.data
      );
    if (result.isErr()) {
      this.logger.error('error creating pruning batch jobs', {
        error: result.error,
        job,
      });
      if (result.error instanceof GlobalActiveChallengesFeedNotFoundException)
        return;
      throw result.error;
    }
  }

  @Process(GLOBAL_CHALLENGE_FEED_PRUNING_BATCH_JOB_NAME)
  async pruneFeedBatch(job: Job<GlobalChallengeFeedPruningBatchJobData>) {
    const result =
      await this.globalChallengeFeedPruningService.pruneChallengeBatch({
        challengeIds: job.data.challengeIds,
        globalChallengeFeedType: job.data.globalChallengeFeedType,
        feedPage: job.data.feedPage,
      });
    if (result.isErr()) {
      this.logger.error('error pruning batch', {
        error: result.error,
        job,
      });
      if (result.error instanceof GlobalActiveChallengesFeedNotFoundException)
        return;
      throw result.error;
    }
  }
}
