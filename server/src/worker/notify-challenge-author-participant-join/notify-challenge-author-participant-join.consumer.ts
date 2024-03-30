import { Process, Processor } from '@nestjs/bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import { Logger } from 'winston';
import {
  NOTIFY_CHALLENGE_AUTHOR_PARTICIPANT_JOIN_JOB_NAME,
  NOTIFY_CHALLENGE_AUTHOR_PARTICIPANT_JOIN_QUEUE_NAME,
  NotifyChallengeAuthorParticipantJoinJob,
} from '@verdzie/server/worker/notify-challenge-author-participant-join/notify-challenge-author-participant-join.producer';
import { ActivityService } from '@verdzie/server/activity/activity.service';

@Processor(NOTIFY_CHALLENGE_AUTHOR_PARTICIPANT_JOIN_QUEUE_NAME)
export class NotifyChallengeAuthorParticipantJoinConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly activityService: ActivityService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(NOTIFY_CHALLENGE_AUTHOR_PARTICIPANT_JOIN_JOB_NAME)
  async index(job: Job<NotifyChallengeAuthorParticipantJoinJob>) {
    const { challengeId, participantId } = job.data;
    await this.activityService.participantJoinedChallenge({
      challengeId,
      participantId,
    });
  }
}
