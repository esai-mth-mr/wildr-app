import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';

export const UPDATE_VIEW_COUNT_QUEUE_NAME = 'update-view-count-queue';
export const UPDATE_VIEW_COUNT_JOB_NAME = 'update-view-count-job';

@Injectable()
export class UpdateViewCountProducer extends WildrProducer {
  constructor(
    @InjectQueue(UPDATE_VIEW_COUNT_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = this.logger.child({ context: this.constructor.name });
  }
  async updateViewCount(job: UpdateViewCountJob) {
    await this.produce(UPDATE_VIEW_COUNT_JOB_NAME, job);
  }
}

export interface UpdateViewCountJob {
  userId: string;
  postIds: string[];
}
