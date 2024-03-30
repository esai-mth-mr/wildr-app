import { Inject, Injectable } from '@nestjs/common';
import {
  FeedEntity,
  FeedEntityType,
  RelevantPostsFeedEnumsBasedOnPostTypes,
} from '@verdzie/server/feed/feed.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { getCategoryRank } from '@verdzie/server/worker/rank-and-distribute-post/rankAndDistributePost.consumer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class RankPostService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly feedService: FeedService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async rank(args: RankFunctionArgs): Promise<RankPostResult | undefined> {
    const post = args.post;
    const user = args.user;
    const userId = user.id;
    //Calculate relevancy of the post
    let score = 0;
    //Category
    const categoryRank =
      args.categoryRank ?? getCategoryRank(post, args.categoryInterestsMap);
    if (categoryRank === 0) {
      this.logger.info('CategoryRank = 0, skipping the' + ' post', {
        userId,
        postId: post.id,
      });
      return undefined;
    }
    //PostType
    let postTypeRank = 0;
    const postType = post.type;
    if (args.postTypeInterestsMap) {
      postTypeRank = args.postTypeInterestsMap.get(`${postType}`) ?? 0;
    }
    score = (categoryRank + postTypeRank) / 2;
    //Friends and Family
    let isFriendsAndFamily = false;
    const userFriendsAndFamilyFeed =
      args.userFriendsAndFamilyFeed ??
      (await this.feedService.find(
        toFeedId(FeedEntityType.USER_FRIENDS_AND_FAMILY_USERS, userId)
      ));
    if (userFriendsAndFamilyFeed) {
      isFriendsAndFamily = userFriendsAndFamilyFeed.page.ids.includes(
        post.authorId
      );
    }
    //FavoriteAccounts
    let isFavorite = false;
    const userFavoritesFeed =
      args.userFavoritesFeed ??
      (await this.feedService.find(
        toFeedId(FeedEntityType.USER_FAVORITE_USERS, userId)
      ));
    if (userFavoritesFeed) {
      isFavorite = userFavoritesFeed.page.ids.includes(post.authorId);
    }
    //Is Following
    if (isFriendsAndFamily) score = score * 1.5;
    if (isFavorite) score = score * 1.5;
    if (!isFavorite && !isFriendsAndFamily) {
      let isFollower: undefined | boolean = args.isFollower;
      if (isFollower === undefined) {
        const userFollowingFeed = await this.feedService.find(
          // toFeedId(FeedEntityType.FOLLOWING, userId)
          user.followingFeedId ?? ''
        );
        if (userFollowingFeed) {
          isFollower = userFollowingFeed.page.ids.includes(post.authorId);
        }
      }
      if (isFollower) score = score * 1.2;
    }
    return { score, isFriendsAndFamily, isFavorite };
  }

  async rankAndReturnRelevantFeedMapEntries(
    args: RankFunctionArgs
  ): Promise<FeedEntityType_ScoreMapEntriesType | undefined> {
    const result = await this.rank(args);
    if (!result) return;
    const mapEntries: FeedEntityType_ScoreMapEntriesType = [];
    //All
    mapEntries.push({
      type: FeedEntityType.RELEVANT_ALL_POSTS,
      score: result.score,
    });
    //Specific type
    mapEntries.push({
      type: RelevantPostsFeedEnumsBasedOnPostTypes[args.post.type],
      score: result.score,
    });
    return mapEntries;
  }
}

export interface RankFunctionArgs {
  isFollower?: boolean;
  post: PostEntity;
  user: UserEntity;
  categoryRank?: number | undefined;
  postTypeInterestsMap: Map<string, number> | undefined;
  categoryInterestsMap: Map<string, number>;
  userFriendsAndFamilyFeed?: FeedEntity | undefined;
  userFavoritesFeed?: FeedEntity | undefined;
}

export interface RankPostResult {
  score: number;
  isFriendsAndFamily: boolean;
  isFavorite: boolean;
}

export type FeedEntityType_ScoreMapEntriesType = {
  type: FeedEntityType;
  score: number;
}[];
