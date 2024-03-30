import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  OPEN_SEARCH_INCREMENTAL_INDEX_STATE_QUEUE_NAME,
  OSIncrementalIndexStateProducer,
} from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: OPEN_SEARCH_INCREMENTAL_INDEX_STATE_QUEUE_NAME,
    }),
  ],
  providers: [OSIncrementalIndexStateProducer],
  exports: [OSIncrementalIndexStateProducer],
})
export class OSIncrementalIndexStateModule {}
