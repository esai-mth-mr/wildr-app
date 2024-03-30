import { Inject, Injectable } from '@nestjs/common';
import { SqsConsumerEventHandler, SqsMessageHandler } from '@ssut/nestjs-sqs';
import { CommentEntity } from '../../comment/comment.entity';
import { CommentService } from '../../comment/comment.service';
import { DeleteCommentsProducer } from '../../worker/delete-comments/deleteComments.producer';
import AWS from 'aws-sdk';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class DeleteCommentsSQSHandler {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private commentService: CommentService,
    private deleteCommentsWorker: DeleteCommentsProducer
  ) {
    this.logger = this.logger.child({ context: 'DeleteCommentsSQSHandler' });
    if ((process.env.SQS_DELETE_COMMENTS_QUEUE_NAME ?? '') === '') {
      throw new Error('SQS_DELETE_COMMENTS_QUEUE_NAME must be specified');
    }
    if ((process.env.SQS_DELETE_COMMENTS_QUEUE_URL ?? '') === '') {
      throw new Error('SQS_DELETE_COMMENTS_QUEUE_URL must be specified');
    }
  }

  @SqsMessageHandler(process.env.SQS_DELETE_COMMENTS_QUEUE_NAME ?? '', false)
  public async handleMessage(message: AWS.SQS.Message) {
    this.logger.info('received sqs cron message to delete comments: ', {
      ...message,
    });
    await this.addWorkerTask();
  }

  private async addWorkerTask() {
    const comments: CommentEntity[] =
      await this.commentService.getWillBeDeletedComments();
    if (comments.length > 0) {
      this.logger.info('Adding Comments for deletion', {
        length: comments.length,
      });
      for (const comment of comments) {
        this.logger.debug(`${comment.id}`);
      }
      await this.deleteCommentsWorker.deleteComments({ comments });
    } else {
      this.logger.info('No comments found for deletion');
    }
  }

  @SqsConsumerEventHandler(
    /** name: */ process.env.SQS_DELETE_COMMENTS_QUEUE_NAME ?? '',
    /** eventName: */ 'processing_error'
  )
  public onProcessingError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('onProcessingError: ', { error: error, ...message });
  }

  @SqsConsumerEventHandler(
    /** name: */ process.env.SQS_DELETE_COMMENTS_QUEUE_NAME ?? '',
    /** eventName: */ 'error'
  )
  public onError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('onError: ', { error: error });
    this.logger.error('...message: ', { ...message });
  }

  @SqsConsumerEventHandler(
    /** name: */ process.env.SQS_DELETE_COMMENTS_QUEUE_NAME ?? '',
    /** eventName: */ 'timeout_error'
  )
  public onTimeoutError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('onTimeoutError: ', { error: error });
    this.logger.error('...message: ', { ...message });
  }
}
