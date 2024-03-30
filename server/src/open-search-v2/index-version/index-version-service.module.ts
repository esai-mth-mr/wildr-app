import { Module } from '@nestjs/common';
import { IndexVersionConfiguration } from '@verdzie/server/open-search-v2/index-version/index-version.config';
import { IndexVersionService } from '@verdzie/server/open-search-v2/index-version/index-version.service';

@Module({
  providers: [IndexVersionService, IndexVersionConfiguration],
  exports: [IndexVersionService],
})
export class OSIndexVersionModule {}
