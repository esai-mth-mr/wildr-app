import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { LiftEmbargoProducer } from './liftEmbargo.producer';
import { SqsCronEmbargoHandler } from '../../sqs/embargo-sqs-handler/sqsCronEmbargo.handler';

@Module({
  imports: [
    SqsModule.register({
      consumers: [
        {
          name: process.env.SQS_CRON_EMBARGO_QUEUE_NAME ?? '',
          queueUrl: process.env.SQS_CRON_EMBARGO_QUEUE_URL,
        },
      ],
    }),

    BullModule.registerQueue({
      name: 'lift-embargo-queue',
    }),
  ],
  providers: [LiftEmbargoProducer, SqsCronEmbargoHandler],
  exports: [LiftEmbargoProducer],
})
export class LiftEmbargoWorkerModule {}
