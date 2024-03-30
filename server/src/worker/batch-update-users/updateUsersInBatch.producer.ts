import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';
import {
  JobData,
  Jobs,
  MiscJobDataSendInvites,
  MiscJobDataUpdateCounts,
} from '@verdzie/server/sqs/misc-sqs-handler/misc-sqs-handler';

@Injectable()
export class UpdateUsersInBatchProducer {
  constructor(
    @InjectQueue('update-users-in-batch-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'UpdateUsersInBatchProducer' });
  }

  async updateUsersInBatch(job: UpdateUsersInBatchJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'update-users-in-batch-job',
      job
    );
  }
}

export interface UpdateUsersInBatchJob {
  skip?: number;
  take?: number;
  jobEnum: Jobs;
  input: JobData;
  isFinal: boolean;
}
