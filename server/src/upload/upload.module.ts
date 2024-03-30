import { Module } from '@nestjs/common';
import { PvtS3UrlPresigner } from '@verdzie/server/upload/pvtS3UrlPresigner';
import { CDNPvtUrlSigner } from './CDNPvtUrlSigner';
import { S3UrlPreSigner } from './s3UrlPreSigner';
import { UploadService } from './upload.service';

@Module({
  imports: [],
  providers: [
    UploadService,
    S3UrlPreSigner,
    PvtS3UrlPresigner,
    CDNPvtUrlSigner,
  ],
  exports: [UploadService, S3UrlPreSigner, PvtS3UrlPresigner, CDNPvtUrlSigner],
})
export class UploadModule {}
