import { Module } from '@nestjs/common';
import { WebAppFeatureFlagsResolver } from '@verdzie/server/web-app-feature-flags/web-app-feature-flags.resolver';
import { WebAppFeatureFlagsServiceModule } from '@verdzie/server/web-app-feature-flags/web-app-feature-flags.service.module';

@Module({
  imports: [WebAppFeatureFlagsServiceModule],
  providers: [WebAppFeatureFlagsResolver],
  exports: [WebAppFeatureFlagsResolver],
})
export class WebAppFeatureFlagsResolverModule {}
