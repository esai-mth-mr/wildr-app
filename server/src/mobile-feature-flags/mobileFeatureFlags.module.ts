import { Module } from '@nestjs/common';
import { MobileFeatureFlagsResolver } from '@verdzie/server/mobile-feature-flags/mobileFeatureFlags.resolver';
import { MobileFeatureFlagsService } from '@verdzie/server/mobile-feature-flags/mobileFeatureFlags.service';

@Module({
  providers: [MobileFeatureFlagsResolver, MobileFeatureFlagsService],
})
export class MobileFeatureFlagsModule {}
