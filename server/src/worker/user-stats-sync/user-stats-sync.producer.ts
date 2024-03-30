import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import {
  JobProductionException,
  WildrProducer,
} from '@verdzie/server/worker/common/wildrProducer';
import { Job, Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result } from 'neverthrow';
import { Logger } from 'winston';
import { USER_STATS_SYNC_QUEUE_NAME } from './user-stats-sync-worker.config';
import { USER_STATS_SYNC_JOB_NAME } from './user-stats-sync-worker.config';
import { UserStatsSyncJobData } from './user-stats-sync-worker.config';

@Injectable()
export class UserStatsSyncProducer extends WildrProducer {
  constructor(
    @InjectQueue(USER_STATS_SYNC_QUEUE_NAME)
    protected readonly queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createUserStatsSyncJob(
    jobData: UserStatsSyncJobData
  ): Promise<Result<Job<UserStatsSyncProducer>, JobProductionException>> {
    return this.produceResult({
      jobName: USER_STATS_SYNC_JOB_NAME,
      jobData,
    });
  }
}
