import { Inject, Injectable } from '@nestjs/common';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { PaginationInput } from '@verdzie/server/generated-graphql';
import {
  DEFAULT_PAGE_SIZE,
  OSQueryService,
} from '@verdzie/server/open-search-v2/query/query.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import _ from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class UserSearchService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly openSearchQueryService: OSQueryService,
    private readonly userService: UserService,
    private readonly feedService: FeedService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async searchForUsers({
    queryString,
    paginationInput,
    currentUser,
  }: {
    queryString: string;
    paginationInput: PaginationInput;
    currentUser?: UserEntity;
  }): Promise<UserEntity[]> {
    const context = {
      queryString,
      paginationInput,
      userId: currentUser?.id,
      methodName: UserSearchService.prototype.searchForUsers.name,
    };
    this.logger.debug('searching users', context);
    // Retrieve ids of users matching the query
    const [userIds, blockedByFeed] = await Promise.all([
      this.openSearchQueryService.searchUsersAndReturnIds({
        queryString,
        paginationInput: {
          ...paginationInput,
          // Get users with a buffer in case some are blocked
          ...(paginationInput.take && {
            take: Math.floor(paginationInput.take * 1.5),
          }),
        },
      }),
      currentUser &&
        this.feedService.find(
          toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, currentUser.id)
        ),
    ]);
    const blockedByFeedIds = new Set(blockedByFeed?.page.ids || []);
    this.logger.debug('found ids', {
      idCount: userIds.length,
      blockedByFeedIds,
    });
    // Filter out users that have blocked the current user
    const filteredUserIds = userIds.filter(id => !blockedByFeedIds.has(id));
    const users = (await this.userService.findAllById(filteredUserIds)).filter(
      user => user // ensure all users are defined
    );
    if (paginationInput.before || paginationInput.includingAndBefore) {
      return _.takeRight(users, paginationInput.take || DEFAULT_PAGE_SIZE);
    }
    return _.take(users, paginationInput.take || DEFAULT_PAGE_SIZE);
  }
}
