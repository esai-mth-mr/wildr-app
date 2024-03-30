import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ESItem, ESInput, ESOutput, ESearchType } from '../generated-graphql';
import { OpenSearchService } from './openSearch.service';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { OptionalJwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';
import {
  WildrMethodLatencyHistogram,
  WildrSpan,
} from '../opentelemetry/openTelemetry.decorators';
import { AppContext, notEmpty } from '@verdzie/server/common';
import { PostSearchService } from '@verdzie/server/post/post-search.service';
import { UserSearchService } from '@verdzie/server/user/user-search.service';
import { UserService } from '@verdzie/server/user/user.service';
import { PostService } from '@verdzie/server/post/post.service';
import { DEFAULT_PAGE_SIZE } from '@verdzie/server/open-search-v2/query/query.service';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import { WildrExceptionDecorator } from '@verdzie/server/common/wildr-exception.decorator';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';

@Resolver()
export class OpenSearchResolver {
  private readonly userSearchV2Enabled: boolean;
  private readonly postSearchV2Enabled: boolean;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly service: OpenSearchService,
    private readonly postSearchService: PostSearchService,
    private readonly userSearchService: UserSearchService,
    private readonly userService: UserService,
    private readonly postService: PostService
  ) {
    this.logger = logger.child({ context: this.constructor.name });
    this.userSearchV2Enabled =
      !!SSMParamsService.Instance.openSearchParams
        .OPEN_SEARCH_USER_SEARCH_V2_ENABLED;
    this.postSearchV2Enabled =
      !!SSMParamsService.Instance.openSearchParams
        .OPEN_SEARCH_POST_SEARCH_V2_ENABLED;
  }

  @Query()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(SmartExceptionFilter)
  @WildrSpan()
  async elasticSearch(
    @Args('input') input: ESInput,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ESOutput> {
    if (input.type === ESearchType.USER && this.userSearchV2Enabled) {
      const foundUsers = await this.userSearchService.searchForUsers({
        queryString: input.query ?? '',
        paginationInput: input.paginationInput ?? {
          take: DEFAULT_PAGE_SIZE,
        },
        currentUser,
      });
      const userObjects = await Promise.all(
        foundUsers.map(user => this.userService.toUserObject({ user }))
      );
      if (userObjects.length === 0) {
        return {
          __typename: 'SmartError',
          message: 'No users found',
        };
      }
      return {
        __typename: 'ESResult',
        result: userObjects.filter(notEmpty),
      };
    }
    if (input.type === ESearchType.POST && this.postSearchV2Enabled) {
      const foundPosts = (
        await this.postSearchService.searchForPosts({
          queryString: input.query ?? '',
          paginationInput: input.paginationInput ?? {
            take: DEFAULT_PAGE_SIZE,
          },
          context: ctx,
          currentUser,
        })
      )
        .map(post => this.postService.toGqlPostObject(post))
        .filter(notEmpty);
      if (foundPosts.length === 0) {
        return {
          __typename: 'SmartError',
          message: 'No posts found',
        };
      }
      return {
        __typename: 'ESResult',
        result: foundPosts,
      };
    }
    const result = await this.service.search(input, ctx, currentUser);
    if (typeof result === 'string') {
      return {
        __typename: 'SmartError',
        message: result,
      };
    }
    return {
      __typename: 'ESResult',
      result: result as ESItem[],
    };
  }
}
