import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'; // ES Modules import
import { Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import {
  ACLParamsDefaults,
  ACLParamsDto,
} from '@verdzie/server/ssm-params/dto/acl-params.dto';
import {
  BannerParamsDto,
  LocalBannerParamsDto,
  ProdBannerParamsDto,
} from '@verdzie/server/ssm-params/dto/banner-params.dto';
import { MobileFeatureFlags } from '@verdzie/server/ssm-params/dto/mobile-featureflags';
import {
  LocalOpenSearchParamsDto,
  OpenSearchParamsDto,
} from '@verdzie/server/ssm-params/dto/open-search-params.dto';
import {
  LocalWebAppFeatureFlagsDto,
  ProdWebAppFeatureFlagsDto,
  WebAppFeatureFlagsDto,
} from '@verdzie/server/ssm-params/dto/web-app-feature-flags.dto';
import {
  BadSSMParamException,
  SSMParamNotFoundException,
} from '@verdzie/server/ssm-params/ssm-params.errors';
import { validate } from 'class-validator';
import { compareVersions } from 'compare-versions';
import { Result, err, ok } from 'neverthrow';
import winston from 'winston';
import { getLogger } from '../winstonBeanstalk.module';

type Constructor<T> = { new (...args: any[]): T };

@Injectable()
export class SSMParamsService {
  private logger: winston.Logger;
  private readonly client: SSMClient;
  private readonly env: string | undefined;
  s3Params: S3Params;
  firebaseParams: FirebaseParams;
  mailGunParams: MailGunParams;
  openSearchParams: OpenSearchParamsDto;
  mobileVersionToFeatureFlagsMap: Map<string, MobileFeatureFlags>;
  initializedParams = 0;
  aclParams: ACLParamsDto;
  bannerParams: BannerParamsDto;
  webAppFeatureFlags: WebAppFeatureFlagsDto;
  static _instance = new SSMParamsService();

  constructor() {
    const logger = getLogger();
    this.logger = logger.child({
      context: this.constructor.name,
      level: process.env.NODE_ENV === 'test' ? 'error' : 'debug',
    });
    this.client = new SSMClient({
      region: process.env.AWS_REGION ?? 'us-west-2',
    });
    if (SSMParamsService._instance) {
      throw new Error(
        'Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.'
      );
    }
    SSMParamsService._instance = this;
    this.env = process.env.NODE_ENV;
  }

  public static get Instance() {
    // Do you need arguments? Make it a regular static method instead.
    return this._instance || (this._instance = new this());
  }

  async updateParams() {
    if (this.initializedParams < 5) {
      await Promise.all([
        this.updateFirebaseParams(),
        this.updateS3Params(),
        this.updateMailGunParams(),
        this.updateOpenSearchParams(),
        this.updateACLParams(),
        this.updateMobileFeatureFlags(),
        this.updateBannerParams(),
        this.updateWebAppFeatureFlags(),
      ]);
    }
  }

  private async updateS3Params() {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'local') {
      this.s3Params = new S3Params({
        AWS_CF_KEY: '',
        AWS_CF_KEY_ID: '',
        AWS_CF_PVT_KEY: '',
        AWS_CF_PVT_KEY_ID: '',
        AWS_CF_PVT_S3_DOMAIN: '',
        AWS_CF_S3_DOMAIN: '',
        AWS_S3_PVT_UPLOAD_BUCKET_NAME:
          process.env.AWS_S3_PVT_UPLOAD_BUCKET_NAME,
        AWS_S3_UPLOAD_BUCKET_NAME: process.env.AWS_S3_UPLOAD_BUCKET_NAME,
      });
      return;
    }

    const params = new GetParameterCommand({
      Name: '/' + (process.env.SSM_DOMAIN ?? 'wildr-prod-1') + '/s3-cdn',
      WithDecryption: false,
    });
    try {
      const response = await this.client.send(params);
      if (response.Parameter?.Value) {
        this.s3Params = new S3Params(JSON.parse(response.Parameter?.Value));
        if (!this.s3Params.allGood()) {
          throw Error('Failed to get all params from /s3-cdn');
        }
        this.initializedParams += 1;
      } else {
        throw Error('Failed to get params from /s3-cdn');
      }
    } catch (error) {
      this.logger.error('Failed to get params from /s3-cdn', { error });
    }
  }

  private async updateFirebaseParams() {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'local') {
      this.firebaseParams = new FirebaseParams({
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_AUTH_PROVIDER_X509_CERT_URL:
          process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        FIREBASE_AUTH_URI: process.env.FIREBASE_AUTH_URI,
        FIREBASE_CLIENTX509_CERT_URL: process.env.FIREBASE_CLIENTX509_CERT_URL,
        FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
        FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_TOKEN_URI: process.env.FIREBASE_TOKEN_URI,
        FIREBASE_TYPE: process.env.FIREBASE_TYPE,
      });
      return;
    }

    const params = new GetParameterCommand({
      Name: '/' + process.env.SSM_DOMAIN + '/firebase',
      WithDecryption: false,
    });
    try {
      const response = await this.client.send(params);
      if (response.Parameter?.Value) {
        this.firebaseParams = new FirebaseParams(
          JSON.parse(response.Parameter?.Value)
        );
        if (!this.firebaseParams.allGood()) {
          throw Error('Failed to get all params from /firebase');
        }
        this.initializedParams += 1;
      } else {
        throw Error('Failed to get params from /firebase');
      }
    } catch (error) {
      this.logger.error('Failed to get params from /firebase', { error });
    }
  }

  private async updateMailGunParams() {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'local') {
      this.mailGunParams = new MailGunParams({
        DOMAIN: process.env.MAIL_GUN_DOMAIN,
        API_KEY: process.env.MAIL_GUN_API_KEY,
      });
      return;
    }
    const params = new GetParameterCommand({
      Name: '/' + (process.env.SSM_DOMAIN ?? 'wildr-prod-1') + '/mail-gun',
      WithDecryption: true,
    });
    try {
      const response = await this.client.send(params);
      if (response.Parameter?.Value) {
        this.mailGunParams = new MailGunParams(
          JSON.parse(response.Parameter?.Value)
        );
        if (!this.mailGunParams.allGood()) {
          throw Error('Failed to get all params from /mailgun');
        }
        this.initializedParams += 1;
      } else {
        throw Error('Failed to get params from /mailgun');
      }
    } catch (error) {
      this.logger.error('Failed to get params from /mailgun', { error });
    }
  }

  private async updateOpenSearchParams() {
    if (this.env === 'local' || this.env === 'test') {
      this.openSearchParams = new LocalOpenSearchParamsDto();
      return;
    }
    const params = await this.getParam({
      segment: 'opensearch',
      withDecryption: false,
    });
    if (params.isErr()) {
      this.logger.error('ssm param retrieval failed', { error: params.error });
      throw params.error;
    }
    const validatedParams = await this.validateParam({
      param: params.value,
      dto: OpenSearchParamsDto,
    });
    if (validatedParams.isErr()) {
      this.logger.error('ssm param validation failed', {
        error: validatedParams.error,
      });
      throw validatedParams.error;
    }
    this.openSearchParams = validatedParams.value;
  }

  private sortMobileVersionToFeatureFlagsMapDesc() {
    this.logger.info('sortMobileVersionToFeatureFlagsMap()');
    if (!this.mobileVersionToFeatureFlagsMap)
      throw Error('mobileVersionToFeatureFlagsMap is not initialized');
    const sortedVersions = Array.from(
      this.mobileVersionToFeatureFlagsMap.keys()
    ).sort((a, b) => {
      return -compareVersions(a, b);
    });
    const sortedMap: Map<string, MobileFeatureFlags> = new Map();
    sortedVersions.forEach(version => {
      const value = this.mobileVersionToFeatureFlagsMap.get(version);
      if (!value)
        throw Error(
          `Failed to retrieve value from mobileVersionToFeatureFlagsMap for ${version}`
        );
      sortedMap.set(version, value);
    });
    this.mobileVersionToFeatureFlagsMap = sortedMap;
  }

  private async updateMobileFeatureFlags() {
    this.mobileVersionToFeatureFlagsMap = new Map();
    if (process.env.NODE_ENV === 'local') {
      const mobileFeatureFlag = new MobileFeatureFlags({
        CREATE_POST_V1: (process.env.CREATE_POST_V1 ?? 'true') === 'true',
        CREATE_POST_V2: (process.env.CREATE_POST_V2 ?? 'false') === 'true',
        BANNERS_ENABLED: (process.env.BANNERS_ENABLED ?? 'false') === 'true',
        COIN_DB_PT_1: (process.env.COIN_DB_PT_1 ?? 'false') === 'true',
        COIN_DB_PT_2: (process.env.COIN_DB_PT_2 ?? 'false') === 'true',
        VIDEO_COMPRESSION_960_QUALITY:
          (process.env.VIDEO_COMPRESSION_960_QUALITY ?? 'false') === 'true',
      });
      this.mobileVersionToFeatureFlagsMap.set('2023.09.10', mobileFeatureFlag);
      return;
    }
    try {
      const params = await this.getParam({
        segment: 'mobile-feature-flags',
        withDecryption: false,
      });
      if (params.isErr()) throw params.error;
      if (!params.value) throw new Error('Params value not found');
      const ssmParamsMap = JSON.parse(params.value);
      this.mobileVersionToFeatureFlagsMap = new Map<
        string,
        MobileFeatureFlags
      >();
      for (const key in ssmParamsMap) {
        if (ssmParamsMap.hasOwnProperty(key)) {
          const featureFlags = new MobileFeatureFlags(ssmParamsMap[key]);
          this.mobileVersionToFeatureFlagsMap.set(key, featureFlags);
        }
      }
      this.mobileVersionToFeatureFlagsMap.forEach((featureFlags, key) => {
        if (!featureFlags.allGood()) {
          throw Error(
            `Failed to get all params from /mobile-feature-flags for version: ${key}`
          );
        }
      });
      this.sortMobileVersionToFeatureFlagsMapDesc();
      this.initializedParams += 1;
    } catch (error) {
      this.logger.error('Failed to update mobileVersionToFeatureFlagsMap', {
        error,
      });
    }
  }

  private getPath(segment: string) {
    return '/' + (process.env.SSM_DOMAIN ?? 'wildr-prod-1') + '/' + segment;
  }

  private async getParam({
    segment,
    withDecryption = false,
  }: {
    segment: string;
    withDecryption?: boolean;
  }): Promise<
    Result<string, SSMParamNotFoundException | InternalServerErrorException>
  > {
    try {
      const response = await this.client.send(
        new GetParameterCommand({
          Name: this.getPath(segment),
          WithDecryption: withDecryption,
        })
      );
      if (response.Parameter?.Value) return ok(response.Parameter.Value);
      return err(
        new SSMParamNotFoundException({
          segment,
        })
      );
    } catch (error) {
      return err(
        new InternalServerErrorException('ssm param retrieval failed', {
          error,
          segment,
        })
      );
    }
  }

  private async validateParam<T extends Record<any, any>>({
    param,
    dto,
  }: {
    param: string;
    dto: Constructor<T>;
  }): Promise<Result<T, BadSSMParamException>> {
    try {
      const parsedParams = JSON.parse(param);
      const parsedDto = new dto(parsedParams);
      const errors = await validate(parsedDto);
      if (errors.length > 0) {
        return err(
          new BadSSMParamException({
            errors,
            param,
            parsedParams,
          })
        );
      }
      return ok(parsedDto);
    } catch (error) {
      return err(
        new BadSSMParamException({
          error,
          param,
        })
      );
    }
  }

  private async updateACLParams(): Promise<void> {
    if (process.env.NODE_ENV === 'local') {
      this.aclParams = new ACLParamsDefaults();
      return;
    }
    const params = await this.getParam({
      segment: 'acl',
      withDecryption: false,
    });
    if (params.isErr()) {
      this.logger.error('ssm param retrieval failed', { error: params.error });
      this.aclParams = new ACLParamsDefaults();
      return;
    }
    const validatedParams = await this.validateParam({
      param: params.value,
      dto: ACLParamsDto,
    });
    if (validatedParams.isErr()) {
      this.logger.error('ssm param validation failed', {
        error: validatedParams.error,
      });
      this.aclParams = new ACLParamsDefaults();
      return;
    }
    this.aclParams = validatedParams.value;
  }

  private async updateBannerParams(): Promise<void> {
    if (this.env === 'local' || this.env === 'test') {
      this.bannerParams = new LocalBannerParamsDto();
      return;
    }
    const params = await this.getParam({
      segment: 'banner',
      withDecryption: false,
    });
    if (params.isErr()) {
      this.logger.error('ssm param retrieval failed', { error: params.error });
      throw params.error;
    }
    const validatedParams = await this.validateParam({
      param: params.value,
      dto: ProdBannerParamsDto,
    });
    if (validatedParams.isErr()) {
      this.logger.error('ssm param validation failed', {
        error: validatedParams.error,
      });
      throw validatedParams.error;
    }
    this.bannerParams = validatedParams.value;
  }

  private async updateWebAppFeatureFlags(): Promise<void> {
    if (this.env === 'local' || this.env === 'test') {
      this.webAppFeatureFlags = new LocalWebAppFeatureFlagsDto();
      return;
    }
    const params = await this.getParam({
      segment: 'web-app-feature-flags',
      withDecryption: false,
    });
    if (params.isErr()) {
      this.logger.error('ssm param retrieval failed', { error: params.error });
      throw params.error;
    }
    const validatedParams = await this.validateParam({
      param: params.value,
      dto: ProdWebAppFeatureFlagsDto,
    });
    if (validatedParams.isErr()) {
      this.logger.error('ssm param validation failed', {
        error: validatedParams.error,
      });
      this.webAppFeatureFlags = new LocalWebAppFeatureFlagsDto();
      return;
    }
    this.webAppFeatureFlags = validatedParams.value;
  }
}

export interface FirebaseParametersInput {
  FIREBASE_CLIENT_EMAIL: string | undefined;
  FIREBASE_PRIVATE_KEY: string | undefined;
  FIREBASE_PRIVATE_KEY_ID: string | undefined;
  FIREBASE_PROJECT_ID: string | undefined;
  FIREBASE_TOKEN_URI: string | undefined;
  FIREBASE_TYPE: string | undefined;
  FIREBASE_CLIENT_ID: string | undefined;
  FIREBASE_CLIENTX509_CERT_URL: string | undefined;
  FIREBASE_AUTH_URI: string | undefined;
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: string | undefined;
}

export class FirebaseParams {
  FIREBASE_CLIENT_EMAIL: string | undefined;
  FIREBASE_PRIVATE_KEY: string | undefined;
  FIREBASE_PRIVATE_KEY_ID: string | undefined;
  FIREBASE_PROJECT_ID: string | undefined;
  FIREBASE_TOKEN_URI: string | undefined;
  FIREBASE_TYPE: string | undefined;
  FIREBASE_CLIENT_ID: string | undefined;
  FIREBASE_CLIENTX509_CERT_URL: string | undefined;
  FIREBASE_AUTH_URI: string | undefined;
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: string | undefined;

  constructor(result: FirebaseParametersInput) {
    this.FIREBASE_PRIVATE_KEY = result.FIREBASE_PRIVATE_KEY;
    this.FIREBASE_PRIVATE_KEY_ID = result.FIREBASE_PRIVATE_KEY_ID;
    this.FIREBASE_PROJECT_ID = result.FIREBASE_PROJECT_ID;
    this.FIREBASE_TOKEN_URI = result.FIREBASE_TOKEN_URI;
    this.FIREBASE_TYPE = result.FIREBASE_TYPE;
    this.FIREBASE_CLIENT_ID = result.FIREBASE_CLIENT_ID;
    this.FIREBASE_CLIENTX509_CERT_URL = result.FIREBASE_CLIENTX509_CERT_URL;
    this.FIREBASE_AUTH_PROVIDER_X509_CERT_URL =
      result.FIREBASE_AUTH_PROVIDER_X509_CERT_URL;
    this.FIREBASE_CLIENT_EMAIL = result.FIREBASE_CLIENT_EMAIL;
  }

  allGood(): boolean {
    return (
      this.FIREBASE_PRIVATE_KEY !== undefined &&
      this.FIREBASE_PRIVATE_KEY_ID !== undefined &&
      this.FIREBASE_PROJECT_ID !== undefined &&
      this.FIREBASE_TOKEN_URI !== undefined &&
      this.FIREBASE_TYPE !== undefined &&
      this.FIREBASE_CLIENT_ID !== undefined &&
      this.FIREBASE_CLIENTX509_CERT_URL !== undefined &&
      this.FIREBASE_AUTH_PROVIDER_X509_CERT_URL !== undefined &&
      this.FIREBASE_CLIENT_EMAIL !== undefined
    );
  }
}

export interface MailGunInput {
  DOMAIN: string | undefined;
  API_KEY: string | undefined;
}

export class MailGunParams {
  MAIL_GUN_API_KEY: string | undefined;
  MAIL_GUN_DOMAIN: string | undefined;

  constructor(result: MailGunInput) {
    this.MAIL_GUN_API_KEY = result.API_KEY;
    this.MAIL_GUN_DOMAIN = result.DOMAIN;
  }

  allGood(): boolean {
    return (
      this.MAIL_GUN_API_KEY !== undefined && this.MAIL_GUN_DOMAIN !== undefined
    );
  }
}

export class S3Params {
  AWS_CF_PVT_S3_DOMAIN: string | undefined;
  AWS_CF_S3_DOMAIN: string | undefined;
  AWS_S3_PVT_UPLOAD_BUCKET_NAME: string | undefined;
  AWS_S3_UPLOAD_BUCKET_NAME: string | undefined;
  AWS_CF_PVT_KEY_ID: string | undefined;
  AWS_CF_PVT_KEY: string | undefined;
  AWS_CF_KEY_ID: string | undefined;
  AWS_CF_KEY: string | undefined;

  constructor(result: {
    AWS_CF_PVT_S3_DOMAIN: string | undefined;
    AWS_CF_S3_DOMAIN: string | undefined;
    AWS_S3_PVT_UPLOAD_BUCKET_NAME: string | undefined;
    AWS_S3_UPLOAD_BUCKET_NAME: string | undefined;
    AWS_CF_PVT_KEY_ID: string | undefined;
    AWS_CF_PVT_KEY: string | undefined;
    AWS_CF_KEY_ID: string | undefined;
    AWS_CF_KEY: string | undefined;
  }) {
    this.AWS_CF_PVT_S3_DOMAIN = result.AWS_CF_PVT_S3_DOMAIN;
    this.AWS_CF_S3_DOMAIN = result.AWS_CF_S3_DOMAIN;
    this.AWS_S3_PVT_UPLOAD_BUCKET_NAME = result.AWS_S3_PVT_UPLOAD_BUCKET_NAME;
    this.AWS_S3_UPLOAD_BUCKET_NAME = result.AWS_S3_UPLOAD_BUCKET_NAME;
    this.AWS_CF_PVT_KEY_ID = result.AWS_CF_PVT_KEY_ID;
    this.AWS_CF_PVT_KEY = result.AWS_CF_PVT_KEY;
    this.AWS_CF_KEY_ID = result.AWS_CF_PVT_KEY_ID;
    this.AWS_CF_KEY = result.AWS_CF_PVT_KEY;
  }

  allGood(): boolean {
    return (
      this.AWS_CF_PVT_S3_DOMAIN !== undefined &&
      this.AWS_CF_S3_DOMAIN !== undefined &&
      this.AWS_S3_PVT_UPLOAD_BUCKET_NAME !== undefined &&
      this.AWS_S3_UPLOAD_BUCKET_NAME !== undefined &&
      this.AWS_CF_PVT_KEY !== undefined &&
      this.AWS_CF_PVT_KEY_ID !== undefined
    );
  }
}
