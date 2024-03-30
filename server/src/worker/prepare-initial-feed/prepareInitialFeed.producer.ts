import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';

@Injectable()
export class PrepareInitialFeedProducer {
  constructor(
    @InjectQueue('prepare-initial-feed-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'prepareInitialFeedProducer' });
  }

  async prepareInitialFeed(job: PrepareInitialFeedJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'prepareInitialFeed-job',
      job,
      { ...job }
    );
  }
}

export interface PrepareInitialFeedJob {
  userId: string;
  limit?: number;
}
