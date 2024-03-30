import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  OSIndexingServiceProducer,
  OPEN_SEARCH_INDEXING_QUEUE_NAME,
} from '@verdzie/server/worker/open-search-indexing/open-search-indexing.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: OPEN_SEARCH_INDEXING_QUEUE_NAME,
    }),
  ],
  providers: [OSIndexingServiceProducer],
  exports: [OSIndexingServiceProducer],
})
export class OSIndexingWorkerModule {}
