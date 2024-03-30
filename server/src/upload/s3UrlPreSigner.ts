import { S3Client } from '@aws-sdk/client-s3';
import { Hash } from '@aws-sdk/hash-node';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner';
import { parseUrl } from '@aws-sdk/url-parser';
import { formatUrl } from '@aws-sdk/util-format-url';
import { Inject } from '@nestjs/common';
import { minutesToSeconds } from 'date-fns';
import subSeconds from 'date-fns/subSeconds';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SSMParamsService } from '../ssm-params/ssm-params.service';
import {
  DebugData,
  InternalServerErrorException,
  InternalServerErrorExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';
import { Result, err, ok } from 'neverthrow';

export class S3UrlPreSigner {
  s3Client: S3Client;
  s3UrlPreSigner: S3RequestPresigner;
  bucket: string;
  region: string;
  expirySeconds: number;
  signingDateStartSeconds: number;
  s3Domains: string[];

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    if (
      process.env.UPLOAD_CLIENT?.toLowerCase() === 's3' &&
      SSMParamsService.Instance.s3Params.AWS_S3_UPLOAD_BUCKET_NAME &&
      process.env.AWS_REGION
    ) {
      this.region = process.env.AWS_REGION;
      this.bucket =
        SSMParamsService.Instance.s3Params.AWS_S3_UPLOAD_BUCKET_NAME;
      this.s3Domains = [
        `${this.bucket}.s3.${this.region}.amazonaws.com`,
        `s3.${this.region}.amazonaws.com`,
      ];
      this.s3Client = new S3Client({
        region: this.region,
      });
      this.s3UrlPreSigner = new S3RequestPresigner({
        ...this.s3Client.config,
        sha256: Hash.bind(null, 'sha256'),
      });
      this.logger.info('S3UrlUrlPresigner initialized for S3');
    } else {
      // @ts-ignore
      this.s3UrlPreSigner = {
        presign: url => Promise.resolve(url),
      };
      this.logger.warn(
        'Unable to initialize S3UrlPresigner, params not provided'
      );
    }
    const expiresInput =
      parseInt(process?.env?.AWS_S3_URL_EXPIRY_SECONDS ?? '') ?? 0;
    this.expirySeconds = expiresInput > 0 ? expiresInput : minutesToSeconds(30);
    const signingStartInput = parseInt(
      process?.env?.AWS_S3_URL_START_SECONDS ?? ''
    );
    this.signingDateStartSeconds =
      signingStartInput > 0 ? signingStartInput : minutesToSeconds(5);
  }

  async presign(url: string): Promise<string> {
    if (!this.s3Client) return Promise.resolve(url);
    try {
      const s3ObjectUrl = parseUrl(url);
      if (!s3ObjectUrl) return url;
      if (!this.s3Domains.find(x => x === s3ObjectUrl.hostname)) {
        return url;
      }
      const presigner = new S3RequestPresigner({
        ...this.s3Client.config,
        sha256: Hash.bind(null, 'sha256'),
      });
      return presigner
        .presign(new HttpRequest(s3ObjectUrl), {
          expiresIn: this.expirySeconds,
          signingDate: subSeconds(new Date(), this.signingDateStartSeconds),
        })
        .then(req => formatUrl(req));
    } catch (e) {
      return '';
    }
  }

  async presignS3UrlResult({
    s3Path,
  }: {
    s3Path: string;
  }): Promise<Result<string, S3PresignException>> {
    const context = {
      methodName: S3UrlPreSigner.prototype.presignS3UrlResult.name,
      url: s3Path,
    };
    try {
      const s3ObjectUrl = parseUrl(s3Path);
      if (!this.s3Domains.find(domain => domain === s3ObjectUrl.hostname)) {
        return ok(s3Path);
      }
      const signedRequest = await this.s3UrlPreSigner.presign(
        new HttpRequest(s3ObjectUrl),
        {
          expiresIn: this.expirySeconds,
          signingDate: subSeconds(new Date(), this.signingDateStartSeconds),
        }
      );
      const formattedUrl = formatUrl(signedRequest);
      return ok(formattedUrl);
    } catch (error) {
      this.logger.error('failed to presign S3 url', {
        error,
        ...context,
      });
      return err(new S3PresignException({ error, ...context }));
    }
  }
}

export class S3PresignException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes> = {}) {
    super('failed to presign S3 url', {
      code: InternalServerErrorExceptionCodes.S3_URL_PRESIGN_FAILED,
      debugData,
    });
  }
}
