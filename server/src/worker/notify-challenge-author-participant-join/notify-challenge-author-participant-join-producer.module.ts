import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  NOTIFY_CHALLENGE_AUTHOR_PARTICIPANT_JOIN_QUEUE_NAME,
  NotifyChallengeAuthorParticipantJoinProducer,
} from '@verdzie/server/worker/notify-challenge-author-participant-join/notify-challenge-author-participant-join.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFY_CHALLENGE_AUTHOR_PARTICIPANT_JOIN_QUEUE_NAME,
    }),
  ],
  providers: [NotifyChallengeAuthorParticipantJoinProducer],
  exports: [NotifyChallengeAuthorParticipantJoinProducer],
})
export class NotifyChallengeAuthorParticipantJoinProducerModule {}
