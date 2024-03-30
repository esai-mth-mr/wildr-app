import { Inject, Injectable } from '@nestjs/common';
import { WildrProducer } from '../common/wildrProducer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Queue } from 'bull';
import { Logger } from 'winston';
import { InjectQueue } from '@nestjs/bull';

export const TIMEPOINT_ARCHIVER_QUEUE_NAME = 'timepoint-archiver-queue';
export const TIMEPOINT_ARCHIVER_OFFSET_JOB_CREATION_JOB_NAME =
  'timepoint-archiver-offset-job';
export const TIMEPOINT_ARCHIVER_BATCH_JOB_CREATION_JOB_NAME =
  'timepoint-archiver-batch-job-creation-job';
export const TIMEPOINT_ARCHIVER_BATCH_JOB_NAME = 'timepoint-archiver-batch-job';

export interface TimepointArchiverBatchJobCreationJob {
  offset: number;
}

export interface TimepointArchiverJob {
  timepointIds: string[];
}

@Injectable()
export class TimepointArchiverProducer extends WildrProducer {
  constructor(
    @InjectQueue(TIMEPOINT_ARCHIVER_QUEUE_NAME)
    queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createTimepointArchiverOffsetJobs() {
    await this.produce(TIMEPOINT_ARCHIVER_OFFSET_JOB_CREATION_JOB_NAME, {});
  }

  async createTimepointArchiverJobs({
    offset,
  }: TimepointArchiverBatchJobCreationJob) {
    await this.produce(TIMEPOINT_ARCHIVER_BATCH_JOB_CREATION_JOB_NAME, {
      offset,
    });
  }

  async createArchiveTimepointsJob({ timepointIds }: TimepointArchiverJob) {
    await this.produce(TIMEPOINT_ARCHIVER_BATCH_JOB_NAME, {
      timepointIds,
    });
  }
}
