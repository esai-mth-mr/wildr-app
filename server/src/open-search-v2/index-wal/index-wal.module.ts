import { Module } from '@nestjs/common';
import { OSIndexWALService } from '@verdzie/server/open-search-v2/index-wal/index-wal.service';

@Module({
  providers: [OSIndexWALService],
  exports: [OSIndexWALService],
})
export class OSIndexWALModule {}
