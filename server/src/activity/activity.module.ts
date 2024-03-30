import { Module } from '@nestjs/common';
import { ActivityStreamModule } from '../activity-stream/activity.stream.module';
import { FCMModule } from '../fcm/fcm.module';
import { UserModule } from '../user/user.module';
import { ActivityService } from './activity.service';
import { PostModule } from '@verdzie/server/post/post.module';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { ReplyModule } from '@verdzie/server/reply/reply.module';
import { ChallengeModule } from '@verdzie/server/challenge/challenge.module';
import { ChallengeCommentModule } from '@verdzie/server/challenge/challenge-comment/challenge-comment-module';
import { AccessControlModule } from '@verdzie/server/access-control/access-control.module';

@Module({
  imports: [
    ActivityStreamModule,
    FCMModule,
    UserModule,
    PostModule,
    CommentModule,
    ReplyModule,
    ChallengeModule,
    ChallengeCommentModule,
    AccessControlModule,
  ],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
