import { Module } from '@nestjs/common';
import { ChallengeLeaderboardService } from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.service';
import { ChallengeRepositoryModule } from '@verdzie/server/challenge/challenge-repository/challenge.repository.module';
import { EntitiesWithPagesModule } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.module';
import { PostRepositoryModule } from '@verdzie/server/post/post-repository/postRepository.module';
import { UserModule } from '@verdzie/server/user/user.module';

@Module({
  imports: [
    PostRepositoryModule,
    ChallengeRepositoryModule,
    UserModule,
    EntitiesWithPagesModule,
  ],
  exports: [ChallengeLeaderboardService],
  providers: [ChallengeLeaderboardService],
})
export class ChallengeLeaderboardModule {}
