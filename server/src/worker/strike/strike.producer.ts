import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '../worker.helper';

@Injectable()
export class StrikeProducer {
  constructor(
    @InjectQueue('strike-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'StrikeProducer' });
  }

  async imposeStrike(job: UserStrikeReceivedJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'user-strike-received-job',
      job
    );
  }

  async liftStrike(job: LiftStrikeJob) {
    await queueWithLogging(this.logger, this.queue, 'lift-strike-job', job);
  }
}

export interface UserStrikeReceivedJob {
  userId: string;
  reportReviewRequestId: string;
}

export interface LiftStrikeJob {
  userId: string;
}
