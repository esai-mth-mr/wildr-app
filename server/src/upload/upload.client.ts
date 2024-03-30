import { FileUpload } from 'graphql-upload';
import { UploadFile } from '../data/common';
import { ReadStream } from 'fs-capacitor';
import { createWriteStream, unlink } from 'fs';
import { extension } from 'mime-types';
import { generateId } from '../common/generateId';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import { Logger } from 'winston';
import { WildrSpan } from '@verdzie/server/opentelemetry/openTelemetry.decorators';

export interface UploadClient {
  uploadFile: (upload: Promise<FileUpload>) => Promise<UploadFile>;
}

export class LocalUploadClient implements UploadClient {
  serverUrl: string;
  constructor(private readonly logger: Logger) {
    this.logger = this.logger.child({ context: 'LocalUploadClient' });
    this.serverUrl = `http://${process.env.SERVER_HTTP_HOST}:${process.env.SERVER_HTTP_PORT}`;
  }
  async uploadFile(upload: Promise<FileUpload>): Promise<UploadFile> {
    const result = await upload;
    const { mimetype, encoding, createReadStream } = result;
    this.logger.debug('Got file params: ', { mimetype, encoding });
    const stream: ReadStream = createReadStream();
    const id = generateId();
    const filename = `${id}.${extension(mimetype)}`;
    const path = `${this.serverUrl}/uploads/${filename}`;
    const localPath = `./uploads/${filename}`;
    const file: UploadFile = {
      __typename: 'UploadFile',
      id,
      filename,
      mimetype,
      encoding,
      path,
    };

    await new Promise((resolve, reject) => {
      const writeStream = createWriteStream(localPath);
      writeStream.on('finish', resolve);

      // If there's an error writing the file, remove the partially written file
      // and reject the promise.
      writeStream.on('error', error => {
        unlink(localPath, () => {
          reject(error);
        });
      });

      // In Node.js <= v13, errors are not automatically propagated between piped
      // streams. If there is an error receiving the upload, destroy the write
      // stream with the corresponding error.
      stream.on('error', error => writeStream.destroy(error));

      // Pipe the upload into the write stream.
      stream.pipe(writeStream);
    });
    return file;
  }
}

export class S3UploadClient implements UploadClient {
  s3Client: S3Client;
  bucketUrl: string;
  region: string;

  constructor(private readonly logger: Logger, bucket: string, region: string) {
    this.logger = this.logger.child({ context: 'S3UploadClient' });
    this.s3Client = new S3Client({
      region: region,
    });
    this.bucketUrl = bucket;
    this.region = region;
  }

  @WildrSpan()
  async uploadFile(upload: Promise<FileUpload>): Promise<UploadFile> {
    const id = generateId();
    const startedAt = new Date();
    this.logger.info('start upload file: ', { id, ts: startedAt });
    const result: FileUpload = await upload;
    const resultGotAt = new Date();
    this.logger.debug('getting result: ', {
      id,
      ts: resultGotAt,
      durationMs: resultGotAt.getTime() - startedAt.getTime(),
    });
    const { mimetype, encoding, createReadStream } = result;
    this.logger.info('got file params: ', { id, mimetype, encoding });
    const stream = createReadStream();
    const filename = `${id}.${extension(mimetype)}`;
    const uploadParams = {
      Key: filename,
      Bucket: this.bucketUrl,
      ContentType: mimetype,
      Body: stream,
    };
    const s3StartedAt = new Date();
    this.logger.info('started sending to S3: ', {
      id,
      ts: s3StartedAt,
      durationMs: resultGotAt.getTime() - startedAt.getTime(),
    });
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: uploadParams,
      });
      await upload.done();
    } catch (e) {
      // @ts-ignore
      this.logger.error('Unable to upload file to s3', { error: e['code'] });
      throw new Error('Cannot upload to s3');
    }
    const s3DoneAt = new Date();
    this.logger.info('finished sending to S3: ', {
      id,
      ts: s3DoneAt,
      durationMs: s3DoneAt.getTime() - s3StartedAt.getTime(),
      totalMs: s3DoneAt.getTime() - startedAt.getTime(),
    });
    return {
      __typename: 'UploadFile',
      id: id,
      filename: filename,
      mimetype: mimetype,
      encoding: encoding,
      path: `https://s3.${this.region}.amazonaws.com/${this.bucketUrl}/${filename}`,
    };
  }
}
