import { Inject, Injectable } from '@nestjs/common';
import { AppContext, setupParentPostsForReposts } from '@verdzie/server/common';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { PaginationInput } from '@verdzie/server/generated-graphql';
import {
  DEFAULT_PAGE_SIZE,
  OSQueryService,
} from '@verdzie/server/open-search-v2/query/query.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostService } from '@verdzie/server/post/post.service';
import { PostVisibilityAccess } from '@verdzie/server/post/postAccessControl';
import { UserEntity } from '@verdzie/server/user/user.entity';
import _ from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class PostSearchService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly openSearchQueryService: OSQueryService,
    private readonly postService: PostService,
    private readonly feedService: FeedService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async searchForPosts({
    queryString,
    paginationInput,
    currentUser,
    context,
  }: {
    queryString: string;
    paginationInput: PaginationInput;
    context: AppContext;
    currentUser?: UserEntity;
  }): Promise<PostEntity[]> {
    const logContext = {
      queryString,
      paginationInput,
      userId: currentUser?.id,
      methodName: PostSearchService.prototype.searchForPosts.name,
    };
    this.logger.debug('searching for posts', logContext);
    // Retrieve ids of posts matching the query
    const postIds = await this.openSearchQueryService.searchPostsAndReturnIds({
      queryString,
      paginationInput: {
        ...paginationInput,
        // Get posts with a buffer in case some are hidden
        ...(paginationInput.take && { take: paginationInput.take * 2 }),
      },
    });
    this.logger.debug('found posts', {
      postIdsCount: postIds.length,
      ...logContext,
    });
    // Retrieve posts matching the ids
    const posts = (await this.postService.findAllNonExpired(postIds)).filter(
      post => post // ensure posts exist
    );
    // Filter out hidden posts
    let shownPosts: PostEntity[] = [];
    if (currentUser) {
      shownPosts = await this.filterHiddenPostsForCurrentUser(
        posts,
        currentUser
      );
    } else {
      shownPosts = this.filterHiddenPostsWithoutAuth(posts);
    }
    await setupParentPostsForReposts(
      shownPosts,
      context,
      this.postService,
      this.logger
    );
    this.logger.debug('returning posts after filtering', {
      shownPostsCount: shownPosts.length,
      ...logContext,
    });
    // Return posts (making sure not to return buffer)
    if (paginationInput.before || paginationInput.includingAndBefore) {
      return _.takeRight(shownPosts, paginationInput.take ?? DEFAULT_PAGE_SIZE);
    }
    return _.take(shownPosts, paginationInput.take ?? DEFAULT_PAGE_SIZE);
  }

  private filterHiddenPostsWithoutAuth(posts: PostEntity[]): PostEntity[] {
    return posts.filter(post => {
      if (post.isPrivate) return false;
      if (
        post.accessControl?.postVisibilityAccessData.access ===
        PostVisibilityAccess.INNER_CIRCLE
      ) {
        return false;
      }

      return true;
    });
  }

  private async filterHiddenPostsForCurrentUser(
    posts: PostEntity[],
    currentUser: UserEntity
  ): Promise<PostEntity[]> {
    const [followingFeed, blockedUserFeed, blockedByFeed] = await Promise.all([
      this.feedService.find(toFeedId(FeedEntityType.FOLLOWING, currentUser.id)),
      this.feedService.find(
        toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id)
      ),
      this.feedService.find(
        toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, currentUser.id)
      ),
    ]);
    const followingFeedIds = new Set(followingFeed?.ids ?? []);
    const blockedUserFeedIds = new Set(blockedUserFeed?.ids ?? []);
    const blockedByFeedIds = new Set(blockedByFeed?.ids ?? []);

    return posts.filter(post => {
      // Filter out private posts for non followers
      if (
        post.isPrivate &&
        post.authorId !== currentUser.id &&
        !followingFeedIds.has(post.authorId)
      ) {
        return false;
      }
      // Filter out inner circle posts for everyone
      if (
        post.accessControl?.postVisibilityAccessData.access ===
        PostVisibilityAccess.INNER_CIRCLE
      ) {
        return false;
      }
      // Filter out posts from blocked users
      if (blockedUserFeedIds.has(post.authorId)) {
        return false;
      }
      // Filter out posts from users who have blocked the current user
      if (blockedByFeedIds.has(post.authorId)) {
        return false;
      }

      return true;
    });
  }
}
