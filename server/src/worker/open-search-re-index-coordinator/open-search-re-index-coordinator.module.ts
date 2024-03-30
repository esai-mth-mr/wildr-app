import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  OPEN_SEARCH_RE_INDEX_QUEUE_NAME,
  OSReIndexCoordinatorProducer,
} from '@verdzie/server/worker/open-search-re-index-coordinator/open-search-re-index-coordinator.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: OPEN_SEARCH_RE_INDEX_QUEUE_NAME,
    }),
  ],
  providers: [OSReIndexCoordinatorProducer],
  exports: [OSReIndexCoordinatorProducer],
})
export class OSReIndexCoordinatorWorkerModule {}
