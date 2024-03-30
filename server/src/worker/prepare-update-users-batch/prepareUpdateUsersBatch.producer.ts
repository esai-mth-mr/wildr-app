import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  Jobs,
  MiscJobDataSendInvites,
  MiscJobDataUpdateCounts,
} from '@verdzie/server/sqs/misc-sqs-handler/misc-sqs-handler';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';

@Injectable()
export class PrepareUpdateUsersBatchProducer extends WildrProducer {
  constructor(
    @InjectQueue('prepare-update-users-batch-queue')
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected logger: Logger
  ) {
    super(queue);
    this.logger = this.logger.child({ context: 'BatchUpdateUsersProducer' });
  }

  async prepareUpdateUsersBatch(job: PrepareUpdateUsersBatchJob) {
    await this.produce('prepare-update-users-batch-job', job);
  }
}

export interface PrepareUpdateUsersBatchJob {
  jobEnum: Jobs;
  input?: MiscJobDataSendInvites | MiscJobDataUpdateCounts;
  batchSize?: number;
  shouldByPassBatching?: boolean;
}
