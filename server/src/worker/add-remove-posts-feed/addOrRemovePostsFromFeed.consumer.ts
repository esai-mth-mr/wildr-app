import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import {
  FeedEntity,
  FeedEntityType,
  FollowingUserPostsFeedBasedOnPostTypes,
  FollowingUserPostsFeedTypes,
  ICYMFollowingPostsFeedEnums,
  ICYMPostsFeedEnums,
  kvpToMap,
  ListPostsConsumption,
  ListPostsForConsumptionBasedOnPostTypes,
  mapToKVP,
  PersonalizedFeedEnums,
  PersonalizedFollowingFeedEnums,
  RelevantFollowingPostsFeedEnums,
  RelevantPostsFeedEnums,
  RemainingFollowingPostsFeedEnums,
  RemainingPostsFeedEnums,
} from '@verdzie/server/feed/feed.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostType } from '@verdzie/server/post/data/post-type';
import { PostService } from '@verdzie/server/post/post.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import {
  AddOrRemovePostsToFeedJob,
  RemovePostIdsFromPostFeedsJob,
} from '@verdzie/server/worker/add-remove-posts-feed/addOrRemovePostsFromFeed.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import _ from 'lodash';
import { FindConditions, MoreThan, Raw } from 'typeorm';
import {
  getPostFeedId,
  innerCircleListIdForFetchingPostsFeed,
} from '@verdzie/server/user-list/userList.helpers';
import { PostVisibilityAccess } from '@verdzie/server/post/postAccessControl';
import { ignoreInnerCirclePostsPredicate } from '@verdzie/server/post/post-repository/post.predicates';

@Processor('add-remove-posts-from-feed-queue')
export class AddOrRemovePostsFromFeedConsumer {
  private readonly batchSize: number;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private feedService: FeedService,
    private userService: UserService,
    private postService: PostService
  ) {
    this.logger = this.logger.child({
      context: 'AddOrRemovePostsFromFeedConsumer',
    });
    this.batchSize = 100;
  }

  /**
   * n = `this.batchCount`
   *
   * Process:
   * - Retrieve `n` most recent post from leaders feed.
   * - Extract `n` posts from the the the followers all posts feed.
   * - Extract posts from followers sub feeds contained in posts extracted from
   * all posts feed.
   * - Merge the leader's most recent posts with the extracted posts from the
   * followers feed.
   * - Sort the merged list.
   * - Insert the sorted list into each of the relevant feeds, replenishing them
   * with the posts extracted initially plus the leaders posts.
   *
   * @param job
   * @param followersPostTypeSpecificFeeds
   * @param reverseChronological - used for feeds stored in chronological order such
   * as inner the inner circle feeds.
   */
  private async addTheirPosts(
    job: Job<AddOrRemovePostsToFeedJob>,
    followersPostTypeSpecificFeeds: FeedEntity[],
    reverseChronological = false
  ) {
    this.logger.info('addTheirPosts()', {});
    if (
      followersPostTypeSpecificFeeds.length !==
      FollowingUserPostsFeedBasedOnPostTypes.length
    ) {
      this.logger.error(
        `param feedsBasedOnPostType must be of length ${FollowingUserPostsFeedBasedOnPostTypes.length}`
      );
      return;
    }
    this.logger.info('addTheirPosts...', {
      data: job.data,
      reverseChronological,
    });
    try {
      const followerId = job.data.whoseFeed;
      const leaderId = job.data.whosePosts;
      const leaderPostsFeed = await this.feedService.find(
        toFeedId(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS, leaderId)
      );

      /**
       * Initially modify feeds that are reverse chronological to be
       * chronological so that all feeds go through the same operations.
       */
      if (reverseChronological) {
        followersPostTypeSpecificFeeds.forEach(feed => {
          feed.page.ids.reverse();
        });
      }

      if (!leaderPostsFeed || leaderPostsFeed.page.ids.length === 0) {
        this.logger.info(
          'User To add does not have any posts feed, returning...'
        );
        return;
      }
      const isTheirInnerCircle = await this.userService.isPartOfInnerCircle(
        leaderId,
        followerId
      );
      this.logger.info('isTheirInnerCircle', {
        isInnerCircle: isTheirInnerCircle,
      });
      /**
       * Get first `n` posts where createdAt > createdAt Of the Last Post of the
       * batch
       */
      const followerAllPostsFeed = followersPostTypeSpecificFeeds[0];
      const originalLength = followerAllPostsFeed.page.ids.length;
      this.logger.info('AllPostsLength', { originalLength });
      /**
       * Removing `n` most recent posts from the feed. These posts will be
       * replaced with a new list that has the leader's posts merged in.
       */
      const startIdx = Math.max(
        followerAllPostsFeed.page.ids.length - this.batchSize,
        0
      );
      const followerPostIdsBatch = followerAllPostsFeed.page.ids.splice(
        startIdx,
        this.batchSize
      );
      /**
       * Get the most recent posts in the followers feed.
       */
      let followerPostsBatch: PostEntity[] =
        (await this.postService.findByIds(followerPostIdsBatch, {}, true)) ??
        [];
      followerPostsBatch = followerPostsBatch.filter(
        post => post !== undefined
      );
      this.logger.info("Splice out posts from currentUser's subFeeds.");
      /**
       * For each feed type of the following user, splice out all of the posts
       * that are included in the batch that is being processed. These spliced
       * out posts will be sorted and filled back based on the all posts feed
       * once we make sure that the ordering is correct.
       */
      for (
        let postType = PostType.IMAGE;
        postType <= PostType.COLLAGE;
        postType++
      ) {
        this.logger.info('type', { postType });
        const idOfOldestPostInBatch =
          _.first(followerPostsBatch.filter(post => post.type === postType))
            ?.id ?? '';
        const feed = followersPostTypeSpecificFeeds[postType];
        const oldestPostOnPageIndex = feed.page.ids.indexOf(
          idOfOldestPostInBatch
        );
        if (oldestPostOnPageIndex !== -1) {
          feed.page.ids.splice(oldestPostOnPageIndex);
        }
      }

      /**
       * Find all the posts from the leaders feed that are created after the
       * last post of the batch.
       */
      let createdAt: Date | undefined;
      if (originalLength > this.batchSize) {
        const lastPostOfTheBatch = _.first(followerPostsBatch);
        if (lastPostOfTheBatch) {
          createdAt = lastPostOfTheBatch.createdAt;
        }
      }
      let where: FindConditions<PostEntity> = {};
      if (createdAt) {
        where = {
          createdAt: MoreThan(createdAt!.toISOString()),
        };
      }
      if (!isTheirInnerCircle) {
        this.logger.info('Ignoring inner circle posts');
        where = {
          ...where,
          ...ignoreInnerCirclePostsPredicate,
        };
      }
      let leaderPosts: PostEntity[] =
        (await this.postService.findByIds(
          leaderPostsFeed.page.ids.slice(0, this.batchSize),
          {
            where,
          }
        )) ?? [];
      this.logger.info('Filtered addedUserPosts count', {
        length: leaderPosts.length,
      });

      /**
       * If the leader hasn't created any posts recently, add their 10 most
       * recent posts.
       */
      if (leaderPosts.length === 0) {
        this.logger.info('userProfilePosts.length === 0');
        leaderPosts =
          (await this.postService.findByIds(
            leaderPostsFeed.page.ids.slice(0, 10),
            {
              where: isTheirInnerCircle ? {} : ignoreInnerCirclePostsPredicate,
            }
          )) ?? [];
      }

      /**
       * Merge the leader's recent posts into the followers post batch and sort
       * them by created date such that they are in chronological order.
       */
      const sortedPosts: PostEntity[] = [
        ...followerPostsBatch,
        ...leaderPosts,
      ].sort((postA, postB) => {
        return postA.createdAt.getTime() - postB.createdAt.getTime();
      });
      this.logger.info('Total sorted posts', { length: sortedPosts.length });
      this.logger.info('Merging postIds to AllFeed', {});
      followerAllPostsFeed.page.ids.push(...sortedPosts.map(post => post.id));
      this.logger.info('Merging postIds to Sub Feed', {});

      /**
       * Add back the spiced out posts to the followers feeds (re-reversing them
       * if they were initially reverse chronological).
       */
      for (
        let postType = PostType.IMAGE;
        postType <= PostType.COLLAGE;
        postType++
      ) {
        this.logger.info('Type', { postType });
        const filteredPostIds = sortedPosts
          .filter(post => post.type === postType)
          .map(post => post.id);
        const feed = followersPostTypeSpecificFeeds[postType];
        feed.page.ids.push(...filteredPostIds);

        /**
         * If the followers feeds were initially reverse chronological, restore
         * them to being reverse chronological.
         */
        if (reverseChronological) {
          feed.page.ids.reverse();
        }
      }

      if (reverseChronological) {
        followerAllPostsFeed.page.ids.reverse();
      }

      /**
       * Update the feeds in the database with a transaction.
       */
      await this.feedService.repo.manager.transaction(
        async transactionManager => {
          for (
            let postType = PostType.IMAGE;
            postType <= PostType.COLLAGE;
            postType++
          ) {
            const feed = followersPostTypeSpecificFeeds[postType];
            await transactionManager.update(
              FeedEntity,
              { id: feed.id },
              { page: feed.page }
            );
          }

          await transactionManager.update(
            FeedEntity,
            { id: followerAllPostsFeed.id },
            { page: followerAllPostsFeed.page }
          );
        }
      );
    } catch (e) {
      this.logger.error(e);
    }
  }

  @Process('add-their-posts-job')
  async addTheirPostsToFollowingFeed(job: Job<AddOrRemovePostsToFeedJob>) {
    const feeds: FeedEntity[] = [];
    for (const type of FollowingUserPostsFeedBasedOnPostTypes) {
      if (type === -1) {
        feeds.push(new FeedEntity());
        continue;
      }
      const feed = await this.feedService.findOrCreate(
        type,
        job.data.whoseFeed
      );
      feeds.push(feed);
    }
    await this.addTheirPosts(job, feeds, true);
  }

  @Process('add-their-posts-to-inner-circle-feed-job')
  async addTheirPostsToInnerCircleFeed(job: Job<AddOrRemovePostsToFeedJob>) {
    this.logger.info('addTheirPostsToInnerCircleFeed...', {});
    const feeds: FeedEntity[] = [];
    const innerCircleId = innerCircleListIdForFetchingPostsFeed(
      job.data.whoseFeed
    );
    for (const type of ListPostsForConsumptionBasedOnPostTypes) {
      if (type === -1) {
        feeds.push(new FeedEntity());
        continue;
      }
      const id = getPostFeedId(innerCircleId, type);
      this.logger.info('Pushing feed', { id });
      const feed = await this.feedService.findOrCreateWithId(id);
      feeds.push(feed);
    }
    await this.addTheirPosts(job, feeds);
  }

  private async removePosts({
    data,
    feedsIdsToRemoveFrom,
    feedsWithIdsMapToRemoveFrom,
    findByIds,
  }: RemovePostsInput) {
    this.logger.info('removePosts...', {});
    const currentUser: UserEntity | undefined = await this.userService.findById(
      data.whoseFeed
    );
    if (!currentUser) return;
    this.logger.info('CurrentUSer', { handle: currentUser?.handle });
    let postsToRemove: PostEntity[];
    if (findByIds && findByIds.length > 0) {
      postsToRemove = (await this.postService.findByIds(findByIds, {})) ?? [];
    } else {
      if (data.whosePosts.length === 0) {
        this.printError('data.whoseFeed length = 0');
        return;
      }
      postsToRemove = await this.postService.findWithConditions({
        authorId: data.whosePosts,
      });
    }

    this.logger.info('PostsToRemove', { length: postsToRemove.length });
    const postIdsToRemove = postsToRemove.map(post => post.id);
    for (const feedId of feedsIdsToRemoveFrom) {
      const feed = await this.feedService.find(feedId);
      if (!feed) continue;
      const shouldPrintLogs = feed.page.ids.length > 0;
      if (shouldPrintLogs) {
        this.logger.info('Removing form', { type: feedId });
        this.logger.info('Size = ', { length: feed.page.ids.length });
      }
      feed.page.ids = feed.page.ids.filter(
        postId => !postIdsToRemove.includes(postId)
      );
      if (shouldPrintLogs) {
        this.logger.info('Size after deletion= ', {
          length: feed.page.ids.length,
        });
      }
      await this.feedService.save([feed]);
    }
    if (feedsWithIdsMapToRemoveFrom) {
      this.logger.info('feedsWithIdsMapToRemoveFrom found', {});
      for (const feedId of feedsWithIdsMapToRemoveFrom) {
        // const feed = await this.feedService.find(toFeedId(type, currentUser.id));
        const feed = await this.feedService.find(feedId);
        if (!feed) continue;
        const map = kvpToMap(feed.page.idsWithScore.idsMap);
        postIdsToRemove.forEach(id => {
          map.delete(id);
        });
        feed.page.idsWithScore.idsMap = mapToKVP(map);
        await this.feedService.save([feed]);
      }
    }
    this.print('Removed all their posts');
  }

  @Process('remove-their-inner-circle-posts-job')
  async removeInnerCirclePostsFromTheirFeeds(
    job: Job<AddOrRemovePostsToFeedJob>
  ) {
    this.logger.info('removeInnerCirclePostsFromTheirFeeds', {
      data: job.data,
    });
    const posts: PostEntity[] = await this.postService.repo.find({
      accessControl: Raw(
        access_control =>
          `${access_control} -> 'postVisibilityAccessData' = '{"access": ${PostVisibilityAccess.INNER_CIRCLE} }'`
      ),
      authorId: job.data.whosePosts,
    });
    if (posts.length == 0) {
      this.logger.info(
        'removeTheirInnerCirclePostsFromAllFeeds() No posts' +
          ' found, returning...',
        {}
      );
      return;
    }
    this.logger.info('remove-their-inner-circle-posts-job; Posts found', {
      length: posts.length,
    });
    const postIdsToRemove = posts.map(post => post.id);

    //From Following, Explore, and Inner Circle Consumption
    const feedsToUpdate: FeedEntity[] = [];
    for (const type of [
      ...FollowingUserPostsFeedTypes,
      ...PersonalizedFeedEnums,
    ]) {
      const id = toFeedId(type, job.data.whoseFeed);
      const feed = await this.feedService.find(id);
      if (feed) {
        feed.ids = feed.ids.filter(id => !postIdsToRemove.includes(id));
        feedsToUpdate.push(feed);
      }
    }
    const innerCircleId = innerCircleListIdForFetchingPostsFeed(
      job.data.whoseFeed
    );
    for (const type of ListPostsConsumption) {
      const id = getPostFeedId(innerCircleId, type);
      const feed = await this.feedService.find(id);
      if (feed) {
        feed.ids = feed.ids.filter(id => !postIdsToRemove.includes(id));
        feedsToUpdate.push(feed);
      }
    }
    await this.feedService.repo.manager.transaction(async entityManager => {
      for (const feed of feedsToUpdate) {
        await entityManager.update(
          FeedEntity,
          { id: feed.id },
          { page: feed.page }
        );
        this.logger.info('feed updated', { id: feed.id });
      }
    });
    this.logger.info('Updated feeds', { length: feedsToUpdate.length });
  }

  @Process('remove-their-posts-from-inner-circle-feed-job')
  async removeTheirPostsFromInnerCircleFeed(
    job: Job<AddOrRemovePostsToFeedJob>
  ) {
    this.logger.info('removeTheirPostsFromInnerCircle...', {
      data: job.data,
    });
    const innerCircleId = innerCircleListIdForFetchingPostsFeed(
      job.data.whoseFeed
    );
    this.logger.info('innerCircleId ', { innerCircleId });
    await this.removePosts({
      data: job.data,
      feedsIdsToRemoveFrom: ListPostsConsumption.map(type =>
        getPostFeedId(innerCircleId, type)
      ),
    });
  }

  @Process('remove-their-posts-job')
  async removeTheirPostsFromFollowingFeed(job: Job<AddOrRemovePostsToFeedJob>) {
    await this.removePosts({
      data: job.data,
      feedsIdsToRemoveFrom: [
        ...PersonalizedFollowingFeedEnums,
        ...PersonalizedFeedEnums,
        ...FollowingUserPostsFeedTypes,
      ].map(feedType => toFeedId(feedType, job.data.whoseFeed)),
      feedsWithIdsMapToRemoveFrom: [
        ...RelevantFollowingPostsFeedEnums,
        ...RelevantPostsFeedEnums,
        ...ICYMPostsFeedEnums,
        ...ICYMFollowingPostsFeedEnums,
        ...RemainingPostsFeedEnums,
        ...RemainingFollowingPostsFeedEnums,
      ].map(feedType => toFeedId(feedType, job.data.whoseFeed)),
    });
  }

  @Process('remove-post-ids-from-post-feeds-job')
  async removePostsIdsFromPostFeeds(job: Job<RemovePostIdsFromPostFeedsJob>) {
    this.print('removePostsIdsFromPostFeeds()');
    const whoseFeed = job.data.ownerId;
    await this.removePosts({
      data: { whoseFeed, whosePosts: '' },
      feedsIdsToRemoveFrom: [
        ...PersonalizedFollowingFeedEnums,
        ...PersonalizedFeedEnums,
        ...FollowingUserPostsFeedTypes,
      ].map(feedType => toFeedId(feedType, whoseFeed)),
      feedsWithIdsMapToRemoveFrom: [
        ...RelevantFollowingPostsFeedEnums,
        ...RelevantPostsFeedEnums,
        ...ICYMPostsFeedEnums,
        ...ICYMFollowingPostsFeedEnums,
        ...RemainingPostsFeedEnums,
        ...RemainingFollowingPostsFeedEnums,
      ].map(feedType => toFeedId(feedType, whoseFeed)),
      findByIds: job.data.postIds,
    });
  }

  printError(message: string) {
    this.logger.error(`[AddOrRemovePostsFromFeedConsumer] ${message}`);
  }

  print(message: string) {
    this.logger.info(`[AddOrRemovePostsFromFeedConsumer] ${message}`);
  }
}

export interface RemovePostsInput {
  data: AddOrRemovePostsToFeedJob;
  feedsIdsToRemoveFrom: string[];
  feedsWithIdsMapToRemoveFrom?: string[];
  findByIds?: string[];
}
