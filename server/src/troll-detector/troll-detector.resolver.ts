import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { TrollDetectorService } from './troll-detector.service';
import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';
import { JwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';
import {
  WildrMethodLatencyHistogram,
  WildrSpan,
} from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  DetectTrollingInput,
  DetectTrollingResult,
} from '@verdzie/server/generated-graphql';

@Resolver('TrollDetector')
export class TrollDetectorResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private trollDetectorService: TrollDetectorService
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  @Mutation('detectTrolling')
  @UseGuards(JwtAuthGuard)
  @UseFilters(SmartExceptionFilter)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async detectTrolling(
    @Args('input', { type: () => DetectTrollingInput })
    input: DetectTrollingInput
  ): Promise<DetectTrollingResult> {
    const result = await this.trollDetectorService.detect(input.content);
    return {
      __typename: 'DetectTrollingResult',
      isTroll: !!result,
      ...(result && {
        trollDetectionData: {
          __typename: 'TrollDetectionData',
          result,
        },
      }),
    };
  }
}
