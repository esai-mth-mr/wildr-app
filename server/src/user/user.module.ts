import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityStreamModule } from '@verdzie/server/activity-stream/activity.stream.module';
import { jwtConstants } from '@verdzie/server/auth/constants';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { FirebaseAuthModule } from '@verdzie/server/firebase-auth/firebase-auth.module';
import { InviteCodeModule } from '@verdzie/server/invite-code/inviteCode.module';
import { OpenSearchIndexModule } from '@verdzie/server/open-search/open-search-index/openSearchIndex.module';
import { UploadModule } from '@verdzie/server/upload/upload.module';
import { UserSchema } from '@verdzie/server/user/user.schema';
import { UserService } from '@verdzie/server/user/user.service';
import { AddOrRemovePostsFromFeedWorkerModule } from '@verdzie/server/worker/add-remove-posts-feed/addOrRemovePostsFromFeedWorker.module';
import { NotifyAuthorWorkerModule } from '@verdzie/server/worker/notify-author/notifyAuthorWorker.module';
import { PrepareInitialFeedModule } from '@verdzie/server/worker/prepare-initial-feed/prepareInitialFeed.module';
import { ScoreDataWorkerModule } from '@verdzie/server/worker/score-data/scoreData.module';
import { UserPropertyMapModule } from '@verdzie/server/user-property-map/userPropertyMap.module';
import { UserListModule } from '@verdzie/server/user-list/userList.module';
import { EntitiesWithPagesModule } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.module';
import { NotifyAddedToICModule } from '@verdzie/server/worker/notify-add-to-inner-circle/notifyAddedToIC.module';
import { UnfollowEventCleanupModule } from '@verdzie/server/worker/unfollow-event-cleaup/unfollowEventCleanup.module';
import { FollowEventFillUpModule } from '@verdzie/server/worker/follow-event-fillup/followEventFillup.module';
import { OSIncrementalIndexStateModule } from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.module';
import { UserStatsService } from '@verdzie/server/user/user-stats.service';
import { InviteListRecordingProducerModule } from '@verdzie/server/worker/invite-list-recording/invite-list-recording.producer.module';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
    }),
    TypeOrmModule.forFeature([UserSchema]),
    FeedModule,
    UploadModule,
    ActivityStreamModule,
    OpenSearchIndexModule,
    NotifyAuthorWorkerModule,
    AddOrRemovePostsFromFeedWorkerModule,
    ScoreDataWorkerModule,
    FirebaseAuthModule,
    InviteCodeModule,
    PrepareInitialFeedModule,
    UserPropertyMapModule,
    UserListModule,
    EntitiesWithPagesModule,
    NotifyAddedToICModule,
    UnfollowEventCleanupModule,
    FollowEventFillUpModule,
    OSIncrementalIndexStateModule,
    InviteListRecordingProducerModule,
  ],
  providers: [UserService, UserStatsService],
  exports: [UserService],
})
export class UserModule {}
