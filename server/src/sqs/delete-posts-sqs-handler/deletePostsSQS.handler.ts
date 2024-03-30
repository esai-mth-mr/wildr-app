import { Inject, Injectable } from '@nestjs/common';
import { SqsConsumerEventHandler, SqsMessageHandler } from '@ssut/nestjs-sqs';
import { PostService } from '../../post/post.service';
import { DeletePostsProducer } from '../../worker/delete-posts/deletePosts.producer';
import AWS from 'aws-sdk';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class DeletePostsSQSHandler {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private postService: PostService,
    private deletePostWorker: DeletePostsProducer
  ) {
    this.logger = this.logger.child({ context: 'DeletePostSQSHandler' });
    if ((process.env.SQS_DELETE_POSTS_QUEUE_NAME ?? '') === '') {
      throw new Error('SQS_DELETE_POSTS_QUEUE_NAME must be specified');
    }
    if ((process.env.SQS_DELETE_POSTS_QUEUE_URL ?? '') === '') {
      throw new Error('SQS_DELETE_POSTS_QUEUE_URL must be specified');
    }
  }

  @SqsMessageHandler(
    /** name: */ process.env.SQS_DELETE_POSTS_QUEUE_NAME ?? '',
    /** batch: */ false
  )
  public async handleMessage(message: AWS.SQS.Message) {
    this.logger.info('received sqs cron message to delete posts: ', {
      ...message,
    });
    await this.addWorkerTask();
  }

  private async addWorkerTask() {
    try {
      const posts = await this.postService.getWillBeDeletedPosts();
      if (posts.length > 0) {
        this.logger.info('Adding Posts for deletion');
        await this.deletePostWorker.deletePosts({ posts });
      }
    } catch (err) {
      this.logger.error(err);
    }
  }

  @SqsConsumerEventHandler(
    /** name: */ process.env.SQS_DELETE_POSTS_QUEUE_NAME ?? '',
    /** eventName: */ 'processing_error'
  )
  public onProcessingError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('received error: ', { error: error });
    this.logger.error('...message: ', { ...message });
  }

  @SqsConsumerEventHandler(
    /** name: */ process.env.SQS_DELETE_POSTS_QUEUE_NAME ?? '',
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
