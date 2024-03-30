import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import {
  BannerEntity,
  BannerState,
} from '@verdzie/server/banner/banner.entity';
import { BannerSchema } from '@verdzie/server/banner/banner.schema';
import { fromTransaction } from '@verdzie/server/common/transaction-result';
import {
  DebugData,
  NotFoundException,
  NotFoundExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';
import {
  PostgresTransactionFailedException,
  PostgresQueryFailedException,
  PostgresUpdateFailedException,
} from '@verdzie/server/typeorm/postgres-exceptions';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserNotFoundException } from '@verdzie/server/user/user.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, fromPromise, ok } from 'neverthrow';
import { Connection, In, Repository } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class BannerService {
  private readonly skipRetryCount = 3;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(BannerSchema)
    private readonly bannerRepository: Repository<BannerEntity>,
    @InjectConnection()
    private readonly connection: Connection
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  // Check if there are any banners available for this user.
  async getApplicableBannersForUser({
    user,
  }: {
    user: UserEntity;
  }): Promise<Result<BannerEntity[], PostgresQueryFailedException>> {
    const context = {
      userId: user.id,
      methodName: BannerService.prototype.getApplicableBannersForUser.name,
    };
    const bannersResult = await fromPromise(
      this.bannerRepository.find({
        where: { state: In([BannerState.ENABLED, BannerState.TESTING]) },
      }),
      (error: unknown) =>
        new PostgresQueryFailedException({ ...context, error })
    );
    if (bannersResult.isErr()) {
      this.logger.error('failed to get banners', {
        ...context,
        error: bannersResult.error,
      });
      return err(bannersResult.error);
    }
    const applicableBanners = this.filterApplicableBannersForUser({
      user,
      banners: bannersResult.value,
    });
    return ok(applicableBanners);
  }

  private filterApplicableBannersForUser({
    user,
    banners,
  }: {
    user: UserEntity;
    banners: BannerEntity[];
  }): BannerEntity[] {
    return banners.filter(banner => {
      if (
        banner.state === BannerState.TESTING &&
        banner.data.settings.acl &&
        banner.data.settings.acl.includes(user.id)
      ) {
        return true;
      }
      if (banner.state === BannerState.TESTING) {
        return false;
      }
      if (banner.startDate && banner.startDate > new Date()) {
        return false;
      }
      if (banner.endDate && banner.endDate < new Date()) {
        return false;
      }
      const usersBannerData = user.bannerData?.bannerInteractions[banner.id];
      const bannerSettings = banner.data.settings;
      if (usersBannerData) {
        if (usersBannerData.skipCount >= bannerSettings.skipCount) {
          return false;
        }
        if (
          usersBannerData.lastSkippedAt &&
          isWithinInterval({
            lastSkippedAt: new Date(usersBannerData.lastSkippedAt),
            skipRefreshIntervalMilliseconds:
              bannerSettings.skipRefreshIntervalMilliseconds,
          })
        ) {
          return false;
        }
        if (usersBannerData.completedAt) {
          return false;
        }
      }
      return true;
    });
  }

  async skipBannerForUser({
    currentUser,
    bannerId,
  }: {
    currentUser: UserEntity;
    bannerId: string;
  }): Promise<
    Result<
      boolean,
      | UserNotFoundException
      | BannerNotFoundException
      | PostgresUpdateFailedException
      | PostgresQueryFailedException
      | PostgresTransactionFailedException
    >
  > {
    const context = {
      userId: currentUser.id,
      bannerId,
      methodName: BannerService.prototype.skipBannerForUser.name,
    };
    this.logger.info('skipping banner', context);
    const bannerResult = await fromPromise(
      this.bannerRepository.findOne({ where: { id: bannerId } }),
      (error: unknown) =>
        new PostgresQueryFailedException({
          ...context,
          message: 'failed to find banner',
          error,
        })
    );
    if (bannerResult.isErr()) {
      this.logger.error('failed to get banner', {
        ...context,
        error: bannerResult.error,
      });
      return err(bannerResult.error);
    }
    if (!bannerResult.value) {
      this.logger.error('banner not found', context);
      return err(new BannerNotFoundException(context));
    }
    const queryRunner = this.connection.createQueryRunner();
    const result = await fromTransaction<
      boolean,
      | PostgresQueryFailedException
      | UserNotFoundException
      | PostgresUpdateFailedException
      | PostgresTransactionFailedException
    >({
      txn: async ({ queryRunner }) => {
        const userRepo = queryRunner.manager.getRepository(UserEntity);
        const userResult = await fromPromise(
          userRepo.findOne({ where: { id: currentUser.id } }),
          (error: unknown) =>
            new PostgresQueryFailedException({
              ...context,
              message: 'failed to find user',
              error,
            })
        );
        if (userResult.isErr()) {
          this.logger.error('failed to get user skipping banner', {
            ...context,
            error: userResult.error,
          });
          return err(userResult.error);
        }
        if (!userResult.value) {
          this.logger.error('user not found skipping banner', context);
          return err(new UserNotFoundException(context));
        }
        const user = userResult.value;
        user.skipBanner({ bannerId });
        const updateResult = await fromPromise(
          userRepo.update(user.id, { bannerData: user.bannerData }),
          (error: unknown) =>
            new PostgresUpdateFailedException({
              ...context,
              message: 'failed to update user',
              error,
            })
        );
        if (updateResult.isErr()) {
          this.logger.error('failed to update user skipping banner', {
            ...context,
            error: updateResult.error,
          });
          return err(updateResult.error);
        }
        return ok(true);
      },
      queryRunner,
      logger: this.logger,
      context,
      retryCount: this.skipRetryCount,
      shouldRetry: (error: unknown) => {
        if (
          error instanceof PostgresTransactionFailedException ||
          error instanceof PostgresQueryFailedException ||
          error instanceof PostgresUpdateFailedException
        ) {
          return true;
        }
        return false;
      },
    });
    return result;
  }
}

function isWithinInterval({
  lastSkippedAt,
  skipRefreshIntervalMilliseconds,
}: {
  lastSkippedAt: Date;
  skipRefreshIntervalMilliseconds: number;
}): boolean {
  const now = new Date();
  const timeSinceLastSkipped = now.getTime() - lastSkippedAt.getTime();
  return timeSinceLastSkipped < skipRefreshIntervalMilliseconds;
}

export class BannerNotFoundException extends NotFoundException {
  constructor(debugData: DebugData<NotFoundExceptionCodes> = {}) {
    super('banner not found', {
      exceptionCode: NotFoundExceptionCodes.BANNER_NOT_FOUND,
      ...debugData,
    });
  }
}
