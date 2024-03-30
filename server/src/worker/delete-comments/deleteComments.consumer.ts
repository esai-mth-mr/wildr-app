import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { CommentEntity } from '../../comment/comment.entity';
import { CommentService } from '../../comment/comment.service';
import { FeedService } from '../../feed/feed.service';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { DeleteRepliesProducer } from '../delete-replies/deleteReplies.producer';
import { DeleteCommentsJob } from './deleteComments.producer';

const BATCH_SIZE = 10;

@Processor('delete-comments-queue')
export class DeleteCommentsConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private commentService: CommentService,
    private feedService: FeedService,
    private deleteRepliesWorker: DeleteRepliesProducer
  ) {
    console.info('DeleteCommentsConsumer created');
    this.logger = this.logger.child({ context: 'DeleteCommentsConsumer' });
  }

  @Process('delete-comments-job')
  async deleteComments(job: Job<DeleteCommentsJob>) {
    let comments: CommentEntity[];
    if (job.data.ids) {
      this.logger.info('Deleting Comments, found ids', {
        length: job.data.ids.length,
      });
      comments = await this.commentService.findByIds(job.data.ids);
    } else {
      this.logger.info('Deleting Comments, found comments', {
        length: job.data.comments?.length,
      });
      comments = job.data.comments ?? [];
    }
    for (const comment of comments) {
      await this.deleteComment(comment);
    }
  }

  async deleteComment(comment: CommentEntity) {
    this.logger.debug('deleteComment()', {
      id: comment.id,
      hasRequestedForRepliesDeletion: comment.hasRequestedForRepliesDeletion,
    });
    if (comment.hasRequestedForRepliesDeletion) {
      const replyFeed = await this.feedService.find(comment.replyFeedId);
      await this.commentService.hardDelete(comment);
      this.logger.debug(' Comment deleted');
      if (replyFeed) {
        await this.feedService.deleteEntity(replyFeed);
        this.logger.debug(' Reply feed deleted');
      }
      return;
    }
    await this.deleteReplyFeed(comment);
  }
  async deleteReplyFeed(comment: CommentEntity) {
    this.logger.debug('Deleting reply feed', { commentId: comment.id });
    // - Delete Replies Feed
    const replyFeed = await this.feedService.find(comment.replyFeedId);
    if (replyFeed) {
      const ids = replyFeed.page.ids;
      for (let index = 0; index < ids.length; index += BATCH_SIZE) {
        this.logger.debug('Adding a batch to delete replies');
        await this.deleteRepliesWorker.deleteReplies({
          ids: ids.slice(index, index + BATCH_SIZE),
        });
      }
    }
    await this.commentService.update(comment.id, {
      hasRequestedForRepliesDeletion: true,
      willBeDeleted: true,
    });
    this.logger.debug(
      'Requested for replies deletion, will delete this comment the next time',
      {
        hasRequestedForRepliesDeletion: comment.hasRequestedForRepliesDeletion,
      }
    );
  }
}
