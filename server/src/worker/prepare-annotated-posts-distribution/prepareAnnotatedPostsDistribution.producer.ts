import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';

@Injectable()
export class PrepareAnnotatedPostsDistributionProducer {
  constructor(
    @InjectQueue('prepare-annotated-posts-distribution-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({
      context: 'PrepareAnnotatedPostsDistributionProducer',
    });
  }

  async prepareAnnotatedPostsDistribution(
    job: PrepareAnnotatedPostsDistributionJob
  ) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'prepare-annotated-posts-distribution-job',
      job,
      {
        endCursor: job.endCursor,
      }
    );
  }
}

export interface PrepareAnnotatedPostsDistributionJob {
  endCursor?: string;
}
