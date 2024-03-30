import { Module } from '@nestjs/common';
import { ChallengeLeaderboardModule } from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.module';
import { ChallengePostEntryModule } from '@verdzie/server/challenge/challenge-post-entry/challengePostEntry.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { ChallengeCleanupProducerModule } from '@verdzie/server/worker/challenge-cleanup/challenge-cleanup-producer.module';
import { ChallengeCleanupConsumer } from '@verdzie/server/worker/challenge-cleanup/challenge-cleanup.consumer';
import { ChallengeCleanupService } from '@verdzie/server/worker/challenge-cleanup/challenge-cleanup.service';

@Module({
  imports: [
    FeedModule,
    ChallengePostEntryModule,
    ChallengeCleanupProducerModule,
    ChallengeLeaderboardModule,
  ],
  providers: [ChallengeCleanupConsumer, ChallengeCleanupService],
  exports: [ChallengeCleanupConsumer],
})
export class ChallengeCleanupConsumerModule {}
