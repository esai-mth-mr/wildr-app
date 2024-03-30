import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ActivityStreamModule } from '@verdzie/server/activity-stream/activity.stream.module';
import { ActivityModule } from '@verdzie/server/activity/activity.module';
import { AuthModule } from '@verdzie/server/auth/auth.module';
import '@verdzie/server/aws/aws-config-setup';
import { BannerResolverModule } from '@verdzie/server/banner/banner.resolver.module';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { ChallengeAccessControlModule } from '@verdzie/server/challenge/challenge-access-control/challengeAccessControl.module';
import { ChallengeCommentModule } from '@verdzie/server/challenge/challenge-comment/challenge-comment-module';
import { ChallengeEntriesResolverModule } from '@verdzie/server/challenge/challenge-entries/challengeEntries-resolver.module';
import { ChallengeEntriesModule } from '@verdzie/server/challenge/challenge-entries/challengeEntries.module';
import { ChallengeNotificationModule } from '@verdzie/server/challenge/challenge-notification/challenge-notification.module';
import { ChallengeParticipantsModule } from '@verdzie/server/challenge/challenge-participants/challengeParticipants.module';
import { ChallengePostEntryModule } from '@verdzie/server/challenge/challenge-post-entry/challengePostEntry.module';
import { ChallengeRepositoryModule } from '@verdzie/server/challenge/challenge-repository/challenge.repository.module';
import { ChallengeResolverModule } from '@verdzie/server/challenge/challenge-resolver/challengeResolver.module';
import { ChallengeUpdateStatsModule } from '@verdzie/server/challenge/challenge-update-stats/challengeUpdateStats.module';
import { ChallengeModule } from '@verdzie/server/challenge/challenge.module';
import { CommentResolverModule } from '@verdzie/server/comment-resolver/comment.resolver.module';
import { AppContext, newAppContext } from '@verdzie/server/common';
import { ContentModule } from '@verdzie/server/content/content.module';
import { EntitiesWithPagesModule } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.module';
import { ValidationException } from '@verdzie/server/exceptions/ValidationException';
import { FCMModule } from '@verdzie/server/fcm/fcm.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { FeedResolverModule } from '@verdzie/server/feed/feed.resolver.module';
import { FirebaseAuthModule } from '@verdzie/server/firebase-auth/firebase-auth.module';
import { GoogleApiModule } from '@verdzie/server/google-api/google-api.module';
import { GoogleAuthModule } from '@verdzie/server/google-auth/google-auth.module';
import { HealthController } from '@verdzie/server/health/health.controller';
import { UserTimezoneUpdateInterceptorModule } from '@verdzie/server/interceptors/user-timezone-update.interceptor.module';
import { InviteCodeActionModule } from '@verdzie/server/invite-code/inviteCodeAction.module';
import { InviteCodeResolverModule } from '@verdzie/server/invite-code/inviteCodeResolver.module';
import { MailGunModule } from '@verdzie/server/mail-gun/mail-gun.module';
import { LoggerMiddleware } from '@verdzie/server/middleware/logger.middleware';
import { MobileFeatureFlagsModule } from '@verdzie/server/mobile-feature-flags/mobileFeatureFlags.module';
import { OpenSearchIndexModule } from '@verdzie/server/open-search/open-search-index/openSearchIndex.module';
import { OpenSearchModule } from '@verdzie/server/open-search/openSearch.module';
import { PostCategoryModule } from '@verdzie/server/post-category/postCategory.module';
import { PostRepositoryModule } from '@verdzie/server/post/post-repository/postRepository.module';
import { PostResolverModule } from '@verdzie/server/post/post-resolver/post.resolver.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { ReplyResolverModule } from '@verdzie/server/reply-resolver/reply.resolver.module';
import { ReportModule } from '@verdzie/server/report/report.module';
import {
  TIMEZONE_OFFSET_HEADER,
  VERSION_HEADER,
} from '@verdzie/server/request/request.constants';
import { ReviewReportRequestModule } from '@verdzie/server/review-report-request/reviewReportRequest.module';
import { StrikeModule } from '@verdzie/server/strike/strike.module';
import { TagModule } from '@verdzie/server/tag/tag.module';
import { TrollDetectorResolverModule } from '@verdzie/server/troll-detector/troll-detector-resolver.module';
import { TrollDetectorModule } from '@verdzie/server/troll-detector/troll-detector.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UploadModule } from '@verdzie/server/upload/upload.module';
import { UserListResolverModule } from '@verdzie/server/user-list-resolver/userListResolver.module';
import { UserListModule } from '@verdzie/server/user-list/userList.module';
import { UserPropertyMapModule } from '@verdzie/server/user-property-map/userPropertyMap.module';
import { UserActivitiesConnectionModule } from '@verdzie/server/user/resolvers/activities-connection/userActivitiesConnection.module';
import { UserPostsConnectionModule } from '@verdzie/server/user/resolvers/posts-connection/userPostsConnection.module';
import { UserResolverModule } from '@verdzie/server/user/resolvers/userResolver.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { WaitlistResolverModule } from '@verdzie/server/waitlist/waitlist.resolver.module';
import { WebAppFeatureFlagsResolverModule } from '@verdzie/server/web-app-feature-flags/web-app-feature-flags.resolver.module';
import { WildrAppConfigModule } from '@verdzie/server/wildr-app-config/wildr-app-config.module';
import { WildrRedisModule } from '@verdzie/server/wildr-redis/wildr-redis.module';
import {
  WinstonBeanstalkModule,
  getLogger,
} from '@verdzie/server/winstonBeanstalk.module';
import { AddOrRemovePostsFromFeedWorkerModule } from '@verdzie/server/worker/add-remove-posts-feed/addOrRemovePostsFromFeedWorker.module';
import { UpdateUsersInBatchModule } from '@verdzie/server/worker/batch-update-users/updateUsersInBatch.module';
import { DeleteCommentsWorkerModule } from '@verdzie/server/worker/delete-comments/deleteCommentsWorker.module';
import { DeletePostsWorkerModule } from '@verdzie/server/worker/delete-posts/deletePostsWorker.module';
import { DeleteRepliesWorkerModule } from '@verdzie/server/worker/delete-replies/deleteRepliesWorker.module';
import { DistributeAnnotatedPostModule } from '@verdzie/server/worker/distribute-annotated-post/distributeAnnotatedPost.module';
import { DistributePostsWorkerModule } from '@verdzie/server/worker/distribute-post/distributePostsWorker.module';
import { UpdateUserCommentsStateWorkerModule } from '@verdzie/server/worker/existence-state/update-user-comments-state/updateUserCommentsStateWorker.module';
import { UpdateUserPostsStateWorkerModule } from '@verdzie/server/worker/existence-state/update-user-posts-state/updateUserPostsStateWorker.module';
import { UpdateUserRepliesStateWorkerModule } from '@verdzie/server/worker/existence-state/update-user-replies-state/updateUserRepliesStateWorker.module';
import { GlobalChallengeFeedPruningProducerModule } from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.producer.module';
import { IndexTagsWorkerModule } from '@verdzie/server/worker/index-tags/indexTagsWorker.module';
import { NotifyAboutMentionWorkerModule } from '@verdzie/server/worker/notify-about-mention/notifyAboutMentionWorker.module';
import { NotifyAboutRepostWorkerModule } from '@verdzie/server/worker/notify-about-repost/notifyAboutRepostWorker.module';
import { NotifyAddedToICModule } from '@verdzie/server/worker/notify-add-to-inner-circle/notifyAddedToIC.module';
import { NotifyAuthorWorkerModule } from '@verdzie/server/worker/notify-author/notifyAuthorWorker.module';
import { NotifyFollowersAboutPostsWorkerModule } from '@verdzie/server/worker/notify-followers-about-posts/notifyFollowersAboutPostsWorker.module';
import { PrepareAnnotatedPostsDistributionModule } from '@verdzie/server/worker/prepare-annotated-posts-distribution/prepareAnnotatedPostsDistribution.module';
import { PrepareInitialFeedModule } from '@verdzie/server/worker/prepare-initial-feed/prepareInitialFeed.module';
import { PrepareUpdateUsersBatchWorkerModule } from '@verdzie/server/worker/prepare-update-users-batch/prepareUpdateUsersBatch.module';
import { RankAndDistributePostProducerModule } from '@verdzie/server/worker/rank-and-distribute-post/rankAndDistributePost.producer.module';
import { ReportWorkerModule } from '@verdzie/server/worker/report/reportWorker.module';
import { RepostParentDeletedModule } from '@verdzie/server/worker/repost-parent-deleted/repostParentDeleted.module';
import { ScoreDataWorkerModule } from '@verdzie/server/worker/score-data/scoreData.module';
import { StrikeWorkerModule } from '@verdzie/server/worker/strike/strikeWorker.module';
import { UpdateChallengeParticipantsDataModule } from '@verdzie/server/worker/update-challenge-participants-data/updateChallengeParticipantsData.module';
import { UpdatePostsInBatchModule } from '@verdzie/server/worker/update-posts-in-batch/updatePostsInBatch.module';
import { UpdateUserExploreFeedProducerModule } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.producer.module';
import { UpdateViewCountModule } from '@verdzie/server/worker/update-view-count/updateViewCount.module';
import { UserTimezoneUpdateProducerModule } from '@verdzie/server/worker/user-timezone-update/user-timezone-update-producer.module';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { GraphQLUpload, graphqlUploadExpress } from 'graphql-upload';
import { QueryFailedError } from 'typeorm';
import { InviteCodeModule } from './invite-code/inviteCode.module';
import { OpenTelemetryMetricsModule } from './opentelemetry/openTelemetry.module';
import { UpdateUsersInviteCountWorkerModule } from './worker/update-users-invite-count/updateUsersInviteCount.module';
import { WildrRateLimiterModule } from '@verdzie/server/rate-limiter/rate-limiter.module';
import { MailResolverModule } from '@verdzie/server/mail/mail.resolver.module';

@Module({
  imports: [
    FirebaseAuthModule,
    GoogleAuthModule,
    UserTimezoneUpdateProducerModule,
    UserTimezoneUpdateInterceptorModule,
  ],
  controllers: [HealthController],
})
export class GraphQLWithUploadModule implements NestModule {
  async configure(consumer: MiddlewareConsumer) {
    consumer.apply(graphqlUploadExpress()).forRoutes('graphql');
    consumer.apply(LoggerMiddleware).forRoutes('graphql');
  }

  static forRoot(): DynamicModule {
    return {
      module: GraphQLWithUploadModule,
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          // CWD is different for (prod) and dev - code is within dist in prod.
          typePaths: ['./**/*.graphql'],
          context: ({ req }: any): AppContext => ({
            ...newAppContext(),
            req,
            version: req.headers[VERSION_HEADER],
            timezoneOffset: req.headers[TIMEZONE_OFFSET_HEADER],
          }),
          path: '/graphql',
          resolvers: {
            Upload: GraphQLUpload,
          },
          formatError: (error: GraphQLError): GraphQLFormattedError => {
            getLogger().error('Uncaught GraphQLError', {
              error,
              context: GraphQLWithUploadModule.name,
              methodName: 'formatError',
            });
            if (error.originalError instanceof ValidationException) {
              return {
                message: error?.originalError.name ?? '',
                extensions: error?.originalError.errors ?? [],
              };
            } else if (error?.extensions['code'] === 'UNAUTHENTICATED') {
              return new GraphQLError(error.message, {
                extensions: {
                  statusCode: '401',
                  ...error.extensions,
                },
              });
            } else if (error.originalError instanceof QueryFailedError) {
              const originalError = new QueryFailedError(
                error.originalError.query,
                [],
                error.originalError.driverError
              );
              return new GraphQLError(error.message, {
                nodes: error.nodes,
                source: error.source,
                positions: error.positions,
                path: error.path,
                originalError: originalError,
              });
            }
            return error;
          },
          introspection: true,
        }),
      ],
    };
  }
}

@Module({
  imports: [
    OpenTelemetryMetricsModule,
    WinstonBeanstalkModule.forRoot(),
    WildrTypeormModule,
    WildrBullModule,
    WildrRedisModule,
    GraphQLWithUploadModule.forRoot(),
    UploadModule,
    PostRepositoryModule,
    UserModule,
    PostModule,
    FeedModule,
    UserPostsConnectionModule,
    UserActivitiesConnectionModule,
    AuthModule,
    FeedResolverModule,
    TagModule,
    ContentModule,
    OpenSearchModule,
    OpenSearchIndexModule,
    ActivityModule,
    ActivityStreamModule,
    FCMModule,
    TrollDetectorModule,
    DistributePostsWorkerModule,
    NotifyAuthorWorkerModule,
    NotifyAddedToICModule,
    AddOrRemovePostsFromFeedWorkerModule,
    StrikeWorkerModule,
    ScoreDataWorkerModule,
    ReportWorkerModule,
    ReportModule,
    ReviewReportRequestModule,
    DeleteRepliesWorkerModule,
    DeleteCommentsWorkerModule,
    DeletePostsWorkerModule,
    NotifyFollowersAboutPostsWorkerModule,
    IndexTagsWorkerModule,
    InviteCodeModule,
    InviteCodeResolverModule,
    InviteCodeActionModule,
    UpdateUsersInviteCountWorkerModule,
    StrikeModule,
    UpdateUsersInBatchModule,
    PrepareUpdateUsersBatchWorkerModule,
    MailGunModule,
    PostCategoryModule,
    PrepareAnnotatedPostsDistributionModule,
    DistributeAnnotatedPostModule,
    RankAndDistributePostProducerModule,
    UpdateUserExploreFeedProducerModule,
    UpdateViewCountModule,
    PrepareInitialFeedModule,
    GoogleApiModule,
    UpdateUserPostsStateWorkerModule,
    UpdateUserRepliesStateWorkerModule,
    UpdateUserCommentsStateWorkerModule,
    NotifyAboutMentionWorkerModule,
    CommentResolverModule,
    ReplyResolverModule,
    UserListModule,
    UserListResolverModule,
    EntitiesWithPagesModule,
    UserPropertyMapModule,
    UserResolverModule,
    NotifyAboutRepostWorkerModule,
    RepostParentDeletedModule,
    UpdatePostsInBatchModule,
    WildrAppConfigModule,
    ChallengeModule,
    ChallengeRepositoryModule,
    ChallengePostEntryModule,
    ChallengeAccessControlModule,
    ChallengeParticipantsModule,
    ChallengeResolverModule,
    PostResolverModule,
    ChallengeUpdateStatsModule,
    ChallengeCommentModule,
    ChallengeEntriesModule,
    ChallengeEntriesResolverModule,
    TrollDetectorResolverModule,
    UpdateChallengeParticipantsDataModule,
    ChallengeNotificationModule,
    UserTimezoneUpdateInterceptorModule,
    GlobalChallengeFeedPruningProducerModule,
    MobileFeatureFlagsModule,
    BannerResolverModule,
    WaitlistResolverModule,
    WebAppFeatureFlagsResolverModule,
    WildrRateLimiterModule,
    MailResolverModule,
  ],
})
export class AppModule {}
