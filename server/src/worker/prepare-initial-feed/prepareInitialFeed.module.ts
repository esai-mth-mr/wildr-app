import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrepareInitialFeedProducer } from '@verdzie/server/worker/prepare-initial-feed/prepareInitialFeed.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'prepare-initial-feed-queue',
    }),
  ],
  providers: [PrepareInitialFeedProducer],
  exports: [PrepareInitialFeedProducer],
})
export class PrepareInitialFeedModule {}
