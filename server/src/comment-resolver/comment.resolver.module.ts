import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { ReplyModule } from '../reply/reply.module';
import { UserModule } from '../user/user.module';
import { CommentResolver } from '@verdzie/server/comment-resolver/comment.resolver';
import { PostModule } from '@verdzie/server/post/post.module';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { ChallengeCommentModule } from '@verdzie/server/challenge/challenge-comment/challenge-comment-module';

@Module({
  imports: [
    ReplyModule,
    PostModule,
    ContentModule,
    UserModule,
    CommentModule,
    ChallengeCommentModule,
  ],
  exports: [CommentResolver],
  providers: [CommentResolver],
})
export class CommentResolverModule {}
