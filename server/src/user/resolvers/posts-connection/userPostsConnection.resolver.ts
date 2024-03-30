import { Inject } from '@nestjs/common';
import { Args, Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import {
  kEmptyGqlPageInfo,
  UserService,
} from '@verdzie/server/user/user.service';
import _ from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AppContext, setupParentPostsForReposts } from '../../../common';
import { FeedService, toFeedId } from '../../../feed/feed.service';
import {
  Post,
  User,
  UserPostsConnection,
  UserPostsEdge,
} from '../../../graphql';
import { getFilteredPosts, PostService } from '../../../post/post.service';
import { UserEntity } from '../../user.entity';
import {
  ignoreRepostsPredicate,
  ignoreInnerCirclePostsPredicate,
} from '@verdzie/server/post/post-repository/post.predicates';
import { canShowReposts } from '@verdzie/server/data/common';
import { FindConditions } from 'typeorm';
import { PostEntity } from '@verdzie/server/post/post.entity';

@Resolver('User')
export class UserPostsConnectionsResolver {
  constructor(
    private postService: PostService,
    private feedService: FeedService,
    private userService: UserService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({
      context: 'UserPostsConnectionsResolver',
    });
  }

  async canAccessPrivateFeed(
    userToGet: UserEntity,
    currentUser?: UserEntity,
    userToGetGqlObj?: User
  ): Promise<boolean> {
    if (currentUser) {
      if (userToGet.id === currentUser.id) {
        return true;
      } else {
        if (userToGetGqlObj && userToGetGqlObj.currentUserContext) {
          if (userToGetGqlObj.currentUserContext.followingUser) {
            return true;
          }
        } else {
          return await this.userService.isFollowing(
            currentUser.id,
            userToGet.id
          );
        }
      }
    }
    return false;
  }

  async isInnerCircle(
    userToGet: UserEntity,
    currentUser?: UserEntity,
    parent?: User
  ): Promise<boolean> {
    if (currentUser) {
      if (userToGet.id === currentUser.id) {
        return true;
      } else {
        if (parent && parent.currentUserContext) {
          if (parent.currentUserContext.isInnerCircle) {
            return true;
          }
        } else {
          return await this.userService.isPartOfInnerCircle(
            userToGet.id,
            currentUser.id
          );
        }
      }
    }
    return false;
  }

  @ResolveField(() => UserPostsConnection, { name: 'postsConnection' })
  async postsConnection(
    @Args('first') first: number,
    @Args('after') after: string,
    @Args('last') last: number,
    @Args('before') before: string,
    @Context() ctx: AppContext,
    @Parent() userToGetGqlObj?: User,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<UserPostsConnection> {
    const kEmptyUserPostsConnection: UserPostsConnection = {
      __typename: 'UserPostsConnection',
      pageInfo: kEmptyGqlPageInfo,
    };
    const userToGet = ctx.user;
    this.logger.info('userIds', {
      currentUserId: currentUser?.id,
      userToGet: ctx.user?.id,
    });
    if (!userToGet) return kEmptyUserPostsConnection;
    const canAccessPrivateFeed = await this.canAccessPrivateFeed(
      userToGet,
      currentUser,
      userToGetGqlObj
    );
    // let currentUserPostFeed = await this.feedService.find(canAccessPrivateFeed
    //   ? toFeedId(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS, userToGet.id)
    //   : toFeedId(FeedEntityType.USER_PROFILE_PUB_ALL_POSTS, userToGet.id));
    let currentUserPostFeed = await this.feedService.find(
      canAccessPrivateFeed
        ? toFeedId(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS, userToGet.id)
        : toFeedId(FeedEntityType.USER_PROFILE_PUB_ALL_POSTS, userToGet.id)
    );
    if (!currentUserPostFeed) {
      this.logger.warn('No posts feed found for user', {
        user: userToGet.id,
      });
      return kEmptyUserPostsConnection;
    }
    //Backwards compatibility
    if (currentUserPostFeed.page.ids.length === 0) {
      currentUserPostFeed = await this.feedService.find(
        canAccessPrivateFeed
          ? toFeedId(FeedEntityType.USER_PUB_PVT_POSTS, userToGet.id)
          : toFeedId(FeedEntityType.USER_PUB_POSTS, userToGet.id)
      );
    }
    if (!currentUserPostFeed) {
      this.logger.warn('No posts feed found for user again', {
        user: userToGet.id,
      });
      return kEmptyUserPostsConnection;
    }
    const isInnerCircle = await this.isInnerCircle(
      userToGet,
      currentUser,
      userToGetGqlObj
    );
    let predicate: FindConditions<PostEntity> | undefined = isInnerCircle
      ? undefined
      : ignoreInnerCirclePostsPredicate;

    if (!canShowReposts(ctx.version)) {
      this.logger.info('version is less required Repost version', {
        version: ctx.version,
      });
      predicate = { ...ignoreRepostsPredicate, ...predicate };
    }
    const [posts, hasPreviousPage, hasNextPage] = await getFilteredPosts(
      currentUserPostFeed.id,
      currentUserPostFeed,
      this.logger,
      this.feedService,
      this.postService,
      first,
      after,
      last,
      before,
      predicate
    );
    ctx.feedPostEntries = posts
      .map(post => {
        ctx.posts[post.id] = post;
        if (post.author) ctx.users[post.authorId] = post.author;
        return this.postService.toGqlPostObject(post);
      })
      .filter((p): p is Post => p !== undefined);
    await setupParentPostsForReposts(posts, ctx, this.postService, this.logger);
    const startCursor = _.first(ctx.feedPostEntries)?.id ?? '';
    let endCursor = _.last(ctx.feedPostEntries)?.id ?? '';
    if (startCursor == endCursor) {
      endCursor = '';
    }
    return {
      __typename: 'UserPostsConnection',
      pageInfo: {
        __typename: 'PageInfo',
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }
}

@Resolver('UserPostsConnection')
export class UserPostsConnectionResolver {
  @ResolveField(() => [UserPostsEdge], { name: 'edges' })
  async edges(@Context() ctx: AppContext) {
    if (ctx.hasBlockedUserToGet === true) {
      return [];
    }
    if (ctx.isAvailable === false) {
      return [];
    }
    const entries = ctx.feedPostEntries;
    const edges: UserPostsEdge[] =
      entries?.map(entry => ({
        __typename: 'UserPostsEdge',
        node: entry,
        cursor: entry.id,
      })) ?? [];
    return edges;
  }
}
