import { Context, Query, Resolver } from '@nestjs/graphql';
import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { MobileFeatureFlagsService } from '@verdzie/server/mobile-feature-flags/mobileFeatureFlags.service';
import { WildrSpan } from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import { GetFeatureFlagsOutput } from '@verdzie/server/generated-graphql';
import { AppContext } from '@verdzie/server/common';
import { MobileFeatureFlags } from '@verdzie/server/ssm-params/dto/mobile-featureflags';
import { OptionalJwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';

@Resolver()
export class MobileFeatureFlagsResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly service: MobileFeatureFlagsService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Query()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  async getFeatureFlags(
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<GetFeatureFlagsOutput> {
    const flags: MobileFeatureFlags = this.service.getFeatureFlags({
      appVersion: ctx.version,
      currentUser,
    });
    return {
      __typename: 'FeatureFlagsResult',
      ...flags,
    };
  }
}
