import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { InviteListService } from '@verdzie/server/invite-lists/invite-list.service';
import {
  INVITE_LIST_RECORDING_JOB_NAME,
  INVITE_LIST_RECORDING_QUEUE_NAME,
  InviteListRecordingJobData,
} from '@verdzie/server/worker/invite-list-recording/invite-list-recording.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(INVITE_LIST_RECORDING_QUEUE_NAME)
export class InviteListRecordingConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly inviteListService: InviteListService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(INVITE_LIST_RECORDING_JOB_NAME)
  async processInviteListRecordingJob(job: Job<InviteListRecordingJobData>) {
    const result = await this.inviteListService.recordInvite({
      referrerId: job.data.referrerId,
      invitedId: job.data.inviteeId,
    });
    if (result.isErr()) {
      this.logger.error('Failed to record invite list: ' + result.error, {
        referrerId: job.data.referrerId,
        invitedId: job.data.inviteeId,
        error: result.error,
      });
      throw result.error;
    }
  }
}
