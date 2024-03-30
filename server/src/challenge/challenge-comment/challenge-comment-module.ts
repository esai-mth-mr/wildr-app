import { Module } from '@nestjs/common';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { ChallengeCommentService } from '@verdzie/server/challenge/challenge-comment/challenge-comment-service';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { ChallengeRepositoryModule } from '@verdzie/server/challenge/challenge-repository/challenge.repository.module';
import { ChallengeUpdateStatsModule } from '@verdzie/server/challenge/challenge-update-stats/challengeUpdateStats.module';
import { ChallengeModule } from '@verdzie/server/challenge/challenge.module';
import { ChallengeInteractionModule } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.module';
import { NotifyAuthorWorkerModule } from '@verdzie/server/worker/notify-author/notifyAuthorWorker.module';

@Module({
  imports: [
    ChallengeRepositoryModule,
    CommentModule,
    FeedModule,
    UserModule,
    ChallengeUpdateStatsModule,
    ChallengeModule,
    ChallengeInteractionModule,
    NotifyAuthorWorkerModule,
  ],
  providers: [ChallengeCommentService],
  exports: [ChallengeCommentService],
})
export class ChallengeCommentModule {}
