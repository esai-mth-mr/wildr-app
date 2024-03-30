import { Logger } from 'winston';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import { AWSError, S3 } from 'aws-sdk';

export class MoveS3FilesService {
  sourceS3Client: S3;
  destinationS3Client: S3;
  sourceBucketName: string;
  destinationBucketName: string;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'MoveS3FilesService' });
    this.sourceBucketName =
      SSMParamsService.Instance.s3Params.AWS_S3_UPLOAD_BUCKET_NAME!;
    this.destinationBucketName =
      SSMParamsService.Instance.s3Params.AWS_S3_PVT_UPLOAD_BUCKET_NAME!;
    this.sourceS3Client = new S3({
      region: process.env.AWS_REGION,
    });
    this.destinationS3Client = new S3({
      region: process.env.AWS_REGION,
    });
  }

  async moveObjects(objectName: string) {
    this.sourceS3Client.getObject(
      {
        Bucket: this.sourceBucketName,
        Key: objectName,
      },
      this.onDownloaded
    );
  }

  async onDownloaded(err: AWSError, res: S3.Types.GetObjectOutput) {
    if (err === null) {
      const body = res.Body;
      await this.destinationS3Client.upload({
        Bucket: this.destinationBucketName,
        Body: body,
        Key: 'd',
      });
      await this.sourceS3Client.deleteObject({
        Bucket: this.sourceBucketName,
        Key: '',
      });
    } else {
      this.logger.error(err);
    }
  }
}
