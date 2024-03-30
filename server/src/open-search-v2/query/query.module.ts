import { Module } from '@nestjs/common';
import { OSIndexVersionModule } from '@verdzie/server/open-search-v2/index-version/index-version-service.module';
import { OpenSearchClient } from '@verdzie/server/open-search-v2/open-search.client';
import { OSQueryService } from '@verdzie/server/open-search-v2/query/query.service';

@Module({
  imports: [OSIndexVersionModule],
  providers: [OpenSearchClient, OSQueryService],
  exports: [OSQueryService],
})
export class OSQueryModule {}
