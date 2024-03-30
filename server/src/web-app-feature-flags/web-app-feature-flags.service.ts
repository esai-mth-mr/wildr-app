import { Inject, Injectable } from '@nestjs/common';
import { WebAppFeatureFlagsDto } from '@verdzie/server/ssm-params/dto/web-app-feature-flags.dto';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class WebAppFeatureFlagsService {
  private readonly webAppFeatureFlags: WebAppFeatureFlagsDto;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
    this.webAppFeatureFlags = SSMParamsService.Instance.webAppFeatureFlags;
  }

  getFeatureFlags(): WebAppFeatureFlagsDto {
    return this.webAppFeatureFlags;
  }
}
