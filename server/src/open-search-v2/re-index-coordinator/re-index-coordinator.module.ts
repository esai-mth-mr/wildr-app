import { Module } from '@nestjs/common';
import { OSReIndexCoordinatorService } from '@verdzie/server/open-search-v2/re-index-coordinator/re-index-coordinator.service';
import { OSReIndexCoordinatorWorkerModule } from '@verdzie/server/worker/open-search-re-index-coordinator/open-search-re-index-coordinator.module';
import { OSReIndexStateWorkerModule } from '@verdzie/server/worker/open-search-re-index-state/open-search-re-index-state.module';

@Module({
  imports: [OSReIndexCoordinatorWorkerModule, OSReIndexStateWorkerModule],
  providers: [OSReIndexCoordinatorService],
  exports: [OSReIndexCoordinatorService],
})
export class OSReIndexCoordinatorModule {}
