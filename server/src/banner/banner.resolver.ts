import { Inject, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { OptionalJwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';
import {
  BannerNotFoundException,
  BannerService,
} from '@verdzie/server/banner/banner.service';
import { BannerTransporter } from '@verdzie/server/banner/banner.transporter';
import { SomethingWentWrong } from '@verdzie/server/common';
import {
  Banner,
  BannersConnection,
  SkipBannerInput,
  SkipBannerOutput,
} from '@verdzie/server/generated-graphql';
import { WildrSpan } from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import {
  PostgresQueryFailedException,
  PostgresTransactionFailedException,
  PostgresUpdateFailedException,
} from '@verdzie/server/typeorm/postgres-exceptions';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserNotFoundException } from '@verdzie/server/user/user.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Resolver('Banner')
export class BannerResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly bannerService: BannerService,
    private readonly bannerTransporter: BannerTransporter
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  @Query('getBanners')
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  async getBanners(
    @CurrentUser() currentUser?: UserEntity
  ): Promise<BannersConnection> {
    const context = {
      methodName: BannerResolver.prototype.getBanners.name,
      userId: currentUser?.id,
    };
    if (!currentUser) {
      this.logger.error('unauthenticated user getting banners', context);
      return {
        banners: [],
      };
    }
    const bannerEntitiesResult =
      await this.bannerService.getApplicableBannersForUser({
        user: currentUser,
      });
    if (bannerEntitiesResult.isErr()) {
      this.logger.error('failed to retrieve banners');
      return {
        banners: [],
      };
    }
    const bannerResults = await Promise.all(
      bannerEntitiesResult.value.map(banner =>
        this.bannerTransporter.getGqlBannerFromBannerEntity({ banner })
      )
    );
    const banners: Banner[] = [];
    for (const bannerResult of bannerResults) {
      if (bannerResult.isOk()) {
        banners.push(bannerResult.value);
      } else {
        this.logger.error('failed to prep banner for transport', {
          context,
          error: bannerResult.error,
        });
      }
    }
    return {
      banners,
    };
  }

  @Mutation('skipBanner')
  @WildrSpan()
  @UseGuards(OptionalJwtAuthGuard)
  async skipBanner(
    @CurrentUser() currentUser: UserEntity,
    @Args('input') input: SkipBannerInput
  ): Promise<SkipBannerOutput> {
    const context = {
      methodName: BannerResolver.prototype.skipBanner.name,
      userId: currentUser?.id,
      bannerId: input?.bannerId,
    };
    if (!currentUser) {
      this.logger.error('unauthenticated user skipping banner', context);
      return {
        __typename: 'SkipBannerResult',
        success: false,
      };
    }
    const skipBannerResult = await this.bannerService.skipBannerForUser({
      bannerId: input.bannerId,
      currentUser,
    });
    if (skipBannerResult.isErr()) {
      this.logger.error('failed to skip banner', {
        ...context,
        error: skipBannerResult.error,
      });
      if (
        skipBannerResult.error instanceof UserNotFoundException ||
        skipBannerResult.error instanceof BannerNotFoundException ||
        skipBannerResult.error instanceof PostgresTransactionFailedException ||
        skipBannerResult.error instanceof PostgresQueryFailedException ||
        skipBannerResult.error instanceof PostgresUpdateFailedException
      ) {
        return SomethingWentWrong();
      } else {
        const _exhaustiveCheck: never = skipBannerResult.error;
        this.logger.error('unhandled error skipping banner', {
          context,
          error: skipBannerResult.error,
        });
        return SomethingWentWrong();
      }
    }
    return {
      __typename: 'SkipBannerResult',
      success: true,
    };
  }
}
