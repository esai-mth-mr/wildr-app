import { Module } from '@nestjs/common';
import { ChallengeUpdateStatsService } from '@verdzie/server/challenge/challenge-update-stats/challengeUpdateStats.service';
import { ChallengeRepositoryModule } from '@verdzie/server/challenge/challenge-repository/challenge.repository.module';

@Module({
  imports: [ChallengeRepositoryModule],
  providers: [ChallengeUpdateStatsService],
  exports: [ChallengeUpdateStatsService],
})
export class ChallengeUpdateStatsModule {}
