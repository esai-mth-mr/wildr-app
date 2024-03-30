import { Args, Context, Query, ResolveField, Resolver } from '@nestjs/graphql';
import {
  WildrMethodLatencyHistogram,
  WildrSpan,
} from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import {
  WildrAppConfigInput,
  WildrAppConfigOutput,
  WildrAppVersion,
} from '@verdzie/server/generated-graphql';
import { UseFilters } from '@nestjs/common';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';
import { WildrAppConfigService } from '@verdzie/server/wildr-app-config/wildr-app-config.service';
import { AppContext } from '@verdzie/server/common';

@Resolver('WildrAppConfig')
export class WildrAppConfigResolver {
  constructor(private service: WildrAppConfigService) {}

  @Query('getWildrAppConfig')
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @UseFilters(new SmartExceptionFilter())
  async getWildrAppConfig(
    @Args() input: WildrAppConfigInput,
    @Context() context: AppContext
  ): Promise<WildrAppConfigOutput> {
    context.input = input;
    return {
      __typename: 'WildrAppConfig',
    };
  }

  @UseFilters(new SmartExceptionFilter())
  @ResolveField()
  appVersion(@Context() context: AppContext): WildrAppVersion {
    if (!context.input || !context.input.input.osName) {
      throw new Error(
        'Input not of type WildrAppConfigInput; OsName not found'
      );
    }
    const input = context.input.input;
    return this.service.getWildrAppVersion(input.osName);
  }
}
