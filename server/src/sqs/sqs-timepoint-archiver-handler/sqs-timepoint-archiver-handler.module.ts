import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { SqsTimepointArchiverHandler } from '@verdzie/server/sqs/sqs-timepoint-archiver-handler/sqs-timepoint-archiver.handler';
import { TimepointArchiverProducerModule } from '@verdzie/server/worker/timepoint-archiver/timepoint-archiver-producer.module';

@Module({
  imports: [
    TimepointArchiverProducerModule,
    SqsModule.register({
      consumers: [
        {
          name: process.env.SQS_TIMEPOINT_ARCHIVER_QUEUE_NAME ?? '',
          queueUrl: process.env.SQS_TIMEPOINT_ARCHIVER_QUEUE_URL ?? '',
        },
      ],
    }),
  ],
  providers: [SqsTimepointArchiverHandler],
  exports: [SqsTimepointArchiverHandler],
})
export class SQSTimepointArchiverHandlerModule {}
