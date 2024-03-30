import { Module } from '@nestjs/common';
import { BannerTransporter } from '@verdzie/server/banner/banner.transporter';
import { S3UrlPreSigner } from '@verdzie/server/upload/s3UrlPreSigner';

@Module({
  providers: [BannerTransporter, S3UrlPreSigner],
  exports: [BannerTransporter],
})
export class BannerTransporterModule {}
