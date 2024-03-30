import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import {
  FeedEntityType,
  ICYMPostsFeedEnumsBasedOnPostTypes,
  kvpToMap,
  mapToKVP,
  RelevantPostsFeedEnumsBasedOnPostTypes,
  RemainingPostsFeedEnumsBasedOnPostTypes,
} from '@verdzie/server/feed/feed.entity';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostService } from '@verdzie/server/post/post.service';
import { UserService } from '@verdzie/server/user/user.service';
import {
  RankPostResult,
  RankPostService,
} from '@verdzie/server/worker/rank-and-distribute-post/rank-post.service';
import { RankAndDistributePostJob } from '@verdzie/server/worker/rank-and-distribute-post/rankAndDistributePost.producer';
import { UpdateUserExploreFeedProducer } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export const getCategoryRank = (
  post: PostEntity,
  categoryInterestsMap: Map<string, number>
): number => {
  const postCategoryIds = post.categoryIds;
  let categoryRank = 0;
  if (!categoryInterestsMap || !postCategoryIds) return categoryRank;
  const ranks: number[] = [];
  postCategoryIds.forEach(categoryId => {
    const rank = categoryInterestsMap.get(categoryId) ?? 0;
    if (rank > 0) {
      ranks.push(rank);
    }
  });
  const maxRank = Math.max(...ranks);
  ranks.splice(ranks.lastIndexOf(maxRank), 1);
  const sumOfRemainingRanks = Math.round(
    ranks.reduce((accumulator, rank) => accumulator + rank, 0) / 2
  );
  categoryRank = maxRank + sumOfRemainingRanks;
  return categoryRank;
};

@Processor('rank-and-distribute-post-queue')
export class RankAndDistributePostConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly postService: PostService,
    private readonly userService: UserService,
    private readonly feedService: FeedService,
    private readonly updateUserExploreFeedWorker: UpdateUserExploreFeedProducer,
    private rankPostService: RankPostService
  ) {
    console.info('RankAndDistributePostConsumer created');
    this.logger = this.logger.child({
      context: 'RankAndDistributePostConsumer',
    });
  }

  @Process('rank-distribute-post-to-user-job')
  async rankAndDistributePost(job: Job<RankAndDistributePostJob>) {
    this.logger.info('rankAndDistributePost()', { postId: job.data.postId });
    try {
      this.logger.info('rankAndDistributePost()');
      const userId = job.data.userId;
      const user = await this.userService.findById(userId);
      const post = await this.postService.findWithAuthorRelation(
        job.data.postId
      );
      if (!post) {
        this.logger.error('postNotFound', job.data);
        return;
      }
      if (!user) {
        this.logger.error('UserNotFound', job.data);
        return;
      }
      this.logger.debug('rankAndDistribute', { userId: user.id });
      let isFollower = job.data.isFollower;
      if (isFollower) {
        this.logger.info('Returning because isFollower = true');
        return;
      }
      if (user.id === post.authorId) {
        this.logger.info(
          "User's own posts should not appear on Explore feed," +
            ' hence skipping',
          { userId, postId: post.id }
        );
        return;
        // isFollower = true;
      } else if (job.data.checkIsFollowing) {
        const userFollowingFeed = await this.feedService.find(
          // toFeedId(FeedEntityType.FOLLOWING, userId)
          user.followingFeedId ?? ''
        );
        if (userFollowingFeed) {
          isFollower = userFollowingFeed.page.ids.includes(post.authorId);
        }
      }
      this.logger.info('IS FOLLOWER', { isFollower });
      const hasBlockedFromEitherSide: boolean =
        await this.userService.hasBlockedFromEitherSide({
          userA: post.author,
          userB: user,
        });
      if (hasBlockedFromEitherSide) {
        this.logger.info('hasBlockedFromEitherSide');
        return;
      }
      const categoryInterestsMap =
        await this.userService.getCategoryInterestsMap(userId);
      const postTypeInterestsMap =
        await this.userService.getPostTypeInterestsMap(userId);
      if (!user.didFinishOnboarding) {
        this.logger.info("User hasn't completed onboarding yet", { userId });
        return;
      }
      if (!categoryInterestsMap) {
        this.logger.info('CategoryInterestMap is empty', {
          userId,
        });
        return;
      }
      const result: RankPostResult | undefined =
        await this.rankPostService.rank({
          isFollower,
          post,
          user,
          categoryRank: job.data.categoryRank,
          postTypeInterestsMap,
          categoryInterestsMap,
        });
      if (!result) return;
      let score = result.score;
      if (result.score > 0) {
        //IsRelevant
        await this.updateRelevantPostsFeed({
          postId: post.id,
          userId,
          postType: post.type,
          isFollower,
          score,
        });
      }
      //Will be revisited in next sprint
      else if (result.isFavorite || result.isFriendsAndFamily) {
        //ICYM
        if (result.isFavorite) score += 2;
        if (result.isFriendsAndFamily) score += 2;
        await this.updateICYMPostsFeed({
          postId: post.id,
          userId,
          postType: post.type,
          isFollower,
          score,
        });
      } else {
        //Remaining
        if (isFollower) score += 2;
        await this.updateRemainingPostsFeed({
          postId: post.id,
          userId,
          postType: post.type,
          isFollower,
          score,
        });
      }
      await this.userService.update(userId, { subFeedUpdatedAt: new Date() });
      //TODO: Till here move to service
      this.logger.debug('Spawning updateUserMainFeed()');
      //TODO: Change the name
      await this.updateUserExploreFeedWorker.updateUserExploreFeed({
        userId,
      });
    } catch (e) {
      this.logger.error('rankAndDistributePost() error', {
        error: e,
        methodName: 'rankAndDistributePost',
      });
    }
  }

  //BootstrapPersonalizedFeed
  //InitialFeedService, PostRankingService, PersonalizedFeedService
  private async addPostAndScoreToFeed(args: {
    postId: string;
    score: number;
    userId: string;
    feedType: FeedEntityType;
  }) {
    const feed = await this.feedService.findOrCreate(
      args.feedType,
      args.userId
    );
    if (!feed.page.idsWithScore) {
      feed.page.idsWithScore = { idsMap: mapToKVP(new Map()) };
    }
    const map = kvpToMap(feed.page.idsWithScore.idsMap);
    map.set(args.postId, args.score);
    feed.page.idsWithScore.idsMap = mapToKVP(map);
    await this.feedService.save([feed]);
  }

  private async updateRelevantPostsFeed(args: {
    postId: string;
    score: number;
    userId: string;
    isFollower: boolean | undefined;
    postType: number;
  }) {
    this.logger.debug(' updateRelevantPostsFeed', { ...args });
    const isFollower = args.isFollower;
    const postType = args.postType;
    const feedTypes: FeedEntityType[] = [];
    feedTypes.push(FeedEntityType.RELEVANT_ALL_POSTS);
    feedTypes.push(RelevantPostsFeedEnumsBasedOnPostTypes[postType]);
    // if (isFollower) {
    //   feedTypes.push(FeedEntityType.RELEVANT_FOLLOWING_USERS_ALL_POSTS);
    //   feedTypes.push(RelevantFollowingPostsFeedEnumsBasedOnPostTypes[postType]);
    // }
    for (const feedType of feedTypes) {
      await this.addPostAndScoreToFeed({
        feedType,
        postId: args.postId,
        userId: args.userId,
        score: args.score,
      });
    }
  }

  private async updateICYMPostsFeed(args: {
    postId: string;
    score: number;
    userId: string;
    isFollower: boolean | undefined;
    postType: number;
  }) {
    this.logger.debug(' updateICYM', { args });
    const isFollower = args.isFollower;
    const postType = args.postType;
    const feedTypes: FeedEntityType[] = [];
    feedTypes.push(FeedEntityType.ICYM_ALL_POSTS);
    feedTypes.push(ICYMPostsFeedEnumsBasedOnPostTypes[postType]);
    // if (isFollower) {
    //   feedTypes.push(FeedEntityType.ICYM_FOLLOWING_USERS_ALL_POSTS);
    //   feedTypes.push(ICYMFollowingPostsFeedEnumsBasedOnPostTypes[postType]);
    // }
    for (const feedType of feedTypes) {
      await this.addPostAndScoreToFeed({
        feedType,
        postId: args.postId,
        userId: args.userId,
        score: args.score,
      });
    }
  }

  private async updateRemainingPostsFeed(args: {
    postId: string;
    score: number;
    userId: string;
    isFollower: boolean | undefined;
    postType: number;
  }) {
    this.logger.debug(' updateRemaining', { args });
    const isFollower = args.isFollower;
    const postType = args.postType;
    const feedTypes: FeedEntityType[] = [];
    feedTypes.push(FeedEntityType.REMAINING_ALL_POSTS);
    feedTypes.push(RemainingPostsFeedEnumsBasedOnPostTypes[postType]);
    // if (isFollower) {
    //   feedTypes.push(FeedEntityType.REMAINING_FOLLOWING_USERS_ALL_POSTS);
    //   feedTypes.push(
    //     RemainingFollowingPostsFeedEnumsBasedOnPostTypes[postType]
    //   );
    // }
    for (const feedType of feedTypes) {
      await this.addPostAndScoreToFeed({
        feedType,
        postId: args.postId,
        userId: args.userId,
        score: args.score,
      });
    }
  }
}
