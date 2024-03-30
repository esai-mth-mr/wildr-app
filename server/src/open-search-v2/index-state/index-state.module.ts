import { Module } from '@nestjs/common';
import { OSIndexStateService } from '@verdzie/server/open-search-v2/index-state/index-state.service';
import { OSIndexVersionModule } from '@verdzie/server/open-search-v2/index-version/index-version-service.module';

@Module({
  imports: [OSIndexVersionModule],
  providers: [OSIndexStateService],
  exports: [OSIndexStateService],
})
export class OSIndexStateModule {}
