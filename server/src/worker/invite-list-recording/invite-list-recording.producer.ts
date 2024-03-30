import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { MEDIUM_LOAD_JOB_CONFIG_KEY } from '@verdzie/server/bull/wildr-bull.module';
import {
  JobProductionException,
  WildrProducer,
} from '@verdzie/server/worker/common/wildrProducer';
import { Job, Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result } from 'neverthrow';
import { Logger } from 'winston';

export const INVITE_LIST_RECORDING_QUEUE_NAME =
  'invite-list-recording-queue-name';
export const INVITE_LIST_RECORDING_JOB_NAME = 'invite-list-recording-job-name';

export const INVITE_LIST_RECORDING_QUEUE_CONFIG = {
  name: INVITE_LIST_RECORDING_QUEUE_NAME,
  configKey: MEDIUM_LOAD_JOB_CONFIG_KEY,
};

export interface InviteListRecordingJobData {
  referrerId: string;
  inviteeId: string;
}

@Injectable()
export class InviteListRecordingProducer extends WildrProducer {
  constructor(
    @InjectQueue(INVITE_LIST_RECORDING_QUEUE_NAME)
    protected readonly queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createInviteListRecordingJob(
    jobData: InviteListRecordingJobData
  ): Promise<Result<Job<InviteListRecordingProducer>, JobProductionException>> {
    return this.produceResult({
      jobName: INVITE_LIST_RECORDING_JOB_NAME,
      jobData,
    });
  }
}
