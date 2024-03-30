import { Module } from '@nestjs/common';
import { ChallengePostEntryService } from '@verdzie/server/challenge/challenge-post-entry/challengePostEntry.service';
import { ChallengeRepositoryModule } from '@verdzie/server/challenge/challenge-repository/challenge.repository.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { ChallengeUpdateStatsModule } from '@verdzie/server/challenge/challenge-update-stats/challengeUpdateStats.module';

@Module({
  imports: [ChallengeRepositoryModule, FeedModule, ChallengeUpdateStatsModule],
  exports: [ChallengePostEntryService],
  providers: [ChallengePostEntryService],
})
export class ChallengePostEntryModule {}
