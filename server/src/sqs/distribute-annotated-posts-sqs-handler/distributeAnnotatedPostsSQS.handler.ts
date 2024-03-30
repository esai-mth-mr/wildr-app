import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SqsConsumerEventHandler, SqsMessageHandler } from '@ssut/nestjs-sqs';
import AWS from 'aws-sdk';
import { PrepareAnnotatedPostsDistributionProducer } from '@verdzie/server/worker/prepare-annotated-posts-distribution/prepareAnnotatedPostsDistribution.producer';

export class DistributeAnnotatedPostsSQSHandler {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly distributionWorker: PrepareAnnotatedPostsDistributionProducer
  ) {
    this.logger = this.logger.child({
      context: 'DistributeAnnotatedPostsSQSHandler',
    });
    if ((process.env.SQS_DISTRB_ANOTD_POSTS_QUEUE_NAME ?? '') === '') {
      throw new Error('SQS_DISTRB_ANOTD_POSTS_QUEUE_NAME must be specified');
    }
    if ((process.env.SQS_DISTRB_ANOTD_POSTS_QUEUE_URL ?? '') === '') {
      throw new Error('SQS_DISTRB_ANOTD_POSTS_QUEUE_URL must be specified');
    }
  }

  @SqsMessageHandler(process.env.SQS_DISTRB_ANOTD_POSTS_QUEUE_NAME ?? '', false)
  public async handleMessage(message: AWS.SQS.Message) {
    this.logger.info('received message to distribute annotated posts ', {
      ...message,
    });
    this.distributionWorker.prepareAnnotatedPostsDistribution({});
  }

  @SqsConsumerEventHandler(
    process.env.SQS_DISTRB_ANOTD_POSTS_QUEUE_NAME ?? '',
    'processing_error'
  )
  public onProcessingError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('received error: ', { error: error });
    this.logger.error('...message: ', { ...message });
  }

  @SqsConsumerEventHandler(
    process.env.SQS_DISTRB_ANOTD_POSTS_QUEUE_NAME ?? '',
    'error'
  )
  public onError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('onError: ', { error: error });
    this.logger.error('...message: ', { ...message });
  }

  @SqsConsumerEventHandler(
    process.env.SQS_DELETE_COMMENTS_QUEUE_NAME ?? '',
    'timeout_error'
  )
  public onTimeoutError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('onTimeoutError: ', { error: error });
    this.logger.error('...message: ', { ...message });
  }
}
