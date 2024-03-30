import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Module } from '@nestjs/common';
import { ActivityModule } from '@verdzie/server/activity/activity.module';
import { FirebaseAdminModule } from '@verdzie/server/admin/firebase/firebase-admin.module';
import {
  WildrBullModule,
  defaultRedis,
} from '@verdzie/server/bull/wildr-bull.module';
import { ChallengeModule } from '@verdzie/server/challenge/challenge.module';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { FirebaseAuthModule } from '@verdzie/server/firebase-auth/firebase-auth.module';
import { FirebaseModule } from '@verdzie/server/firebase/firebase.module';
import { TimepointModule } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.module';
import { ScheduledNotificationBuilderModule } from '@verdzie/server/notification-scheduler/orchestrator/notification-builder/notification-builder.module';
import { ScheduledNotificationSenderModule } from '@verdzie/server/notification-scheduler/orchestrator/notification-sender/notification-sender.module';
import { TimepointRecipientDistributionModule } from '@verdzie/server/notification-scheduler/orchestrator/timepoint-recipient-distribution/timepoint-recipient-distribution.module';
import { TimepointArchiverModule } from '@verdzie/server/notification-scheduler/timepoint-archiver/timepoint-archiver.module';
import { OSIndexStateModule } from '@verdzie/server/open-search-v2/index-state/index-state.module';
import { OSIndexingModule } from '@verdzie/server/open-search-v2/indexing/indexing.module';
import { OSReIndexCoordinatorModule } from '@verdzie/server/open-search-v2/re-index-coordinator/re-index-coordinator.module';
import { OpenSearchIndexModule } from '@verdzie/server/open-search/open-search-index/openSearchIndex.module';
import { OpenSearchModule } from '@verdzie/server/open-search/openSearch.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { ReplyModule } from '@verdzie/server/reply/reply.module';
import { ReportModule } from '@verdzie/server/report/report.module';
import { DeleteCommentsSQSModule } from '@verdzie/server/sqs/delete-comments-sqs-handler/deleteCommentsSQS.module';
import { DeletePostsSQSModule } from '@verdzie/server/sqs/delete-posts-sqs-handler/deletePostsSQS.module';
import { DistributeAnnotatedPostsSQSModule } from '@verdzie/server/sqs/distribute-annotated-posts-sqs-handler/distributeAnnotatedPostsSQS.module';
import { MiscSQSModule } from '@verdzie/server/sqs/misc-sqs-handler/misc-sqs-module';
import { SQSIndexingAggregatorModule } from '@verdzie/server/sqs/sqs-indexing-aggregator-handler/sqs-indexing-aggregator.module';
import { SQSPruneGlobalChallengesFeedModule } from '@verdzie/server/sqs/sqs-prune-global-challenges-feed-handler/sqs-prune-global-challenge-feed.module';
import { SQSTimepointArchiverHandlerModule } from '@verdzie/server/sqs/sqs-timepoint-archiver-handler/sqs-timepoint-archiver-handler.module';
import { SQSTimepointRecipientDistributionHandlerModule } from '@verdzie/server/sqs/sqs-timepoint-recipient-distribution-handler/sqs-timepoint-recipient-distribution-handler.module';
import { StrikeModule } from '@verdzie/server/strike/strike.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserListModule } from '@verdzie/server/user-list/userList.module';
import { UserPropertyMapModule } from '@verdzie/server/user-property-map/userPropertyMap.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import { AddOrRemovePostsFromFeedConsumer } from '@verdzie/server/worker/add-remove-posts-feed/addOrRemovePostsFromFeed.consumer';
import { UpdateUsersInBatchConsumer } from '@verdzie/server/worker/batch-update-users/updateUsersInBatch.consumer';
import { UpdateUsersInBatchModule } from '@verdzie/server/worker/batch-update-users/updateUsersInBatch.module';
import { ChallengeCleanupConsumerModule } from '@verdzie/server/worker/challenge-cleanup/challenge-cleanup-consumer.module';
import { CreateCreatorAccountConsumer } from '@verdzie/server/worker/create-creator-account/createCreatorAccount.consumer';
import { CreateCreatorAccountWorkerModule } from '@verdzie/server/worker/create-creator-account/createCreatorAccountWorker.module';
import { DeleteCommentsConsumer } from '@verdzie/server/worker/delete-comments/deleteComments.consumer';
import { DeleteCommentsWorkerModule } from '@verdzie/server/worker/delete-comments/deleteCommentsWorker.module';
import { DeletePostsConsumer } from '@verdzie/server/worker/delete-posts/deletePosts.consumer';
import { DeleteRepliesConsumer } from '@verdzie/server/worker/delete-replies/deleteReplies.consumer';
import { DeleteRepliesWorkerModule } from '@verdzie/server/worker/delete-replies/deleteRepliesWorker.module';
import { DistributeAnnotatedPostModule } from '@verdzie/server/worker/distribute-annotated-post/distributeAnnotatedPost.module';
import { DistributePostsToFollowingPostsFeedConsumerModule } from '@verdzie/server/worker/distribute-post/distribute-post-to-following-posts-feed-worker/distributePostsToFollowing.consumer.module';
import { DistributePostToListsConsumerModule } from '@verdzie/server/worker/distribute-post/distribute-post-to-lists-worker/distributePostToLists.consumer.module';
import { DistributePostsConsumerModule } from '@verdzie/server/worker/distribute-post/distributePosts.consumer.module';
import { DistributePostsWorkerModule } from '@verdzie/server/worker/distribute-post/distributePostsWorker.module';
import { LiftEmbargoConsumer } from '@verdzie/server/worker/embago/liftEmbargo.consumer';
import { LiftEmbargoWorkerModule } from '@verdzie/server/worker/embago/liftEmbargoWorkerModule';
import { UpdateUserCommentsStateConsumer } from '@verdzie/server/worker/existence-state/update-user-comments-state/updateUserCommentsState.consumer';
import { UpdateUserCommentsStateWorkerModule } from '@verdzie/server/worker/existence-state/update-user-comments-state/updateUserCommentsStateWorker.module';
import { UpdateUserPostsStateConsumer } from '@verdzie/server/worker/existence-state/update-user-posts-state/updateUserPostsState.consumer';
import { UpdateUserPostsStateWorkerModule } from '@verdzie/server/worker/existence-state/update-user-posts-state/updateUserPostsStateWorker.module';
import { UpdateUserRepliesStateConsumer } from '@verdzie/server/worker/existence-state/update-user-replies-state/updateUserRepliesState.consumer';
import { UpdateUserRepliesStateWorkerModule } from '@verdzie/server/worker/existence-state/update-user-replies-state/updateUserRepliesStateWorker.module';
import { FollowEventFillUpConsumer } from '@verdzie/server/worker/follow-event-fillup/followEventFillup.consumer';
import { GlobalChallengeFeedPruningConsumerModule } from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.consumer.module';
import { IndexTagsConsumer } from '@verdzie/server/worker/index-tags/indexTags.consumer';
import { InviteListRecordingConsumerModule } from '@verdzie/server/worker/invite-list-recording/invite-list-recording.consumer.module';
import { ScheduledNotificationSenderConsumer } from '@verdzie/server/worker/notification-sender/notification-sender.consumer';
import { NotifyAboutMentionConsumer } from '@verdzie/server/worker/notify-about-mention/notifyAboutMention.consumer';
import { NotifyAboutRepostConsumer } from '@verdzie/server/worker/notify-about-repost/notifyAboutRepost.consumer';
import { NotifyAddToICConsumer } from '@verdzie/server/worker/notify-add-to-inner-circle/notifyAddToIC.consumer';
import { NotifyAuthorConsumer } from '@verdzie/server/worker/notify-author/notifyAuthor.consumer';
import { NotifyChallengeAuthorParticipantJoinProducerModule } from '@verdzie/server/worker/notify-challenge-author-participant-join/notify-challenge-author-participant-join-producer.module';
import { NotifyChallengeAuthorParticipantJoinConsumer } from '@verdzie/server/worker/notify-challenge-author-participant-join/notify-challenge-author-participant-join.consumer';
import { NotifyFollowersAboutPostsConsumer } from '@verdzie/server/worker/notify-followers-about-posts/notifyFollowersAboutPosts.consumer';
import { NotifyFollowersAboutPostsWorkerModule } from '@verdzie/server/worker/notify-followers-about-posts/notifyFollowersAboutPostsWorker.module';
import { NotifyFollowersOfChallengeCreationConsumer } from '@verdzie/server/worker/notify-followers-challenge-creation/notify-followers-challenge-creation.consumer';
import { NotifyFollowersChallengeCreationModule } from '@verdzie/server/worker/notify-followers-challenge-creation/notify-followers-challenge-creation.module';
import { OSIncrementalIndexStateConsumer } from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.consumer';
import { OSIncrementalIndexStateModule } from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.module';
import { IndexingServiceConsumer } from '@verdzie/server/worker/open-search-indexing/open-search-indexing.consumer';
import { OSIndexingWorkerModule } from '@verdzie/server/worker/open-search-indexing/open-search-indexing.module';
import { OSReIndexCoordinatorConsumer } from '@verdzie/server/worker/open-search-re-index-coordinator/open-search-re-index-coordinator.consumer';
import { OSReIndexCoordinatorWorkerModule } from '@verdzie/server/worker/open-search-re-index-coordinator/open-search-re-index-coordinator.module';
import { OSReIndexStateConsumer } from '@verdzie/server/worker/open-search-re-index-state/open-search-re-index-state.consumer';
import { OSReIndexStateWorkerModule } from '@verdzie/server/worker/open-search-re-index-state/open-search-re-index-state.module';
import { PrepareAnnotatedPostsDistributionConsumer } from '@verdzie/server/worker/prepare-annotated-posts-distribution/prepareAnnotatedPostsDistribution.consumer';
import { PrepareAnnotatedPostsDistributionModule } from '@verdzie/server/worker/prepare-annotated-posts-distribution/prepareAnnotatedPostsDistribution.module';
import { PrepareInitialFeedConsumer } from '@verdzie/server/worker/prepare-initial-feed/prepareInitialFeed.consumer';
import { PrepareInitialFeedModule } from '@verdzie/server/worker/prepare-initial-feed/prepareInitialFeed.module';
import { PrepareUpdateUsersBatchConsumer } from '@verdzie/server/worker/prepare-update-users-batch/prepareUpdateUsersBatch.consumer';
import { PrepareUpdateUsersBatchWorkerModule } from '@verdzie/server/worker/prepare-update-users-batch/prepareUpdateUsersBatch.module';
import { RankPostServiceModule } from '@verdzie/server/worker/rank-and-distribute-post/rank-post.service.module';
import { RankAndDistributePostConsumerModule } from '@verdzie/server/worker/rank-and-distribute-post/rankAndDistributePost.consumer.module';
import { RankAndDistributePostProducerModule } from '@verdzie/server/worker/rank-and-distribute-post/rankAndDistributePost.producer.module';
import { ReportConsumer } from '@verdzie/server/worker/report/report.consumer';
import { RepostParentDeletedConsumer } from '@verdzie/server/worker/repost-parent-deleted/repostParentDeleted.consumer';
import { RepostParentDeletedModule } from '@verdzie/server/worker/repost-parent-deleted/repostParentDeleted.module';
import { ScheduledNotificationBuilderConsumer } from '@verdzie/server/worker/scheduled-notification-builder/scheduled-notification-builder.consumer';
import { ScoreDataConsumer } from '@verdzie/server/worker/score-data/scoreData.consumer';
import { StrikeConsumer } from '@verdzie/server/worker/strike/strike.consumer';
import { SuspensionConsumer } from '@verdzie/server/worker/suspension/suspension.consumer';
import { SuspensionModule } from '@verdzie/server/worker/suspension/suspension.module';
import { TemplateConsumerModule } from '@verdzie/server/worker/template/template.consumer.module';
import { TimepointArchiverConsumer } from '@verdzie/server/worker/timepoint-archiver/timepoint-archiver.consumer';
import { TimepointRecipientDistributionConsumer } from '@verdzie/server/worker/timepoint-recipient-distribution/timepoint-recipient-distribution.consumer';
import { TimepointSchedulingProducerModule } from '@verdzie/server/worker/timepoint-scheduling/timepoint-scheduling-producer.module';
import { TimepointSchedulingConsumer } from '@verdzie/server/worker/timepoint-scheduling/timepoint-scheduling.consumer';
import { UnfollowEventCleanupConsumer } from '@verdzie/server/worker/unfollow-event-cleaup/unfollowEventCleanup.consumer';
import { UpdateChallengeParticipantsDataConsumer } from '@verdzie/server/worker/update-challenge-participants-data/updateChallengeParticipantsData.consumer';
import { UpdateChallengeParticipantsDataModule } from '@verdzie/server/worker/update-challenge-participants-data/updateChallengeParticipantsData.module';
import { UpdatePostsInBatchConsumer } from '@verdzie/server/worker/update-posts-in-batch/updatePostsInBatch.consumer';
import { UpdatePostsInBatchModule } from '@verdzie/server/worker/update-posts-in-batch/updatePostsInBatch.module';
import { UpdateUserExploreFeedConsumerModule } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.consumer.module';
import { UpdateUserExploreFeedProducerModule } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.producer.module';
import { UpdateUsersInviteCountConsumer } from '@verdzie/server/worker/update-users-invite-count/updateUsersInviteCount.consumer';
import { UpdateUsersInviteCountWorkerModule } from '@verdzie/server/worker/update-users-invite-count/updateUsersInviteCount.module';
import { UpdateViewCountConsumer } from '@verdzie/server/worker/update-view-count/updateViewCount.consumer';
import { UpdateViewCountModule } from '@verdzie/server/worker/update-view-count/updateViewCount.module';
import { UserStatsSyncConsumerModule } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.consumer.module';
import { UserTimezoneUpdateProducerModule } from '@verdzie/server/worker/user-timezone-update/user-timezone-update-producer.module';
import { UserTimezoneUpdateConsumer } from '@verdzie/server/worker/user-timezone-update/user-timezone-update.consumer';
import { ScanInitializerConsumerModule } from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.consumer.module';
import { TaskInitializerConsumerModule } from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.consumer.module';
import { WorkflowManagerConsumerModule } from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager.consumer.module';

@Module({
  imports: [
    WinstonBeanstalkModule.forRoot(),
    RedisModule.forRoot({
      config: defaultRedis,
    }),
    WildrTypeormModule,
    WildrBullModule,
    FirebaseModule,
    FirebaseAuthModule,
    FirebaseAdminModule,
    FeedModule,
    UserModule,
    ActivityModule,
    PostModule,
    ChallengeModule,
    ReportModule,
    ReplyModule,
    CommentModule,
    OpenSearchModule,
    DeleteRepliesWorkerModule,
    DeleteCommentsWorkerModule,
    LiftEmbargoWorkerModule,
    SuspensionModule,
    DistributePostsWorkerModule,
    NotifyFollowersAboutPostsWorkerModule,
    OpenSearchIndexModule,
    UpdateUsersInviteCountWorkerModule,
    PrepareUpdateUsersBatchWorkerModule,
    UpdateUsersInBatchModule,
    StrikeModule,
    DistributeAnnotatedPostsSQSModule,
    PrepareAnnotatedPostsDistributionModule,
    RankAndDistributePostProducerModule,
    UpdateUserExploreFeedProducerModule,
    UpdateUserExploreFeedConsumerModule,
    DistributeAnnotatedPostModule,
    UpdateViewCountModule,
    PrepareInitialFeedModule,
    UpdateUserPostsStateWorkerModule,
    UpdateUserCommentsStateWorkerModule,
    UpdateUserRepliesStateWorkerModule,
    UserPropertyMapModule,
    UserListModule,
    UpdatePostsInBatchModule,
    RepostParentDeletedModule,
    CreateCreatorAccountWorkerModule,
    OSIncrementalIndexStateModule,
    OSIndexingModule,
    OSIndexingWorkerModule,
    OSReIndexCoordinatorWorkerModule,
    OSReIndexStateWorkerModule,
    OSReIndexCoordinatorModule,
    OSIndexStateModule,
    NotifyChallengeAuthorParticipantJoinProducerModule,
    NotifyFollowersChallengeCreationModule,
    ChallengeCleanupConsumerModule,
    UpdateChallengeParticipantsDataModule,
    ScheduledNotificationBuilderModule,
    ScheduledNotificationSenderModule,
    TimepointRecipientDistributionModule,
    TimepointModule,
    TimepointArchiverModule,
    TimepointSchedulingProducerModule,
    UserTimezoneUpdateProducerModule,
    GlobalChallengeFeedPruningConsumerModule,
    SQSPruneGlobalChallengesFeedModule,
    SQSTimepointRecipientDistributionHandlerModule,
    SQSTimepointArchiverHandlerModule,
    SQSIndexingAggregatorModule,
    MiscSQSModule,
    DistributeAnnotatedPostsSQSModule,
    DeletePostsSQSModule,
    DeleteCommentsSQSModule,
    SuspensionModule,
    LiftEmbargoWorkerModule,
    WorkflowManagerConsumerModule,
    TaskInitializerConsumerModule,
    ScanInitializerConsumerModule,
    TemplateConsumerModule,
    UserStatsSyncConsumerModule,
    InviteListRecordingConsumerModule,
    DistributePostsToFollowingPostsFeedConsumerModule,
    DistributePostsConsumerModule,
    DistributePostToListsConsumerModule,
    RankAndDistributePostConsumerModule,
    DistributeAnnotatedPostModule,
    RankPostServiceModule,
  ],
  providers: [
    NotifyAuthorConsumer,
    NotifyFollowersAboutPostsConsumer,
    NotifyAboutMentionConsumer,
    NotifyAddToICConsumer,
    AddOrRemovePostsFromFeedConsumer,
    LiftEmbargoConsumer,
    SuspensionConsumer,
    ScoreDataConsumer,
    ReportConsumer,
    StrikeConsumer,
    DeleteRepliesConsumer,
    DeleteCommentsConsumer,
    DeletePostsConsumer,
    IndexTagsConsumer,
    UpdateUsersInviteCountConsumer,
    UpdateUsersInBatchConsumer,
    PrepareUpdateUsersBatchConsumer,
    PrepareAnnotatedPostsDistributionConsumer,
    UpdateViewCountConsumer,
    PrepareInitialFeedConsumer,
    UpdateUserPostsStateConsumer,
    UpdateUserCommentsStateConsumer,
    UpdateUserRepliesStateConsumer,
    NotifyAboutRepostConsumer,
    UpdatePostsInBatchConsumer,
    RepostParentDeletedConsumer,
    FollowEventFillUpConsumer,
    CreateCreatorAccountConsumer,
    OSIncrementalIndexStateModule,
    OSIncrementalIndexStateConsumer,
    IndexingServiceConsumer,
    OSReIndexCoordinatorConsumer,
    OSReIndexStateConsumer,
    NotifyChallengeAuthorParticipantJoinConsumer,
    NotifyFollowersOfChallengeCreationConsumer,
    UpdateChallengeParticipantsDataConsumer,
    UnfollowEventCleanupConsumer,
    TimepointSchedulingConsumer,
    TimepointArchiverConsumer,
    TimepointRecipientDistributionConsumer,
    ScheduledNotificationBuilderConsumer,
    ScheduledNotificationSenderConsumer,
    UserTimezoneUpdateConsumer,
  ],
})
export class WorkerModule {}
