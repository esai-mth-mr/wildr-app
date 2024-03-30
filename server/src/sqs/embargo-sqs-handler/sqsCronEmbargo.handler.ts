import { Inject, Injectable } from '@nestjs/common';
import { SqsConsumerEventHandler, SqsMessageHandler } from '@ssut/nestjs-sqs';
import {
  EmbargoOperation,
  EmbargoScope,
} from '@verdzie/server/request-resposne/embargo-request-response';
import { LiftEmbargoProducer } from '@verdzie/server/worker/embago/liftEmbargo.producer';
import AWS from 'aws-sdk';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class SqsCronEmbargoHandler {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private liftEmbargoWorker: LiftEmbargoProducer
  ) {
    this.logger = this.logger.child({ context: 'SqsCronEmbargoHandler' });
    if ((process.env.SQS_CRON_EMBARGO_QUEUE_NAME ?? '') === '') {
      this.logger.error(
        'SQS_CRON_EMBARGO_QUEUE_NAME not specified, will not handle cron embargo messages'
      );
      throw new Error('SQS_CRON_EMBARGO_QUEUE_NAME must be specified');
    }
    if ((process.env.SQS_CRON_EMBARGO_QUEUE_URL ?? '') === '') {
      this.logger.error(
        'SQS_CRON_EMBARGO_QUEUE_URL not specified, will not handle cron embargo messages'
      );
      throw new Error('SQS_CRON_EMBARGO_QUEUE_URL must be specified');
    }
  }

  @SqsMessageHandler(
    process.env.SQS_CRON_EMBARGO_QUEUE_NAME ?? '',
    /** batch: */ false
  )
  public async handleMessage(message: AWS.SQS.Message) {
    this.logger.info('received sqs cron message to begin lifting embargo: ', {
      ...message,
    });
    if (message.Body) {
      await this.liftEmbargoWorker.startLiftEmbargoProcess(
        JSON.parse(message.Body)
      );
    } else {
      await this.liftEmbargoWorker.startLiftEmbargoProcess({
        scope: EmbargoScope.ALL,
        operation: EmbargoOperation.REMOVE,
      });
    }
    this.logger.info('started lifting embargo');
  }
  @SqsConsumerEventHandler(
    process.env.SQS_CRON_EMBARGO_QUEUE_NAME ?? '',
    'processing_error'
  )
  public onProcessingError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('onProcessingError ', { error: error, ...message });
  }
  @SqsConsumerEventHandler(
    process.env.SQS_CRON_EMBARGO_QUEUE_NAME ?? '',
    'error'
  )
  public onError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('onError: ', { error: error, ...message });
  }
  @SqsConsumerEventHandler(
    process.env.SQS_CRON_EMBARGO_QUEUE_NAME ?? '',
    'timeout_error'
  )
  public onTimeoutError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('onTimeoutError: ', { error: error });
    this.logger.error('...message: ', { ...message });
  }
}
