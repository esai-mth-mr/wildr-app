import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { SuspensionProducer } from './suspension.producer';
import { SqsCronSuspensionHandler } from '../../sqs/suspension-sqs-handler/sqsCronSuspension.handler';

@Module({
  imports: [
    SqsModule.register({
      consumers: [
        {
          name: process.env.SQS_CRON_SUSPENSION_QUEUE_NAME ?? '',
          queueUrl: process.env.SQS_CRON_SUSPENSION_QUEUE_URL,
        },
      ],
    }),

    BullModule.registerQueue({
      name: 'lift-suspension-queue',
    }),
  ],
  providers: [SuspensionProducer, SqsCronSuspensionHandler],
  exports: [SuspensionProducer],
})
export class SuspensionModule {}
