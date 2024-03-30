import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { ContentModule } from '@verdzie/server/content/content.module';
import { FeedModule } from '../feed/feed.module';
import { OpenSearchIndexModule } from '../open-search/open-search-index/openSearchIndex.module';
import { ReplyModule } from '../reply/reply.module';
import { TrollDetectorModule } from '../troll-detector/troll-detector.module';
import { UploadModule } from '../upload/upload.module';
import { UserModule } from '../user/user.module';
import { DeletePostsWorkerModule } from '../worker/delete-posts/deletePostsWorker.module';
import { DistributePostsWorkerModule } from '../worker/distribute-post/distributePostsWorker.module';
import { NotifyAuthorWorkerModule } from '../worker/notify-author/notifyAuthorWorker.module';
import { ReportWorkerModule } from '../worker/report/reportWorker.module';
import { PostService } from '@verdzie/server/post/post.service';
import { DistributeAnnotatedPostModule as DistributeAnnotatedPostsModule } from '@verdzie/server/worker/distribute-annotated-post/distributeAnnotatedPost.module';
import { NotifyAboutMentionWorkerModule } from '@verdzie/server/worker/notify-about-mention/notifyAboutMentionWorker.module';
import { UserListModule } from '@verdzie/server/user-list/userList.module';
import { NotifyAboutRepostWorkerModule } from '@verdzie/server/worker/notify-about-repost/notifyAboutRepostWorker.module';
import { RepostParentDeletedModule } from '@verdzie/server/worker/repost-parent-deleted/repostParentDeleted.module';
import { OSIncrementalIndexStateModule } from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.module';
import { ChallengeAccessControlModule } from '@verdzie/server/challenge/challenge-access-control/challengeAccessControl.module';
import { ChallengePostEntryModule } from '@verdzie/server/challenge/challenge-post-entry/challengePostEntry.module';
import { ChallengeInteractionModule } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.module';
import { PostRepositoryModule } from '@verdzie/server/post/post-repository/postRepository.module';
import { ChallengeLeaderboardModule } from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.module';
import { ChallengeCleanupProducerModule } from '@verdzie/server/worker/challenge-cleanup/challenge-cleanup-producer.module';
import { AddOrRemovePostsFromFeedWorkerModule } from '@verdzie/server/worker/add-remove-posts-feed/addOrRemovePostsFromFeedWorker.module';
import { DistributePostsToFollowingPostsFeedProducerModule } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowing.producer.module';
import { DistributePostsProducerModule } from '@verdzie/server/worker/distribute-post/distributePosts.producer.module';

@Module({
  imports: [
    ContentModule,
    FeedModule,
    CommentModule,
    UserModule,
    ReplyModule,
    UploadModule,
    OpenSearchIndexModule,
    TrollDetectorModule,
    DistributePostsWorkerModule,
    NotifyAuthorWorkerModule,
    ReportWorkerModule,
    DeletePostsWorkerModule,
    DistributeAnnotatedPostsModule,
    NotifyAboutMentionWorkerModule,
    UserListModule,
    NotifyAboutRepostWorkerModule,
    RepostParentDeletedModule,
    OSIncrementalIndexStateModule,
    ChallengeAccessControlModule,
    ChallengePostEntryModule,
    ChallengeInteractionModule,
    PostRepositoryModule,
    ChallengeLeaderboardModule,
    ChallengeCleanupProducerModule,
    AddOrRemovePostsFromFeedWorkerModule,
    DistributePostsToFollowingPostsFeedProducerModule,
    DistributePostsProducerModule,
  ],
  providers: [PostService, TypeOrmModule],
  exports: [PostService],
})
export class PostModule {}
