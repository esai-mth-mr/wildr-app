import { Module } from '@nestjs/common';
import { OSIndexVersionModule } from '@verdzie/server/open-search-v2/index-version/index-version-service.module';
import { OSIndexWALModule } from '@verdzie/server/open-search-v2/index-wal/index-wal.module';
import { OSIndexingService } from '@verdzie/server/open-search-v2/indexing/indexing.service';
import { OpenSearchClient } from '@verdzie/server/open-search-v2/open-search.client';
import { OSIncrementalIndexStateModule } from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.module';
import { OSReIndexStateWorkerModule } from '@verdzie/server/worker/open-search-re-index-state/open-search-re-index-state.module';

@Module({
  imports: [
    OSIndexVersionModule,
    OSIncrementalIndexStateModule,
    OSReIndexStateWorkerModule,
    OSIndexWALModule,
  ],
  providers: [OSIndexingService, OpenSearchClient],
  exports: [OSIndexingService],
})
export class OSIndexingModule {}
