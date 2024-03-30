import { Module } from '@nestjs/common';
import { AdminUserModule } from '@verdzie/server/admin/user/adminUser.module';
import { AdminUserController } from '@verdzie/server/admin/user/adminUser.controller';
import { AdminController } from '@verdzie/server/admin/admin.controller';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { ActivityModule } from '@verdzie/server/activity/activity.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { AdminPostController } from '@verdzie/server/admin/post/adminPost.controller';
import { AdminPostModule } from '@verdzie/server/admin/post/adminPost.module';
import { StrikeModule } from '@verdzie/server/strike/strike.module';
import { AdminReportModule } from '@verdzie/server/admin/report/adminReport.module';
import { AdminInviteModule } from './invite/adminInvite.module';
import { AdminCategoryInterestsModule } from '@verdzie/server/admin/category-interests/adminCategoryInterests.module';
import { AdminCategoryInterestsController } from '@verdzie/server/admin/category-interests/adminCategoryInterests.controller';
import { GoogleApiModule } from '@verdzie/server/google-api/google-api.module';
import { AdminNotificationController } from '@verdzie/server/admin/notification/adminNotification.controller';
import { AdminNotificationModule } from '@verdzie/server/admin/notification/adminNotification.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { AdminFeedController } from '@verdzie/server/admin/feed/adminFeed.controller';
import { AdminFeedModule } from '@verdzie/server/admin/feed/adminFeed.module';
import { AdminCommentReplyModule } from '@verdzie/server/admin/comment-reply/adminCommentReply.module';
import { ReplyModule } from '@verdzie/server/reply/reply.module';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { AdminCommentReplyController } from '@verdzie/server/admin/comment-reply/adminCommentReply.controller';
import { MailGunModule } from '@verdzie/server/mail-gun/mail-gun.module';
import { AdminMailGunController } from '@verdzie/server/admin/mail-gun/adminMailGun.controller';
import { AdminMailGunModule } from '@verdzie/server/admin/mail-gun/adminMailGun.module';
import { FirebaseAdminModule } from '@verdzie/server/admin/firebase/firebase-admin.module';
import { FirebaseAdminController } from '@verdzie/server/admin/firebase/firebase-admin.controller';
import { AdminCreatorUserController } from '@verdzie/server/admin/creator-users/adminCreatorUser.controller';
import { AdminCreatorUserModule } from '@verdzie/server/admin/creator-users/adminCreatorUser.module';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { CreateCreatorAccountWorkerModule } from '@verdzie/server/worker/create-creator-account/createCreatorAccountWorker.module';
import { FirebaseModule } from '@verdzie/server/firebase/firebase.module';
import { AdminOpenSearchModule } from '@verdzie/server/admin/open-search/admin-open-search.module';
import { CategoryModule } from '@verdzie/server/admin/category/category.module';
import { CategoryTypeModule } from '@verdzie/server/admin/category-type/category-type.module';
import { AdminChallengeModule } from '@verdzie/server/admin/challenge/admin-challenge.module';
import { AdminScannerModule } from '@verdzie/server/admin/scanner/scanner.module';

@Module({
  imports: [
    WinstonBeanstalkModule.forRoot(),
    WildrTypeormModule,
    WildrBullModule,
    AdminUserModule,
    UserModule,
    ActivityModule,
    AdminPostModule,
    PostModule,
    StrikeModule,
    AdminFeedModule,
    FeedModule,
    AdminReportModule,
    AdminCommentReplyModule,
    CommentModule,
    ReplyModule,
    AdminInviteModule,
    AdminCategoryInterestsModule,
    GoogleApiModule,
    AdminNotificationModule,
    MailGunModule,
    AdminMailGunModule,
    FirebaseModule,
    FirebaseAdminModule,
    AdminCreatorUserModule,
    CreateCreatorAccountWorkerModule,
    AdminOpenSearchModule,
    CategoryModule,
    CategoryTypeModule,
    AdminChallengeModule,
    AdminScannerModule,
  ],
  controllers: [
    AdminController,
    AdminUserController,
    AdminPostController,
    AdminCategoryInterestsController,
    AdminNotificationController,
    AdminFeedController,
    AdminCommentReplyController,
    AdminMailGunController,
    FirebaseAdminController,
    AdminCreatorUserController,
  ],
})
export class AdminModule {}
