import { Module } from '@nestjs/common';
import { ChallengeInteractionService } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.service';
import { FeedModule } from '@verdzie/server/feed/feed.module';

@Module({
  imports: [FeedModule],
  exports: [ChallengeInteractionService],
  providers: [ChallengeInteractionService],
})
export class ChallengeInteractionModule {}
