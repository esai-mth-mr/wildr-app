import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';

export const UNFOLLOW_EVENT_CLEANUP_QUEUE_NAME = 'unfollow-event-cleanup-queue';
export const UNFOLLOW_EVENT_CLEANUP_JOB_NAME = 'unfollow-event-cleanup-job';

export class UnfollowEventCleanupProducer extends WildrProducer {
  constructor(
    @InjectQueue(UNFOLLOW_EVENT_CLEANUP_QUEUE_NAME) queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({
      context: UnfollowEventCleanupProducer.name,
    });
  }

  async cleanup(job: UnfollowEventCleanupJob) {
    await this.produce(UNFOLLOW_EVENT_CLEANUP_JOB_NAME, job);
  }
}

export interface UnfollowEventCleanupJob {
  ownerId: string;
  unfollowedUserId: string;
}
