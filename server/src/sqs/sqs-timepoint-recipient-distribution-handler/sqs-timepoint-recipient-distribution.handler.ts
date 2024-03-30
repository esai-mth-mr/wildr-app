import { Inject, Injectable } from '@nestjs/common';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import { TimepointRecipientDistributionProducer } from '@verdzie/server/worker/timepoint-recipient-distribution/timepoint-recipient-distribution.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class SqsTimepointRecipientDistributionHandler {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly timepointRecipientDistributionProducer: TimepointRecipientDistributionProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @SqsMessageHandler(
    process.env.SQS_TIMEPOINT_RECIPIENT_DISTRIBUTION_QUEUE_NAME ?? '',
    false
  )
  async handleMessage(message: AWS.SQS.Message) {
    this.logger.info('[handleMessage] received sqs message: ', { ...message });
    try {
      await this.timepointRecipientDistributionProducer.createTimepointOffsetJobs();
    } catch (error) {
      this.logger.error('[handleMessage] failed to create offset jobs', {
        error,
      });
    }
  }
}
