import { Inject, UseFilters } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';
import { GetWebAppFeatureFlagsOutput } from '@verdzie/server/generated-graphql';
import { WildrSpan } from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import { WebAppFeatureFlagsService } from '@verdzie/server/web-app-feature-flags/web-app-feature-flags.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Resolver()
export class WebAppFeatureFlagsResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly webAppFeatureFlagsService: WebAppFeatureFlagsService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Query()
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  getWebAppFeatureFlags(): GetWebAppFeatureFlagsOutput {
    const featureFlags = this.webAppFeatureFlagsService.getFeatureFlags();
    return {
      __typename: 'GetWebAppFeatureFlagsResult',
      wildrCoinWaitlistEnabled: featureFlags.WILDR_COIN_WAITLIST_ENABLED,
    };
  }
}
