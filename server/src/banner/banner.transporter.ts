import { Inject, Injectable } from '@nestjs/common';
import { BannerEntity } from '@verdzie/server/banner/banner.entity';
import { getImageType } from '@verdzie/server/common';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { Banner } from '@verdzie/server/generated-graphql';
import { S3UrlPreSigner } from '@verdzie/server/upload/s3UrlPreSigner';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Logger } from 'winston';

@Injectable()
export class BannerTransporter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly s3UrlPreSigner: S3UrlPreSigner
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  async getGqlBannerFromBannerEntity({
    banner,
  }: {
    banner: BannerEntity;
  }): Promise<Result<Banner, InternalServerErrorException>> {
    const context = {
      methodName: BannerTransporter.prototype.getGqlBannerFromBannerEntity.name,
      bannerId: banner.id,
    };
    const bannerUrlResult = await this.s3UrlPreSigner.presignS3UrlResult({
      s3Path: banner.data.content.asset.path,
    });
    if (bannerUrlResult.isErr()) {
      this.logger.error('failed to presign s3 url', {
        ...context,
        error: bannerUrlResult.error,
      });
      return err(bannerUrlResult.error);
    }
    return ok({
      __typename: 'Banner',
      id: banner.id,
      title: banner.data.content.title,
      description: banner.data.content.description,
      cta: banner.data.content.cta,
      asset: {
        __typename: 'Image',
        id: banner.data.content.asset.id,
        source: {
          __typename: 'MediaSource',
          uri: bannerUrlResult.value,
        },
        type: getImageType(banner.data.content.asset.type),
      },
      route: banner.data.content.route,
    });
  }
}
