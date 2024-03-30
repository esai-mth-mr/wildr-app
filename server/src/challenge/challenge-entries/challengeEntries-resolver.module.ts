import { Module } from '@nestjs/common';
import { PostModule } from '@verdzie/server/post/post.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { ChallengeEntriesResolver } from '@verdzie/server/challenge/challenge-entries/challengeEntries.resolver';
import { ChallengeModule } from '@verdzie/server/challenge/challenge.module';
import { ChallengeEntriesModule } from '@verdzie/server/challenge/challenge-entries/challengeEntries.module';

@Module({
  imports: [ChallengeEntriesModule, PostModule, FeedModule, ChallengeModule],
  exports: [ChallengeEntriesResolver],
  providers: [ChallengeEntriesResolver],
})
export class ChallengeEntriesResolverModule {}
