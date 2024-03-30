import { Module } from '@nestjs/common';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { ChallengeService } from '@verdzie/server/challenge/challenge.service';
import { UploadModule } from '@verdzie/server/upload/upload.module';
import { TrollDetectorModule } from '@verdzie/server/troll-detector/troll-detector.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { ContentModule } from '@verdzie/server/content/content.module';
import { ChallengeRepositoryModule } from '@verdzie/server/challenge/challenge-repository/challenge.repository.module';
import { ChallengeUpdateStatsModule } from '@verdzie/server/challenge/challenge-update-stats/challengeUpdateStats.module';
import { ChallengeInteractionModule } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.module';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { ChallengeLeaderboardModule } from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.module';
import { NotifyChallengeAuthorParticipantJoinProducerModule } from '@verdzie/server/worker/notify-challenge-author-participant-join/notify-challenge-author-participant-join-producer.module';
import { NotifyFollowersOfChallengeCreationProducerModule } from '@verdzie/server/worker/notify-followers-challenge-creation/notify-followers-challenge-creation-producer.module';
import { ChallengeCleanupProducerModule } from '@verdzie/server/worker/challenge-cleanup/challenge-cleanup-producer.module';
import { ChallengeCoverModule } from '@verdzie/server/challenge/challenge-cover/challenge-cover.module';
import { ReportWorkerModule } from '@verdzie/server/worker/report/reportWorker.module';
import { ContextModule } from '@verdzie/server/context/context.module';
import { ChallengeEntriesModule } from '@verdzie/server/challenge/challenge-entries/challengeEntries.module';
import { PostCategoryModule } from '@verdzie/server/post-category/postCategory.module';
import { UpdateChallengeParticipantsDataModule } from '@verdzie/server/worker/update-challenge-participants-data/updateChallengeParticipantsData.module';
import { ChallengeNotificationModule } from '@verdzie/server/challenge/challenge-notification/challenge-notification.module';

@Module({
  imports: [
    FeedModule,
    UserModule,
    UploadModule,
    ContentModule,
    TrollDetectorModule,
    ChallengeLeaderboardModule,
    ChallengeRepositoryModule,
    ChallengeUpdateStatsModule,
    ChallengeInteractionModule,
    CommentModule,
    NotifyChallengeAuthorParticipantJoinProducerModule,
    NotifyFollowersOfChallengeCreationProducerModule,
    ChallengeCleanupProducerModule,
    ChallengeCoverModule,
    ReportWorkerModule,
    ContextModule,
    ChallengeEntriesModule,
    PostCategoryModule,
    UpdateChallengeParticipantsDataModule,
    ChallengeNotificationModule,
  ],
  exports: [ChallengeService],
  providers: [ChallengeService],
})
export class ChallengeModule {}
