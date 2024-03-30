import { Module } from '@nestjs/common';
import { ChallengeResolver } from '@verdzie/server/challenge/challenge-resolver/challenge.resolver';
import { ChallengeModule } from '@verdzie/server/challenge/challenge.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { ChallengeParticipantsModule } from '@verdzie/server/challenge/challenge-participants/challengeParticipants.module';
import { ChallengeCommentModule } from '@verdzie/server/challenge/challenge-comment/challenge-comment-module';
import { ChallengeInteractionModule } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.module';
import { GlobalChallengesResolver } from '@verdzie/server/challenge/challenge-resolver/global-challenges.resolver';
import { ChallengePostEntryModule } from '@verdzie/server/challenge/challenge-post-entry/challengePostEntry.module';
import { ChallengeLeaderboardModule } from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.module';
import { ChallengeCoverModule } from '@verdzie/server/challenge/challenge-cover/challenge-cover.module';

@Module({
  imports: [
    ChallengeModule,
    UserModule,
    PostModule,
    ChallengeParticipantsModule,
    ChallengeInteractionModule,
    ChallengeCommentModule,
    ChallengeLeaderboardModule,
    ChallengePostEntryModule,
    ChallengeCoverModule,
  ],
  exports: [ChallengeResolver, GlobalChallengesResolver],
  providers: [ChallengeResolver, GlobalChallengesResolver],
})
export class ChallengeResolverModule {}
