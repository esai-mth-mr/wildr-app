import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  NOTIFY_FOLLOWERS_OF_CHALLENGE_CREATION_QUEUE_NAME,
  NotifyFollowersOfChallengeCreationProducer,
} from '@verdzie/server/worker/notify-followers-challenge-creation/notify-followers-challenge-creation.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFY_FOLLOWERS_OF_CHALLENGE_CREATION_QUEUE_NAME,
    }),
  ],
  providers: [NotifyFollowersOfChallengeCreationProducer],
  exports: [NotifyFollowersOfChallengeCreationProducer],
})
export class NotifyFollowersOfChallengeCreationProducerModule {}
