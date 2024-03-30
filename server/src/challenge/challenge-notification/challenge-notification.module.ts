import { Module } from '@nestjs/common';
import { ChallengeNotificationService } from '@verdzie/server/challenge/challenge-notification/challenge-notification.service';
import { TimepointSchedulingProducerModule } from '@verdzie/server/worker/timepoint-scheduling/timepoint-scheduling-producer.module';

@Module({
  imports: [TimepointSchedulingProducerModule],
  providers: [ChallengeNotificationService],
  exports: [ChallengeNotificationService],
})
export class ChallengeNotificationModule {}
