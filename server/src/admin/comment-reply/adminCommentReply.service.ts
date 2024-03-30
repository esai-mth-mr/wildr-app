import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CommentService } from '@verdzie/server/comment/comment.service';
import { ReplyService } from '@verdzie/server/reply/reply.service';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import { ReplyEntity } from '@verdzie/server/reply/reply.entity';
import { PostService } from '@verdzie/server/post/post.service';
import { CommentOrReply } from '@verdzie/server/admin/comment-reply/adminCommentReply.controller';
import { PostEntity } from '@verdzie/server/post/post.entity';

interface CommentRepliesResponse {
  comment: CommentEntity;
  replies: ReplyEntity[];
}

@Injectable()
export class AdminCommentReplyService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private feedService: FeedService,
    private postService: PostService,
    private commentService: CommentService,
    private replyService: ReplyService
  ) {
    this.logger = this.logger.child({ context: 'AdminCommentReplyService' });
  }

  async getCommentReplies(
    id: string
  ): Promise<CommentRepliesResponse[] | undefined> {
    const commentFeed = await this.feedService.find(id);
    if (!commentFeed) return undefined;
    const comments = await this.commentService.findByIds(commentFeed.page.ids, {
      withAuthor: true,
    });
    if (!comments) return undefined;
    const commentReplies: CommentRepliesResponse[] = [];
    for (const comment of comments) {
      if (!comment.replyFeedId) continue;
      const replyFeed = await this.feedService.find(comment.replyFeedId);
      if (!replyFeed) continue;
      const repliesResponse = await this.replyService.findByIds(
        replyFeed.page.ids
      );
      if (!comment.replyFeedId) continue;
      const replies: ReplyEntity[] = repliesResponse.filter(
        (e): e is ReplyEntity => !!e
      );
      commentReplies.push({ comment, replies });
    }
    return commentReplies.filter((e): e is CommentRepliesResponse => !!e);
  }

  async getPost(
    commentOrReply: CommentOrReply,
    id: string
  ): Promise<PostEntity | undefined> {
    switch (commentOrReply) {
      case CommentOrReply.REPLY:
        const reply = await this.replyService.findByIdWithCommentRelation(id);
        if (!reply) return undefined;
        const postFromReply = await this.postService.findById(
          reply.comment.postId!
        );
        if (!postFromReply) return undefined;
        return this.postService.parseUrls(postFromReply);
      case CommentOrReply.COMMENT:
        const comment = await this.commentService.findById(id);
        if (!comment) return undefined;
        if (!comment.postId) return undefined;
        const postFromComment = await this.postService.findById(comment.postId);
        if (!postFromComment) return undefined;
        return this.postService.parseUrls(postFromComment);
    }
  }

  async takeDownComment(id: string): Promise<boolean> {
    return await this.commentService.takeDown(id);
  }

  async respawnComment(id: string): Promise<boolean> {
    return await this.commentService.respawn(id);
  }

  async takeDownReply(id: string): Promise<boolean> {
    return await this.replyService.takeDown(id);
  }

  async respawnReply(id: string): Promise<boolean> {
    return await this.replyService.respawn(id);
  }
}
