import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';

export const NOTIFY_CHALLENGE_AUTHOR_PARTICIPANT_JOIN_QUEUE_NAME =
  'notify-author-participant-join-queue';
export const NOTIFY_CHALLENGE_AUTHOR_PARTICIPANT_JOIN_JOB_NAME =
  'notify-author-challenge-participant-join-job';

export interface NotifyChallengeAuthorParticipantJoinJob {
  challengeId: string;
  participantId: string;
}

@Injectable()
export class NotifyChallengeAuthorParticipantJoinProducer extends WildrProducer {
  constructor(
    @InjectQueue(NOTIFY_CHALLENGE_AUTHOR_PARTICIPANT_JOIN_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async notifyAuthor(job: NotifyChallengeAuthorParticipantJoinJob) {
    await this.produce(NOTIFY_CHALLENGE_AUTHOR_PARTICIPANT_JOIN_JOB_NAME, job);
  }
}
