import { Inject, Injectable } from '@nestjs/common';
import { isAppVersionValid } from '@verdzie/server/data/common';
import {
  DEFAULT_MOBILE_VERSION_FEATURE_FLAGS,
  MobileFeatureFlags,
} from '@verdzie/server/ssm-params/dto/mobile-featureflags';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class MobileFeatureFlagsService {
  private readonly mobileVersionToFeatureFlagsMap: Map<
    string,
    MobileFeatureFlags
  >;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
    this.mobileVersionToFeatureFlagsMap =
      SSMParamsService.Instance.mobileVersionToFeatureFlagsMap;
  }

  /**
   * @param appVersion
   * @param currentUser To return user-specific flags
   */
  getFeatureFlags({
    appVersion,
    currentUser,
  }: {
    appVersion?: string;
    currentUser?: UserEntity;
  }): MobileFeatureFlags {
    for (const [requiredVersion, featureFlags] of this
      .mobileVersionToFeatureFlagsMap) {
      const isValid = isAppVersionValid({
        appVersion,
        requiredVersion,
      });
      if (isValid) {
        this.logger.info('Valid for ', { appVersion, requiredVersion });
        return featureFlags;
      }
    }
    this.logger.info('Defaulting ', { appVersion });
    return DEFAULT_MOBILE_VERSION_FEATURE_FLAGS;
  }
}
