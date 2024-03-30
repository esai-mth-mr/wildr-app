import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannerSchema } from '@verdzie/server/banner/banner.schema';
import { BannerService } from '@verdzie/server/banner/banner.service';

@Module({
  imports: [TypeOrmModule.forFeature([BannerSchema])],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerServiceModule {}
