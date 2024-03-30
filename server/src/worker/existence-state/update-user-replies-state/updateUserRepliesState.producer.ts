import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';

@Injectable()
export class UpdateUserRepliesStateProducer {
  constructor(
    @InjectQueue('update-user-replies-state-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({
      context: 'TakeDownUserPostsProducer',
    });
  }

  async takeDownUserReplies(job: TakeDownUserRepliesJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'take-down-user-replies-job',
      job,
      { ...job }
    );
  }
}

export interface TakeDownUserRepliesJob {
  userId: string;
}
