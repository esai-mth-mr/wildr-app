import { Inject, Injectable } from '@nestjs/common';
import { PostVisibility } from '@verdzie/server/generated-graphql';
import { FileUpload } from 'graphql-upload';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UploadFile } from '../data/common';
import { SSMParamsService } from '../ssm-params/ssm-params.service';
import {
  LocalUploadClient,
  S3UploadClient,
  UploadClient,
} from './upload.client';

@Injectable()
export class UploadService {
  uploadClient: UploadClient;
  privateClient: UploadClient;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly loggerPvt: Logger
  ) {
    this.logger = this.logger.child({ context: 'UploadService.Public' });
    this.loggerPvt = this.loggerPvt.child({
      context: 'UploadService.Private',
    });
    if (
      process.env.UPLOAD_CLIENT &&
      process.env.UPLOAD_CLIENT.toLowerCase() === 's3' &&
      SSMParamsService.Instance.s3Params.AWS_S3_UPLOAD_BUCKET_NAME &&
      SSMParamsService.Instance.s3Params.AWS_S3_PVT_UPLOAD_BUCKET_NAME &&
      process.env.AWS_REGION
    ) {
      this.logger.info('Creating client');
      this.uploadClient = new S3UploadClient(
        this.logger,
        SSMParamsService.Instance.s3Params.AWS_S3_UPLOAD_BUCKET_NAME,
        process.env.AWS_REGION
      );
      this.loggerPvt.info('Creating client');
      this.privateClient = new S3UploadClient(
        this.loggerPvt,
        SSMParamsService.Instance.s3Params.AWS_S3_PVT_UPLOAD_BUCKET_NAME,
        process.env.AWS_REGION
      );
    } else {
      this.logger.info('Creating local upload client');
      this.uploadClient = new LocalUploadClient(this.logger);
    }
  }

  async uploadFile(
    upload: Promise<FileUpload>,
    visibility?: PostVisibility
  ): Promise<UploadFile> {
    if (visibility === PostVisibility.FOLLOWERS) {
      return this.privateClient.uploadFile(upload);
    }
    return this.uploadClient.uploadFile(upload);
  }
}
