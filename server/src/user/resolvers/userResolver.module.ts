import { Module } from '@nestjs/common';
import { UserModule } from '@verdzie/server/user/user.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { FirebaseAuthModule } from '@verdzie/server/firebase-auth/firebase-auth.module';
import { MailGunModule } from '@verdzie/server/mail-gun/mail-gun.module';
import { UserResolver } from '@verdzie/server/user/resolvers/user.resolver';
import { UserFollowerListResolver } from '@verdzie/server/user/resolvers/follower-following-list/userFollowerList.resolver';
import { UserFollowingsListResolver } from '@verdzie/server/user/resolvers/follower-following-list/userFollowingList.resolver';
import { BlockedUsersListResolver } from '@verdzie/server/user/resolvers/blocked-user/blockedUser.resolver';
import { GoogleAuthModule } from '@verdzie/server/google-auth/google-auth.module';
import { FCMModule } from '@verdzie/server/fcm/fcm.module';
import { UpdateUserPostsStateWorkerModule } from '@verdzie/server/worker/existence-state/update-user-posts-state/updateUserPostsStateWorker.module';
import { UpdateUserCommentsStateWorkerModule } from '@verdzie/server/worker/existence-state/update-user-comments-state/updateUserCommentsStateWorker.module';
import { UpdateUserRepliesStateWorkerModule } from '@verdzie/server/worker/existence-state/update-user-replies-state/updateUserRepliesStateWorker.module';
import { ActivityStreamModule } from '@verdzie/server/activity-stream/activity.stream.module';
import { UserTimezoneUpdateProducerModule } from '@verdzie/server/worker/user-timezone-update/user-timezone-update-producer.module';
import { InviteListServiceModule } from '@verdzie/server/invite-lists/invite-list.service.module';
import { InviteListTransporterModule } from '@verdzie/server/invite-lists/invite-list.transporter.module';

@Module({
  imports: [
    UserModule,
    FeedModule,
    FirebaseAuthModule,
    ActivityStreamModule,
    MailGunModule,
    GoogleAuthModule,
    FCMModule,
    UpdateUserPostsStateWorkerModule,
    UpdateUserCommentsStateWorkerModule,
    UpdateUserRepliesStateWorkerModule,
    UserTimezoneUpdateProducerModule,
    InviteListServiceModule,
    InviteListTransporterModule,
  ],
  providers: [
    UserResolver,
    UserFollowerListResolver,
    UserFollowingsListResolver,
    BlockedUsersListResolver,
  ],
  exports: [UserResolver],
})
export class UserResolverModule {}
