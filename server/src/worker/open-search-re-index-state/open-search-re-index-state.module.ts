import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  OPEN_SEARCH_RE_INDEX_STATE_QUEUE_NAME,
  OSReIndexStateProducer,
} from '@verdzie/server/worker/open-search-re-index-state/open-search-re-index-state.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: OPEN_SEARCH_RE_INDEX_STATE_QUEUE_NAME,
    }),
  ],
  providers: [OSReIndexStateProducer],
  exports: [OSReIndexStateProducer],
})
export class OSReIndexStateWorkerModule {}
