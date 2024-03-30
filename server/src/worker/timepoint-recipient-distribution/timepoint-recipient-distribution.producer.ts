import { Inject, Injectable } from '@nestjs/common';
import { WildrProducer } from '../common/wildrProducer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Queue } from 'bull';
import { Logger } from 'winston';
import { InjectQueue } from '@nestjs/bull';

export const TIMEPOINT_RECIPIENT_DISTRIBUTION_QUEUE_NAME =
  'timepoint-recipient-distribution-queue';
export const TIMEPOINT_RECIPIENT_DISTRIBUTION_OFFSET_JOB_NAME =
  'timepoint-recipient-distribution-offset-job';

export const TIMEPOINT_ALL_USERS_DISTRIBUTION_JOB_NAME =
  'timepoint-all-users-distribution-job';
export const TIMEPOINT_RECIPIENT_DISTRIBUTION_BATCH_JOB_CREATION_JOB_NAME =
  'timepoint-recipient-distribution-batch-job-creation-job';

export const TIMEPOINT_RECIPIENT_DISTRIBUTION_BATCH_JOB_NAME =
  'timepoint-recipient-distribution-batch-job';
export const TIMEPOINT_RECIPIENT_DISTRIBUTION_PARSE_JOB_NAME =
  'timepoint-recipient-distribution-parse-job';

export interface BaseTimepointBatchJob {
  offset: number;
}

export interface TimepointBatchJobCreationJob extends BaseTimepointBatchJob {
  hour: number;
}

export interface TimepointBatchJob {
  notificationContentId?: string;
  timepointIds: string[];
}

export interface TimepointParseJob {
  timepointId: string;
}

@Injectable()
export class TimepointRecipientDistributionProducer extends WildrProducer {
  constructor(
    @InjectQueue(TIMEPOINT_RECIPIENT_DISTRIBUTION_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createAllUsersJobs({
    notificationContentId,
    notificationType,
  }: {
    notificationContentId: string;
    notificationType: string;
  }) {
    await this.produce(TIMEPOINT_ALL_USERS_DISTRIBUTION_JOB_NAME, {
      notificationContentId,
      notificationType,
    });
  }

  async createTimepointOffsetJobs() {
    await this.produce(TIMEPOINT_RECIPIENT_DISTRIBUTION_OFFSET_JOB_NAME, {});
  }

  async createTimepointBatchJobs({
    hour,
    offset,
  }: TimepointBatchJobCreationJob) {
    await this.produce(
      TIMEPOINT_RECIPIENT_DISTRIBUTION_BATCH_JOB_CREATION_JOB_NAME,
      {
        hour,
        offset,
      }
    );
  }

  async processTimepointBatch({
    notificationContentId,
    timepointIds,
  }: TimepointBatchJob) {
    await this.produce(TIMEPOINT_RECIPIENT_DISTRIBUTION_BATCH_JOB_NAME, {
      notificationContentId,
      timepointIds,
    });
  }

  async createNotificationBuilderJobs({ timepointId }: TimepointParseJob) {
    await this.produce(TIMEPOINT_RECIPIENT_DISTRIBUTION_PARSE_JOB_NAME, {
      timepointId,
    });
  }
}
