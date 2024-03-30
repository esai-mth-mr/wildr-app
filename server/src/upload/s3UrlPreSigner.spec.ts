import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { S3UrlPreSigner } from './s3UrlPreSigner';

const TEST_BUCKET = process.env.AWS_S3_UPLOAD_BUCKET_NAME ?? '';

describe(S3UrlPreSigner.name, () => {
  describe(S3UrlPreSigner.prototype.presignS3UrlResult.name, () => {
    it('should return a presigned url', async () => {
      const module = await createMockedTestingModule({
        providers: [S3UrlPreSigner],
      });
      const s3UrlPreSigner = module.get<S3UrlPreSigner>(S3UrlPreSigner);
      s3UrlPreSigner.bucket = TEST_BUCKET;
      s3UrlPreSigner.s3UrlPreSigner.presign = jest
        .fn()
        .mockImplementation(async url => url);
      const result = await s3UrlPreSigner.presignS3UrlResult({
        s3Path: `https://${TEST_BUCKET}.s3.us-west-2.amazonaws.com/IMG_4360.mov`,
      });
      expect(result.isOk()).toBe(true);
      expect(s3UrlPreSigner.s3UrlPreSigner.presign).toHaveBeenCalled();
      const url = result._unsafeUnwrap();
      expect(url).toBe(
        `https://${TEST_BUCKET}.s3.us-west-2.amazonaws.com/IMG_4360.mov`
      );
    });

    it('should return an error if the presign fails', async () => {
      const module = await createMockedTestingModule({
        providers: [S3UrlPreSigner],
      });
      const s3UrlPreSigner = module.get<S3UrlPreSigner>(S3UrlPreSigner);
      s3UrlPreSigner.bucket = TEST_BUCKET;
      s3UrlPreSigner.s3UrlPreSigner.presign = jest
        .fn()
        .mockRejectedValue(new Error('aws is down'));
      const result = await s3UrlPreSigner.presignS3UrlResult({
        s3Path: `https://${TEST_BUCKET}.s3.us-west-2.amazonaws.com/IMG_4360.mov`,
      });
      expect(result.isErr()).toBe(true);
      expect(s3UrlPreSigner.s3UrlPreSigner.presign).toHaveBeenCalled();
    });

    it('should not sign a non-s3 url', async () => {
      const module = await createMockedTestingModule({
        providers: [S3UrlPreSigner],
      });
      const s3UrlPreSigner = module.get<S3UrlPreSigner>(S3UrlPreSigner);
      s3UrlPreSigner.bucket = TEST_BUCKET;
      s3UrlPreSigner.s3UrlPreSigner.presign = jest
        .fn()
        .mockImplementation(async url => url);
      const result = await s3UrlPreSigner.presignS3UrlResult({
        s3Path: `https://google.com`,
      });
      expect(result.isOk()).toBe(true);
      expect(s3UrlPreSigner.s3UrlPreSigner.presign).not.toHaveBeenCalled();
      const url = result._unsafeUnwrap();
      expect(url).toBe(`https://google.com`);
    });
  });
});
