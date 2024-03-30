import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { TimepointNotFoundException } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.service';
import {
  TimepointAlreadyProcessedException,
  TimepointExpiredException,
  TimepointNotReadyException,
  TimepointRecipientDistributionService,
} from '@verdzie/server/notification-scheduler/orchestrator/timepoint-recipient-distribution/timepoint-recipient-distribution.service';
import {
  TIMEPOINT_RECIPIENT_DISTRIBUTION_BATCH_JOB_CREATION_JOB_NAME,
  TIMEPOINT_RECIPIENT_DISTRIBUTION_BATCH_JOB_NAME,
  TIMEPOINT_RECIPIENT_DISTRIBUTION_OFFSET_JOB_NAME,
  TIMEPOINT_RECIPIENT_DISTRIBUTION_PARSE_JOB_NAME,
  TIMEPOINT_RECIPIENT_DISTRIBUTION_QUEUE_NAME,
  TimepointBatchJob,
  TimepointBatchJobCreationJob,
  TimepointParseJob,
} from '@verdzie/server/worker/timepoint-recipient-distribution/timepoint-recipient-distribution.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(TIMEPOINT_RECIPIENT_DISTRIBUTION_QUEUE_NAME)
export class TimepointRecipientDistributionConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly timepointDistributionService: TimepointRecipientDistributionService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(TIMEPOINT_RECIPIENT_DISTRIBUTION_OFFSET_JOB_NAME)
  async createTimepointOffsetJobs() {
    const result =
      await this.timepointDistributionService.createTimepointOffsetJobs();
    if (result.isErr()) {
      throw result.error;
    }
  }

  @Process(TIMEPOINT_RECIPIENT_DISTRIBUTION_BATCH_JOB_CREATION_JOB_NAME)
  async createTimepointBatchJobs(job: Job<TimepointBatchJobCreationJob>) {
    const result =
      await this.timepointDistributionService.createTimepointBatchJobs({
        hour: job.data.hour,
        offset: job.data.offset,
      });
    if (result.isErr()) {
      throw result.error;
    }
  }

  @Process(TIMEPOINT_RECIPIENT_DISTRIBUTION_BATCH_JOB_NAME)
  async processTimepointBatch(job: Job<TimepointBatchJob>) {
    const result = await this.timepointDistributionService.createTimepointJobs({
      timepointIds: job.data.timepointIds,
    });
    if (result.isErr()) {
      if (result.error instanceof TimepointNotFoundException) {
        this.logger.warn('[processTimepointBatch] ' + result.error.message, {
          timepointIds: job.data.timepointIds,
          error: result.error,
        });
        return;
      }
      throw result.error;
    }
  }

  @Process(TIMEPOINT_RECIPIENT_DISTRIBUTION_PARSE_JOB_NAME)
  async createNotificationBuilderJobs(job: Job<TimepointParseJob>) {
    const result =
      await this.timepointDistributionService.createNotificationBuilderJobs({
        timepointId: job.data.timepointId,
      });
    if (result.isErr()) {
      if (
        result.error instanceof TimepointNotReadyException ||
        result.error instanceof TimepointAlreadyProcessedException ||
        result.error instanceof TimepointExpiredException
      ) {
        this.logger.info(
          '[parseTimepoint] not processing timepoint ' + result.error.message,
          { timepointId: job.data.timepointId, error: result.error }
        );
        return;
      }
      if (result.error instanceof TimepointNotFoundException) {
        this.logger.warn('[parseTimepoint] ' + result.error.message, {
          timepointId: job.data.timepointId,
          error: result.error,
        });
        return;
      }
      throw result.error;
    }
  }
}
