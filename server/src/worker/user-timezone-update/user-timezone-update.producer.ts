import { Inject, Injectable } from '@nestjs/common';
import { WildrProducer } from '../common/wildrProducer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Queue } from 'bull';
import { Logger } from 'winston';
import { InjectQueue } from '@nestjs/bull';

export const USER_TIMEZONE_UPDATE_QUEUE_NAME = 'user-timezone-update-queue';
export const USER_TIMEZONE_UPDATE_JOB_NAME = 'user-timezone-update-job';

export interface UserTimezoneUpdateJob {
  userId: string;
  offset: string;
}

@Injectable()
export class UserTimezoneUpdateProducer extends WildrProducer {
  constructor(
    @InjectQueue(USER_TIMEZONE_UPDATE_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createTimezoneUpdateJob(job: UserTimezoneUpdateJob) {
    await this.produce(USER_TIMEZONE_UPDATE_JOB_NAME, job);
  }
}
