import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { UserModule } from '../user/user.module';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { ReplyModule } from '@verdzie/server/reply/reply.module';
import { ReplyResolver } from '@verdzie/server/reply-resolver/reply.resolver';
import { ChallengeCommentModule } from '@verdzie/server/challenge/challenge-comment/challenge-comment-module';

@Module({
  imports: [
    UserModule,
    ReplyModule,
    ContentModule,
    CommentModule,
    ChallengeCommentModule,
  ],
  providers: [ReplyResolver],
})
export class ReplyResolverModule {}
