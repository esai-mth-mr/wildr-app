import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import {
  UPDATE_CHALLENGE_PARTICIPANTS_DATA_QUEUE_NAME,
  UpdateChallengeParticipantsDataProducer,
} from '@verdzie/server/worker/update-challenge-participants-data/updateChallengeParticipantsData.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: UPDATE_CHALLENGE_PARTICIPANTS_DATA_QUEUE_NAME,
    }),
  ],
  providers: [UpdateChallengeParticipantsDataProducer],
  exports: [UpdateChallengeParticipantsDataProducer],
})
export class UpdateChallengeParticipantsDataModule {}
