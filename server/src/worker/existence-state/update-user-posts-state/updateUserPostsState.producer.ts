import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';

@Injectable()
export class UpdateUserPostsStateProducer {
  constructor(
    @InjectQueue('update-user-posts-state-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({
      context: 'UpdateUserPostsStateProducer',
    });
  }

  async takeDownUserPosts(job: TakeDownUserPostsJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'take-down-user-posts-job',
      job,
      { ...job }
    );
  }

  async respawnUserPosts(job: RespawnUserPostsJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'respawn-user-posts-job',
      job,
      { ...job }
    );
  }
}

export interface TakeDownUserPostsJob {
  userId: string;
}

export interface RespawnUserPostsJob {
  userId: string;
}
