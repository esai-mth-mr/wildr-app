import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';

export const FOLLOW_EVENT_FILL_UP_QUEUE_NAME = 'follow-event-fill-up-queue';
export const FOLLOW_EVENT_FILL_UP_JOB = 'follow-event-fill-up-job';

export class FollowEventFillUpProducer extends WildrProducer {
  constructor(
    @InjectQueue(FOLLOW_EVENT_FILL_UP_QUEUE_NAME) queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({
      context: FollowEventFillUpProducer.name,
    });
  }

  async fillUp(job: FollowEventFillUpJob) {
    await this.produce(FOLLOW_EVENT_FILL_UP_JOB, job);
  }
}

export interface FollowEventFillUpJob {
  currentUserId: string;
  userIdToFollow: string;
}
