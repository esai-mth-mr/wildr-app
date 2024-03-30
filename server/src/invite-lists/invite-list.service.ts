import { Inject, Injectable } from '@nestjs/common';
import { emptyPageInfo } from '@verdzie/server/challenge/challenge.service';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import {
  FeedNotFoundException,
  FeedService,
  PaginateFeedResponse,
  toFeedId,
} from '@verdzie/server/feed/feed.service';
import { PaginationInput } from '@verdzie/server/generated-graphql';
import {
  PostgresQueryFailedException,
  PostgresTransactionFailedException,
} from '@verdzie/server/typeorm/postgres-exceptions';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import { first, last } from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Logger } from 'winston';

@Injectable()
export class InviteListService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly feedService: FeedService,
    private readonly userService: UserService
  ) {
    this.logger = logger.child({ context: InviteListService.name });
  }

  async recordInvite({
    referrerId,
    invitedId,
  }: {
    referrerId: string;
    invitedId: string;
  }): Promise<
    Result<
      boolean,
      | PostgresQueryFailedException
      | PostgresTransactionFailedException
      | FeedNotFoundException
    >
  > {
    const context = {
      referrerId,
      invitedId,
      methodName: InviteListService.prototype.recordInvite.name,
    };
    this.logger.info('recording invite', context);
    const result = await this.feedService.unshiftToSinglePageFeedInTxn({
      entry: invitedId,
      feedId: toFeedId(FeedEntityType.REFERRED_USERS, referrerId),
    });
    if (result.isErr()) {
      this.logger.error('failed to record invite', context);
      return err(result.error);
    }
    this.logger.info('recorded invite', context);
    return ok(true);
  }

  async paginateInvites({
    currentUser,
    paginationInput,
  }: {
    currentUser: UserEntity;
    paginationInput: PaginationInput;
  }): Promise<
    Result<PaginateFeedResponse<UserEntity>, InternalServerErrorException>
  > {
    const context = {
      currentUser,
      paginationInput,
      methodName: InviteListService.prototype.paginateInvites.name,
    };
    const feed = await this.feedService.findById({
      id: toFeedId(FeedEntityType.REFERRED_USERS, currentUser.id),
    });
    if (feed.isErr()) {
      this.logger.error('error finding feed', {
        ...context,
        error: feed.error,
      });
      return err(feed.error);
    }
    if (!feed.value) {
      this.logger.error('feed not found', context);
      return ok({
        items: [],
        pageInfo: emptyPageInfo,
      });
    }
    const paginateFeedResult = this.feedService.paginateReverseChronFeed({
      feed: feed.value,
      paginationInput,
    });
    const users = await this.userService.findByIds({
      ids: paginateFeedResult.items,
    });
    if (users.isErr()) {
      this.logger.error('error finding users', {
        ...context,
        error: users.error,
      });
      return err(users.error);
    }
    const filteredUsers = users.value.filter(user => {
      return user && user.isAlive();
    });
    return ok({
      items: users.value,
      pageInfo: {
        hasNextPage: paginateFeedResult.pageInfo.hasNextPage,
        hasPreviousPage: paginateFeedResult.pageInfo.hasPreviousPage,
        startCursor: first(filteredUsers)?.id,
        endCursor: last(filteredUsers)?.id,
        count: filteredUsers.length,
        totalCount: feed.value.page.ids.length,
      },
    });
  }
}
