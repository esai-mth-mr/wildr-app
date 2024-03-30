import { Module } from '@nestjs/common';
import { OSIndexingAggregatorService } from '@verdzie/server/open-search-v2/indexing-aggregator/indexing-aggregator.service';
import { OSIndexingWorkerModule } from '@verdzie/server/worker/open-search-indexing/open-search-indexing.module';

@Module({
  imports: [OSIndexingWorkerModule],
  providers: [OSIndexingAggregatorService],
  exports: [OSIndexingAggregatorService],
})
export class OSIndexingAggregatorModule {}
