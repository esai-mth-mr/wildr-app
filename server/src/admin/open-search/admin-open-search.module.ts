import { Module } from '@nestjs/common';
import { AdminOpenSearchController } from '@verdzie/server/admin/open-search/admin-open-search.controller';
import { AdminOpenSearchService } from '@verdzie/server/admin/open-search/admin-open-search.service';
import { OSIndexingModule } from '@verdzie/server/open-search-v2/indexing/indexing.module';
import { OSReIndexCoordinatorWorkerModule } from '@verdzie/server/worker/open-search-re-index-coordinator/open-search-re-index-coordinator.module';

@Module({
  imports: [OSReIndexCoordinatorWorkerModule, OSIndexingModule],
  providers: [AdminOpenSearchService],
  controllers: [AdminOpenSearchController],
})
export class AdminOpenSearchModule {}
