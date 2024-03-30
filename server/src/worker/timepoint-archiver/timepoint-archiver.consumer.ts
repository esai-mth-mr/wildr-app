import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { TimepointArchiverService } from '@verdzie/server/notification-scheduler/timepoint-archiver/timepoint-archiver.service';
import {
  TIMEPOINT_ARCHIVER_BATCH_JOB_CREATION_JOB_NAME,
  TIMEPOINT_ARCHIVER_BATCH_JOB_NAME,
  TIMEPOINT_ARCHIVER_OFFSET_JOB_CREATION_JOB_NAME,
  TIMEPOINT_ARCHIVER_QUEUE_NAME,
  TimepointArchiverBatchJobCreationJob,
  TimepointArchiverJob,
} from '@verdzie/server/worker/timepoint-archiver/timepoint-archiver.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(TIMEPOINT_ARCHIVER_QUEUE_NAME)
export class TimepointArchiverConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private readonly timepointArchiverService: TimepointArchiverService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(TIMEPOINT_ARCHIVER_OFFSET_JOB_CREATION_JOB_NAME)
  async processOffsetJobCreation() {
    const result =
      await this.timepointArchiverService.createTimepointOffsetJobs();
    if (result.isErr()) {
      throw result.error;
    }
  }

  @Process(TIMEPOINT_ARCHIVER_BATCH_JOB_CREATION_JOB_NAME)
  async processBatchJobCreation(
    job: Job<TimepointArchiverBatchJobCreationJob>
  ) {
    const result = await this.timepointArchiverService.createTimepointBatchJobs(
      {
        offset: job.data.offset,
      }
    );
    if (result.isErr()) {
      throw result.error;
    }
  }

  @Process(TIMEPOINT_ARCHIVER_BATCH_JOB_NAME)
  async processBatchJob(job: Job<TimepointArchiverJob>) {
    const result = await this.timepointArchiverService.archiveTimepoints({
      timepointIds: job.data.timepointIds,
    });
    if (result.isErr()) {
      throw result.error;
    }
  }
}
