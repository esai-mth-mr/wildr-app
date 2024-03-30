import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';

@Injectable()
export class UpdateUserCommentsStateProducer {
  constructor(
    @InjectQueue('update-user-comments-state-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({
      context: 'UpdateUserCommentsStateProducer',
    });
  }

  async takeDownUserComments(job: TakeDownUserCommentsJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'take-down-user-comments-job',
      job,
      { ...job }
    );
  }

  async respawnUserComments(job: RespawnUserCommentsJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'respawn-user-comments-job',
      job,
      { ...job }
    );
  }
}

export interface TakeDownUserCommentsJob {
  userId: string;
}

export interface RespawnUserCommentsJob {
  userId: string;
}
