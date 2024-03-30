import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { DistributeAnnotatedPostsSQSHandler } from '@verdzie/server/sqs/distribute-annotated-posts-sqs-handler/distributeAnnotatedPostsSQS.handler';
import { PrepareAnnotatedPostsDistributionModule } from '@verdzie/server/worker/prepare-annotated-posts-distribution/prepareAnnotatedPostsDistribution.module';

@Module({
  imports: [
    PrepareAnnotatedPostsDistributionModule,
    SqsModule.register({
      consumers: [
        {
          name: process.env.SQS_DISTRB_ANOTD_POSTS_QUEUE_NAME ?? '',
          queueUrl: process.env.SQS_DISTRB_ANOTD_POSTS_QUEUE_URL,
        },
      ],
    }),
  ],
  providers: [DistributeAnnotatedPostsSQSHandler],
  exports: [DistributeAnnotatedPostsSQSHandler],
})
export class DistributeAnnotatedPostsSQSModule {}
