import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '@verdzie/server/user/user.module';
import { StrikeService } from '@verdzie/server/strike/strike.service';
import { ActivityModule } from '@verdzie/server/activity/activity.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { ReplyModule } from '@verdzie/server/reply/reply.module';

@Module({
  imports: [
    UserModule,
    ActivityModule,
    forwardRef(() => PostModule),
    forwardRef(() => CommentModule),
    forwardRef(() => ReplyModule),
  ],
  providers: [StrikeService],
  exports: [StrikeService],
})
export class StrikeModule {}
