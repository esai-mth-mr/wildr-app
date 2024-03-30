import { Module } from '@nestjs/common';
import { TrollDetectorModule } from '@verdzie/server/troll-detector/troll-detector.module';
import { TrollDetectorResolver } from '@verdzie/server/troll-detector/troll-detector.resolver';

@Module({
  imports: [TrollDetectorModule],
  providers: [TrollDetectorResolver],
  exports: [TrollDetectorResolver],
})
export class TrollDetectorResolverModule {}
