import { Inject, Injectable } from '@nestjs/common';
import { OSName, WildrAppVersion } from '@verdzie/server/generated-graphql';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class WildrAppConfigService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: WildrAppConfigService.name });
  }

  getWildrAppVersion(osName: OSName): WildrAppVersion {
    this.logger.info(osName);
    let latest: string | undefined;
    let mandatory: string | undefined;
    switch (osName) {
      case OSName.ANDROID:
        latest = process.env.LATEST_ANDROID_VERSION;
        mandatory = process.env.MANDATORY_ANDROID_VERSION;
        break;
      case OSName.IOS:
        latest = process.env.LATEST_IOS_VERSION;
        mandatory = process.env.MANDATORY_IOS_VERSION;
        break;
    }
    return {
      __typename: 'WildrAppVersion',
      latest,
      mandatory,
    };
  }
}
