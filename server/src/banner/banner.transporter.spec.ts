import { BannerTransporter } from '@verdzie/server/banner/banner.transporter';
import { BannerEntityFake } from '@verdzie/server/banner/testing/banner.entity.fake';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import {
  S3PresignException,
  S3UrlPreSigner,
} from '@verdzie/server/upload/s3UrlPreSigner';
import { err, ok } from 'neverthrow';

describe(BannerTransporter.name, () => {
  describe('getGqlBannerFromBannerEntity', () => {
    it('should return a gql banner object', async () => {
      const s3UrlPreSigner: Partial<S3UrlPreSigner> = {
        presignS3UrlResult: jest
          .fn()
          .mockResolvedValue(ok('http://example.com')),
      };
      const module = await createMockedTestingModule({
        providers: [
          BannerTransporter,
          {
            provide: S3UrlPreSigner,
            useValue: s3UrlPreSigner,
          },
        ],
      });
      const bannerTransporter =
        module.get<BannerTransporter>(BannerTransporter);
      const bannerEntity = BannerEntityFake();
      const result = await bannerTransporter.getGqlBannerFromBannerEntity({
        banner: bannerEntity,
      });
      expect(result.isOk()).toBe(true);
      const banner = result._unsafeUnwrap();
      expect(banner).toEqual({
        __typename: 'Banner',
        id: bannerEntity.id,
        title: bannerEntity.data.content.title,
        description: bannerEntity.data.content.description,
        cta: bannerEntity.data.content.cta,
        asset: {
          __typename: 'Image',
          id: bannerEntity.data.content.asset.id,
          source: {
            __typename: 'MediaSource',
            uri: 'http://example.com',
          },
          type: 'JPEG',
        },
        route: {
          __typename: 'WalletPageRoute',
          nestedRoute: {
            __typename: 'WalletTransactionNestedRoute',
            transactionId: expect.any(String),
          },
        },
      });
    });

    it('should return an error if the s3UrlPreSigner fails', async () => {
      const s3UrlPreSigner: Partial<S3UrlPreSigner> = {
        presignS3UrlResult: jest
          .fn()
          .mockResolvedValue(err(new S3PresignException())),
      };
      const module = await createMockedTestingModule({
        providers: [
          BannerTransporter,
          {
            provide: S3UrlPreSigner,
            useValue: s3UrlPreSigner,
          },
        ],
      });
      const bannerTransporter =
        module.get<BannerTransporter>(BannerTransporter);
      const bannerEntity = BannerEntityFake();
      const result = await bannerTransporter.getGqlBannerFromBannerEntity({
        banner: bannerEntity,
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(S3PresignException);
    });
  });
});
