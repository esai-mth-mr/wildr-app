import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { fromTransaction } from '@verdzie/server/common/transaction-result';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import {
  FeedNotFoundException,
  toFeedId,
} from '@verdzie/server/feed/feed.service';
import {
  PostgresQueryFailedException,
  PostgresTransactionFailedException,
  PostgresUpdateFailedException,
} from '@verdzie/server/typeorm/postgres-exceptions';
import { UserListEntity } from '@verdzie/server/user-list/userList.entity';
import { UserListNotFoundException } from '@verdzie/server/user-list/userList.exceptions';
import { innerCircleListId } from '@verdzie/server/user-list/userList.helpers';
import { UserStatsService } from '@verdzie/server/user/user-stats.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Repository } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class UserStatsSyncService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly userStatsService: UserStatsService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  public async syncUserStats({
    userId,
  }: {
    userId: string;
  }): Promise<
    Result<
      boolean,
      PostgresQueryFailedException | PostgresUpdateFailedException[]
    >
  > {
    const context = {
      userId,
      methodName: 'syncUserStats',
    };
    this.logger.info('synchronizing user stats', context);
    const [
      syncFollowerCountResult,
      syncFollowingCountResult,
      syncPostCountResult,
      syncInnerCircleCountResult,
    ] = await Promise.all([
      this.syncFollowerCount({ userId }),
      this.syncFollowingCount({ userId }),
      this.syncPostCount({ userId }),
      this.syncInnerCircleCount({ userId }),
    ]);
    for (const result of [
      syncFollowerCountResult,
      syncFollowingCountResult,
      syncPostCountResult,
    ]) {
      if (result.isErr()) {
        if (result.error instanceof FeedNotFoundException) {
          this.logger.warn('feed not found', {
            feedId: result.error?.debugData.feedId,
            ...context,
          });
        } else {
          this.logger.error('error synchronizing user stats from feed', {
            error: result.error,
            ...context,
          });
          return err(result.error);
        }
      }
    }
    if (syncInnerCircleCountResult.isErr()) {
      if (
        syncInnerCircleCountResult.error instanceof UserListNotFoundException
      ) {
        this.logger.warn('inner circle list not found', context);
      } else {
        this.logger.error('error synchronizing inner circle count', {
          error: syncInnerCircleCountResult.error,
          ...context,
        });
        return err(syncInnerCircleCountResult.error);
      }
    }
    this.logger.info('synchronized user stats', context);
    return ok(true);
  }

  private async syncFollowerCount({
    userId,
  }: {
    userId: string;
  }): Promise<
    Result<boolean, FeedNotFoundException | PostgresTransactionFailedException>
  > {
    const context = {
      userId,
      methodName: 'syncFollowerCount',
    };
    const result = await fromTransaction({
      queryRunner: this.userRepo.manager.connection.createQueryRunner(),
      context,
      txn: async ({ queryRunner }) => {
        // Use follower feed as mutex
        const followerFeed = await queryRunner.manager.findOne(FeedEntity, {
          where: { id: toFeedId(FeedEntityType.FOLLOWER, userId) },
          lock: { mode: 'pessimistic_write' },
        });
        if (!followerFeed) {
          this.logger.warn('follower feed not found', context);
          return err(
            new FeedNotFoundException({
              feedId: toFeedId(FeedEntityType.FOLLOWER, userId),
              ...context,
            })
          );
        }
        await this.userStatsService.jsonSetStatsInTxn({
          id: userId,
          statsKey: 'followerCount',
          statsValue: followerFeed.ids.length,
          userRepo: this.userRepo,
        });
        return ok(true);
      },
      logger: this.logger,
    });
    if (result.isErr()) {
      this.logger.error('error synchronizing follower count', {
        error: result.error,
        ...context,
      });
      return err(result.error);
    }
    return ok(true);
  }

  private async syncFollowingCount({
    userId,
  }: {
    userId: string;
  }): Promise<
    Result<boolean, FeedNotFoundException | PostgresTransactionFailedException>
  > {
    const context = {
      userId,
      methodName: 'syncFollowingCount',
    };
    const result = await fromTransaction({
      queryRunner: this.userRepo.manager.connection.createQueryRunner(),
      context,
      txn: async ({ queryRunner }) => {
        // Use following feed as mutex
        const followingFeed = await queryRunner.manager.findOne(FeedEntity, {
          where: { id: toFeedId(FeedEntityType.FOLLOWING, userId) },
          lock: { mode: 'pessimistic_write' },
        });
        if (!followingFeed) {
          this.logger.warn('following feed not found', context);
          return err(
            new FeedNotFoundException({
              feedId: toFeedId(FeedEntityType.FOLLOWING, userId),
              ...context,
            })
          );
        }
        await this.userStatsService.jsonSetStatsInTxn({
          id: userId,
          statsKey: 'followingCount',
          statsValue: followingFeed.ids.length,
          userRepo: this.userRepo,
        });
        return ok(true);
      },
      logger: this.logger,
    });
    if (result.isErr()) {
      this.logger.error('error synchronizing following count', {
        error: result.error,
        ...context,
      });
      return err(result.error);
    }
    return ok(true);
  }

  private async syncPostCount({
    userId,
  }: {
    userId: string;
  }): Promise<
    Result<boolean, FeedNotFoundException | PostgresTransactionFailedException>
  > {
    const context = {
      userId,
      methodName: 'syncPostCount',
    };
    const result = await fromTransaction({
      queryRunner: this.userRepo.manager.connection.createQueryRunner(),
      context,
      txn: async ({ queryRunner }) => {
        // Use post feed as mutex
        const postFeed = await queryRunner.manager.findOne(FeedEntity, {
          where: {
            id: toFeedId(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS, userId),
          },
          lock: { mode: 'pessimistic_write' },
        });
        if (!postFeed) {
          this.logger.warn('post feed not found', context);
          return err(
            new FeedNotFoundException({
              feedId: toFeedId(
                FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS,
                userId
              ),
              ...context,
            })
          );
        }
        await this.userStatsService.jsonSetStatsInTxn({
          id: userId,
          statsKey: 'postCount',
          statsValue: postFeed.ids.length,
          userRepo: this.userRepo,
        });
        return ok(true);
      },
      logger: this.logger,
    });
    if (result.isErr()) {
      this.logger.error('error synchronizing post count', {
        error: result.error,
        ...context,
      });
      return err(result.error);
    }
    return ok(true);
  }

  private async syncInnerCircleCount({
    userId,
  }: {
    userId: string;
  }): Promise<
    Result<
      boolean,
      UserListNotFoundException | PostgresTransactionFailedException
    >
  > {
    const context = {
      userId,
      methodName: 'syncInnerCircleCount',
    };
    const result = await fromTransaction({
      queryRunner: this.userRepo.manager.connection.createQueryRunner(),
      context,
      txn: async ({ queryRunner }) => {
        // Use inner circle list as mutex
        const innerCircleList = await queryRunner.manager.findOne(
          UserListEntity,
          {
            where: { id: innerCircleListId(userId) },
            lock: { mode: 'pessimistic_write' },
          }
        );
        if (!innerCircleList) {
          this.logger.warn('inner circle list not found', context);
          return err(
            new UserListNotFoundException({
              feedId: innerCircleListId(userId),
              ...context,
            })
          );
        }
        await this.userStatsService.jsonSetStatsInTxn({
          id: userId,
          statsKey: 'innerCircleCount',
          statsValue: innerCircleList.ids.length,
          userRepo: this.userRepo,
        });
        return ok(true);
      },
      logger: this.logger,
    });
    if (result.isErr()) {
      this.logger.error('error synchronizing inner circle count', {
        error: result.error,
        ...context,
      });
      return err(result.error);
    }
    return ok(true);
  }
}
