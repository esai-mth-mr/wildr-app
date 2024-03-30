import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';
import { InjectQueue } from '@nestjs/bull';
import { JobOptions, Queue } from 'bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export const UPDATE_CHALLENGE_PARTICIPANTS_DATA_QUEUE_NAME =
  'update-challenge-participants-data-queue';
export const UPDATE_CHALLENGE_PARTICIPANTS_CHALLENGE_CONTEXT_JOB =
  'update-challenge-participants-challenge-context-job';
export const EDIT_CHALLENGE_DATE_JOB = 'edit-challenge-date-job';

export class UpdateChallengeParticipantsDataProducer extends WildrProducer {
  constructor(
    @InjectQueue(UPDATE_CHALLENGE_PARTICIPANTS_DATA_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  //Job 1 Iterate through list of all participants and spawn update jobs
  async onEditChallengeDate(job: EditChallengeDateJob) {
    await this.produce(EDIT_CHALLENGE_DATE_JOB, job);
  }

  //Job 2 to spawn worker to update the users
  async updateParticipantChallengeContextOnEditChallengeDate(
    job: UpdateParticipantChallengeContextOnEditChallengeDateJob,
    opts?: JobOptions
  ) {
    await this.produce(
      UPDATE_CHALLENGE_PARTICIPANTS_CHALLENGE_CONTEXT_JOB,
      job,
      opts
    );
  }
}

export interface EditChallengeDateJob {
  challengeId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateParticipantChallengeContextOnEditChallengeDateJob {
  userIds: string[];
  challengeId: string;
  startDate?: Date;
  endDate?: Date;
}
