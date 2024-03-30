/* eslint-disable @typescript-eslint/no-empty-function */
import { Inject, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UserService } from '@verdzie/server/user/user.service';
import _ from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Feed, FeedPostsConnection, FeedPostsEdge, Post } from '../graphql';
import { Logger } from 'winston';
import { CurrentUser } from '../auth/current-user';
import { OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppContext, setupParentPostsForReposts } from '../common';
import {
  FeedScopeType,
  GetFeedInput,
  GetFeedOutput,
  PageInfo,
  PaginationOrder,
  PaginationInput,
} from '@verdzie/server/generated-graphql';
import { getFilteredPosts, PostService } from '../post/post.service';
import { UserEntity } from '../user/user.entity';
import { FeedEntity, FeedEntityType } from './feed.entity';
import { FeedService, toFeedId } from './feed.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import {
  WildrMethodLatencyHistogram,
  WildrSpan,
} from '../opentelemetry/openTelemetry.decorators';

@Resolver('Feed')
export class FeedResolver {
  constructor(
    private postService: PostService,
    private feedService: FeedService,
    private userService: UserService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'FeedResolver' });
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Query()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getFeed(
    @Context() ctx: AppContext,
    @Args('input', { type: () => GetFeedInput }) input: GetFeedInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<GetFeedOutput> {
    this.logger.info('getFeed()', {
      currentUserId: currentUser?.id,
      input,
    });
    ctx.feed = await this.feedService.getPostsFeed(input, currentUser);
    ctx.input = input;
    return {
      __typename: 'GetFeedResult',
      feed: this.feedService.toFeedObject(ctx.feed),
    };
  }

  @ResolveField(() => FeedPostsConnection, { name: 'postsConnection' })
  async postsConnection(
    @Parent() graphqlFeedData: Feed,
    @Args('first') first: number,
    @Args('after') after: string,
    @Args('last') last: number,
    @Args('before') before: string,
    @Args('paginationInput') paginationInput: PaginationInput | undefined,
    @Context() ctx: AppContext,
    @Context('feed') feedEntity: FeedEntity,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<FeedPostsConnection> {
    const input: GetFeedInput = ctx.input;
    if (!paginationInput) {
      //Backward compatible pagination input
      paginationInput = {
        after,
        before,
        take: first ?? last,
        order:
          input.scopeType === FeedScopeType.INNER_CIRCLE_CONSUMPTION
            ? PaginationOrder.LATEST_FIRST
            : PaginationOrder.OLDEST_FIRST,
      };
    }
    this.logger.info('postsConnection()', {
      currentUserId: currentUser?.id,
      paginationInput,
    });
    let afterCursor = paginationInput.after;
    const isPersonalizedFeed = this.isPersonalizedFeed(
      graphqlFeedData.id,
      currentUser?.id ?? ''
    );
    const isRefreshing = after === '' || !after;
    if (currentUser) {
      if (isPersonalizedFeed) {
        if (isRefreshing) {
          afterCursor = currentUser.lastSeenCursorPersonalizedFeed ?? '';
          //Soft refresh
          this.logger.info('Soft Refresh', { currentUserId: currentUser?.id });
          await this.userService.update(currentUser.id, {
            exploreFeedRefreshedAt: new Date(),
          });
          this.logger.info('updated afterCursor with', {
            afterCursor,
            currentUserId: currentUser?.id,
          });
        } else {
          if (
            currentUser.exploreFeedUpdatedAt &&
            currentUser.exploreFeedRefreshedAt
          ) {
            if (
              currentUser.exploreFeedUpdatedAt >
              currentUser.exploreFeedRefreshedAt
            ) {
              this.logger.info('!! FeedUpdate detected, updating `after`', {
                currentUserId: currentUser?.id,
              });
              afterCursor = currentUser.lastSeenCursorPersonalizedFeed ?? '';
            }
          }
        }
      }
    }
    paginationInput.after = afterCursor;
    let posts: PostEntity[];
    let hasPreviousPage: boolean;
    let hasNextPage: boolean;
    let backwardsCompatibility = true;
    if (
      currentUser &&
      input.scopeType === FeedScopeType.INNER_CIRCLE_CONSUMPTION
    ) {
      backwardsCompatibility = false;
    }
    // eslint-disable-next-line prefer-const
    [posts, hasPreviousPage, hasNextPage] =
      await this.feedService.getFilteredPosts(
        graphqlFeedData.id,
        paginationInput,
        this.postService,
        backwardsCompatibility,
        ctx.version
      );
    if (isPersonalizedFeed) {
      if (!hasNextPage || posts.length < first) {
        this.logger.info('!hasNextPage || posts.length < first', {
          hasNextPage,
          postsLength: posts.length,
          first,
        });
        if (currentUser) {
          if (currentUser.exploreFeedUpdatedAt) {
            await this.userService.update(currentUser.id, {
              hasConsumedExploreFeed: true,
              lastSeenCursorPersonalizedFeed: '',
            });
            this.logger.info('hasConsumedPersonalizedFeed = true', {
              currentUserId: currentUser?.id,
            });
            if (posts.length === 0 && isRefreshing) {
              this.logger.info('Is refreshing!', {
                currentUserId: currentUser?.id,
              });
              const [exploreFeedPosts, hasPrevPage, hasNextPg] =
                await getFilteredPosts(
                  graphqlFeedData.id,
                  feedEntity,
                  this.logger,
                  this.feedService,
                  this.postService,
                  first,
                  '',
                  last,
                  before
                );
              this.logger.info('Recycling posts', {
                currentUserId: currentUser?.id,
              });
              posts.push(...exploreFeedPosts);
              hasPreviousPage = hasPrevPage;
              hasNextPage = hasNextPg;
            }
          }
        }
      }
    }
    posts.forEach(p => {
      ctx.posts[p.id] = p;
      if (p.author) ctx.users[p.authorId] = p.author;
    });
    ctx.feedPostEntries = posts
      .map(p => this.postService.toGqlPostObject(p))
      .filter((p): p is Post => p !== undefined);
    await setupParentPostsForReposts(posts, ctx, this.postService, this.logger);
    this.logger.info('length', {
      length: posts.length,
      currentUserId: currentUser?.id,
    });
    const startCursor = _.first(ctx.feedPostEntries)?.id ?? '';
    let endCursor = _.last(ctx.feedPostEntries)?.id ?? '';
    if (startCursor == endCursor) endCursor = '';
    const pageInfo: PageInfo = {
      __typename: 'PageInfo',
      startCursor,
      endCursor,
      hasNextPage,
      hasPreviousPage,
    };
    this.logger.info('pageInfo', { pageInfo, currentUserId: currentUser?.id });
    return {
      __typename: 'FeedPostsConnection',
      pageInfo,
    };
  }

  //Helpers
  private isPersonalizedFeed(feedId: string, userId: string): boolean {
    return feedId === toFeedId(FeedEntityType.PERSONALIZED_ALL_POSTS, userId);
  }

  private isPersonalizedFollowingFeed(feedId: string, userId: string): boolean {
    return (
      feedId ===
      toFeedId(FeedEntityType.PERSONALIZED_FOLLOWING_USERS_ALL_POSTS, userId)
    );
  }

  private getPostTypeFromFeed(feedId: string): number {
    const number = Number(feedId.substring(1, 2));
    switch (number) {
      case 2:
        return 3; //Text
      case 3:
        return 2; //IMAGE
      case 4:
        return 4; //Video
      case 5:
        return 5; //Collage
      default:
        return 0; //ALL
    }
  }
}

@Resolver('FeedPostsConnection')
export class FeedPostsConnectionResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'FeedPostsConnectionResolver' });
  }

  @ResolveField(() => [FeedPostsEdge], { name: 'edges' })
  async edges(
    @Context() ctx: AppContext,
    @Parent() feedPostsConnection: FeedPostsConnection
  ) {
    const entries = ctx.feedPostEntries;
    const edges: FeedPostsEdge[] =
      entries?.map(entry => ({
        __typename: 'FeedPostsEdge',
        node: entry,
        cursor: entry.id,
      })) ?? [];
    return edges;
  }
}

@Resolver('FeedPostsEdge')
export class FeedPostsEdgeResolver {
  @ResolveField()
  async node(@Parent() parent: FeedPostsEdge): Promise<Post> {
    return parent.node;
  }
}
