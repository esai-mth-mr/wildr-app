import { Module } from '@nestjs/common';

import { CommentModule } from '@verdzie/server/comment/comment.module';
import { ReplyModule } from '@verdzie/server/reply/reply.module';
import { AdminCommentReplyController } from '@verdzie/server/admin/comment-reply/adminCommentReply.controller';
import { AdminCommentReplyService } from '@verdzie/server/admin/comment-reply/adminCommentReply.service';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { PostModule } from '@verdzie/server/post/post.module';

@Module({
  imports: [CommentModule, ReplyModule, FeedModule, PostModule],
  controllers: [AdminCommentReplyController],
  providers: [AdminCommentReplyService],
  exports: [AdminCommentReplyService],
})
export class AdminCommentReplyModule {}
