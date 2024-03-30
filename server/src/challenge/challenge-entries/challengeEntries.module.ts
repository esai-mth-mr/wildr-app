import { Module } from '@nestjs/common';
import { ChallengeEntriesService } from '@verdzie/server/challenge/challenge-entries/challengeEntries.service';
import { PostModule } from '@verdzie/server/post/post.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';

@Module({
  imports: [PostModule, FeedModule],
  exports: [ChallengeEntriesService],
  providers: [ChallengeEntriesService],
})
export class ChallengeEntriesModule {}
