import { Inject, Injectable } from '@nestjs/common';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import { TimepointArchiverProducer } from '@verdzie/server/worker/timepoint-archiver/timepoint-archiver.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class SqsTimepointArchiverHandler {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly timepointArchiverProducer: TimepointArchiverProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @SqsMessageHandler(process.env.SQS_TIMEPOINT_ARCHIVER_QUEUE_NAME ?? '', false)
  async handleMessage(message: AWS.SQS.Message) {
    this.logger.info('[handleMessage] received sqs message: ', message);
    try {
      await this.timepointArchiverProducer.createTimepointArchiverOffsetJobs();
    } catch (error) {
      this.logger.error('[handleMessage] failed to create offset jobs', {
        error,
      });
    }
  }
}
