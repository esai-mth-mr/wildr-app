import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { SqsTimepointRecipientDistributionHandler } from '@verdzie/server/sqs/sqs-timepoint-recipient-distribution-handler/sqs-timepoint-recipient-distribution.handler';
import { TimepointRecipientDistributionProducerModule } from '@verdzie/server/worker/timepoint-recipient-distribution/timepoint-recipient-distribution-producer.module';

@Module({
  imports: [
    TimepointRecipientDistributionProducerModule,
    SqsModule.register({
      consumers: [
        {
          name:
            process.env.SQS_TIMEPOINT_RECIPIENT_DISTRIBUTION_QUEUE_NAME ?? '',
          queueUrl:
            process.env.SQS_TIMEPOINT_RECIPIENT_DISTRIBUTION_QUEUE_URL ?? '',
        },
      ],
    }),
  ],
  providers: [SqsTimepointRecipientDistributionHandler],
  exports: [SqsTimepointRecipientDistributionHandler],
})
export class SQSTimepointRecipientDistributionHandlerModule {}
