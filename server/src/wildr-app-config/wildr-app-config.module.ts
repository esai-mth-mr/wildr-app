import { Module } from '@nestjs/common';
import { WildrAppConfigService } from '@verdzie/server/wildr-app-config/wildr-app-config.service';
import { WildrAppConfigResolver } from '@verdzie/server/wildr-app-config/wildr-app-config.resolver';

@Module({
  imports: [],
  providers: [WildrAppConfigService, WildrAppConfigResolver],
  exports: [WildrAppConfigService, WildrAppConfigResolver],
})
export class WildrAppConfigModule {}
