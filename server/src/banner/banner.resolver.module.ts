import { Module } from '@nestjs/common';
import { BannerResolver } from '@verdzie/server/banner/banner.resolver';
import { BannerServiceModule } from '@verdzie/server/banner/banner.service.module';
import { BannerTransporterModule } from '@verdzie/server/banner/banner.transporter.module';

@Module({
  imports: [BannerTransporterModule, BannerServiceModule],
  providers: [BannerResolver],
  exports: [BannerResolver],
})
export class BannerResolverModule {}
