import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DistributeAnnotatedPostProducer } from '@verdzie/server/worker/distribute-annotated-post/distributeAnnotatedPost.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'distribute-annotated-posts-queue',
    }),
  ],
  providers: [DistributeAnnotatedPostProducer],
  exports: [DistributeAnnotatedPostProducer],
})
export class DistributeAnnotatedPostModule {}
