import { Module } from '@nestjs/common';
import { ActivityModule } from '@verdzie/server/activity/activity.module';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { ReplyModule } from '@verdzie/server/reply/reply.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { UserActivitiesConnectionResolver } from '@verdzie/server/user/resolvers/activities-connection/userActivitiesConnection.resolver';
import { ActivityStreamModule } from '@verdzie/server/activity-stream/activity.stream.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { ChallengeRepositoryModule } from '@verdzie/server/challenge/challenge-repository/challenge.repository.module';
import { ChallengeCoverModule } from '@verdzie/server/challenge/challenge-cover/challenge-cover.module';

@Module({
  imports: [
    UserModule,
    PostModule,
    CommentModule,
    ReplyModule,
    ActivityModule,
    ActivityStreamModule,
    FeedModule,
    ChallengeRepositoryModule,
    ChallengeCoverModule,
  ],
  providers: [UserActivitiesConnectionResolver],
  exports: [UserActivitiesConnectionResolver],
})
export class UserActivitiesConnectionModule {}
