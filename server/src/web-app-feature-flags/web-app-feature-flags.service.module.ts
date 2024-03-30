import { Module } from '@nestjs/common';
import { WebAppFeatureFlagsService } from '@verdzie/server/web-app-feature-flags/web-app-feature-flags.service';

@Module({
  providers: [WebAppFeatureFlagsService],
  exports: [WebAppFeatureFlagsService],
})
export class WebAppFeatureFlagsServiceModule {}
