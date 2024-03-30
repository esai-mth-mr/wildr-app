import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  CHALLENGE_CLEANUP_QUEUE_NAME,
  ChallengeCleanupProducer,
} from '@verdzie/server/worker/challenge-cleanup/challenge-cleanup.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CHALLENGE_CLEANUP_QUEUE_NAME,
    }),
  ],
  providers: [ChallengeCleanupProducer],
  exports: [ChallengeCleanupProducer],
})
export class ChallengeCleanupProducerModule {}
