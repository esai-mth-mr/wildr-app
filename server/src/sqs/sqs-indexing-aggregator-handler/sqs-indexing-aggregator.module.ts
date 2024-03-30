import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { OSIndexingAggregatorModule } from '@verdzie/server/open-search-v2/indexing-aggregator/indexing-aggregator.module';
import { SqsIndexingAggregatorHandler } from '@verdzie/server/sqs/sqs-indexing-aggregator-handler/sqs-indexing-aggregator.handler';

@Module({
  imports: [
    OSIndexingAggregatorModule,
    SqsModule.register({
      consumers: [
        {
          name: process.env.SQS_INDEXING_AGGREGATOR_QUEUE_NAME ?? '',
          queueUrl: process.env.SQS_INDEXING_AGGREGATOR_QUEUE_URL ?? '',
        },
      ],
    }),
  ],
  providers: [SqsIndexingAggregatorHandler],
  exports: [SqsIndexingAggregatorHandler],
})
export class SQSIndexingAggregatorModule {}
