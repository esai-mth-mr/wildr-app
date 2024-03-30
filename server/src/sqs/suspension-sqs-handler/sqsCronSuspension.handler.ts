import { Inject, Injectable } from '@nestjs/common';
import { SqsConsumerEventHandler, SqsMessageHandler } from '@ssut/nestjs-sqs';
import {
  SuspensionOperation,
  SuspensionScope,
} from '../../request-resposne/suspension-request-response';
import { SuspensionProducer } from '../../worker/suspension/suspension.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class SqsCronSuspensionHandler {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private suspensionWorker: SuspensionProducer
  ) {
    this.logger = this.logger.child({ context: 'SqsCronSuspensionHandler' });
    if ((process.env.SQS_CRON_SUSPENSION_QUEUE_NAME ?? '') === '') {
      this.logger.error(
        'SQS_CRON_SUSPENSION_QUEUE_NAME not specified, will not handle cron suspension messages'
      );
      throw new Error('SQS_CRON_SUSPENSION_QUEUE_NAME must be specified');
    }
    if ((process.env.SQS_CRON_SUSPENSION_QUEUE_URL ?? '') === '') {
      this.logger.error(
        'SQS_CRON_SUSPENSION_QUEUE_URL not specified, will not handle cron suspension messages'
      );
      throw new Error('SQS_CRON_SUSPENSION_QUEUE_URL must be specified');
    }
  }

  @SqsMessageHandler(
    process.env.SQS_CRON_SUSPENSION_QUEUE_NAME ?? '',
    /** batch: */ false
  )
  public async handleMessage(message: AWS.SQS.Message) {
    this.logger.info(
      'received sqs cron message to begin lifting suspensions: ',
      { ...message }
    );
    if (message.Body) {
      await this.suspensionWorker.startSuspensionProcess(
        JSON.parse(message.Body)
      );
    } else {
      await this.suspensionWorker.startSuspensionProcess({
        scope: SuspensionScope.ALL,
        operation: SuspensionOperation.REMOVE,
      });
    }
    this.logger.info('started lifting suspensions');
  }

  @SqsConsumerEventHandler(
    process.env.SQS_CRON_SUSPENSION_QUEUE_NAME ?? '',
    'processing_error'
  )
  public onProcessingError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('received error message: ', { error: error, ...message });
  }

  @SqsConsumerEventHandler(
    process.env.SQS_CRON_SUSPENSION_QUEUE_NAME ?? '',
    'error'
  )
  public onError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('onError: ', { error: error, ...message });
  }
  @SqsConsumerEventHandler(
    process.env.SQS_CRON_SUSPENSION_QUEUE_NAME ?? '',
    'timeout_error'
  )
  public onTimeoutError(error: Error, message: AWS.SQS.Message) {
    this.logger.error('onTimeoutError: ', { error: error });
    this.logger.error('...message: ', { ...message });
  }
}
