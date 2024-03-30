import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { getDayDiff } from '@verdzie/server/common';
import {
  FeedEntity,
  FeedEntityType,
  FeedsForBuildingUserPersonalizedFeed,
  mapToKVP,
  RelevantPostsFeedEnums,
} from '@verdzie/server/feed/feed.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { PostService } from '@verdzie/server/post/post.service';
import { UserService } from '@verdzie/server/user/user.service';
import { PrepareInitialFeedJob } from '@verdzie/server/worker/prepare-initial-feed/prepareInitialFeed.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { getCategoryRank } from '@verdzie/server/worker/rank-and-distribute-post/rankAndDistributePost.consumer';
import { In, IsNull, MoreThanOrEqual, Not, Raw } from 'typeorm';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { FindConditions } from 'typeorm/find-options/FindConditions';
import { UpdateUserExploreFeedProducer } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.producer';
import {
  FeedEntityType_ScoreMapEntriesType,
  RankPostService,
} from '@verdzie/server/worker/rank-and-distribute-post/rank-post.service';

@Processor('prepare-initial-feed-queue')
export class PrepareInitialFeedConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly feedService: FeedService,
    private readonly userService: UserService,
    private readonly rankPostService: RankPostService,
    private readonly postService: PostService,
    private readonly updateUserExploreFeedWorker: UpdateUserExploreFeedProducer
  ) {
    console.log(`prepareInitialFeedConsumer created`);
    this.logger = this.logger.child({ context: 'prepareInitialFeedConsumer' });
  }

  @Process('prepareInitialFeed-job')
  async doJob(job: Job<PrepareInitialFeedJob>) {
    this.logger.info('Preparing initial feed for ', {
      userId: job.data.userId,
    });
    const userId = job.data.userId;
    const user = await this.userService.findById(userId);
    if (!user) {
      this.logger.info('user not found', { userId });
      return;
    }
    if (!user.didFinishOnboarding) {
      this.logger.info('user did not finish onboarding', { userId });
      return;
    }
    const categoryInterestsMap = await this.userService.getCategoryInterestsMap(
      userId
    );
    if (!categoryInterestsMap) {
      this.logger.info("User doesn't have category interests map");
      return;
    }
    let posts = await this.findPosts(categoryInterestsMap);
    if (posts.length < 50) {
      this.logger.info('Trying again --------------------------------', {
        length: posts.length,
      });
      posts = await this.findPosts(categoryInterestsMap, 200, false);
    }
    this.logger.info('New Size after Trying again', { length: posts.length });
    await this.clearAllPersonalizedFeedRelatedData(userId);
    this.logger.info('Cleared everything');
    const postTypeInterestsMap = await this.userService.getPostTypeInterestsMap(
      userId
    );
    const userFriendsAndFamilyFeed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_FRIENDS_AND_FAMILY_USERS, userId)
    );
    const userFavoritesFeed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_FAVORITE_USERS, userId)
    );
    let checkDateIndex = 50;
    let distributeCount = 0;

    const feedTypeScoreEntryMap: Map<FeedEntityType, MapEntryType[]> =
      new Map();
    for (const type of RelevantPostsFeedEnums) {
      feedTypeScoreEntryMap.set(type, []);
    }
    for (const post of posts) {
      const categoryRank = getCategoryRank(post, categoryInterestsMap);
      if (categoryRank === 0) {
        this.logger.info('Skipping post, category not included');
        continue;
      }
      const entries: FeedEntityType_ScoreMapEntriesType | undefined =
        await this.rankPostService.rankAndReturnRelevantFeedMapEntries({
          isFollower: undefined,
          post,
          user,
          categoryRank,
          postTypeInterestsMap,
          categoryInterestsMap,
          userFavoritesFeed,
          userFriendsAndFamilyFeed,
        });
      if (!entries) continue;
      for (const entry of entries) {
        const list: MapEntryType[] =
          feedTypeScoreEntryMap.get(entry.type) ?? [];
        list.push({ postId: post.id, score: entry.score });
        feedTypeScoreEntryMap.set(entry.type, list);
      }
      distributeCount++;
      if (distributeCount === checkDateIndex) {
        if (getDayDiff(new Date(), post.createdAt) <= 14) {
          checkDateIndex += Math.round(checkDateIndex / 2);
        } else {
          this.logger.info('No longer adding posts from GlobalFeed');
          break;
        }
      }
    }
    this.logger.info('Total Posts Distributed', { distributeCount });
    const feedTypeFeedEntityMap: Map<FeedEntityType, FeedEntity> = new Map();
    for (const type of RelevantPostsFeedEnums) {
      feedTypeFeedEntityMap.set(
        type,
        await this.feedService.findOrCreate(type, userId)
      );
    }
    for (const relevantFeedType of RelevantPostsFeedEnums) {
      const entries: MapEntryType[] | undefined =
        feedTypeScoreEntryMap.get(relevantFeedType);
      // this.logger.info('Type =', { relevantFeedType });
      if (!entries) {
        this.logger.info('Entries null');
        continue;
      }
      const feed = feedTypeFeedEntityMap.get(relevantFeedType);
      if (!feed) {
        this.logger.info('Feed not found');
        continue;
      }
      //Create kvp
      const map = new Map<string, number>();
      for (const entry of entries) {
        map.set(entry.postId, entry.score);
      }
      feed.page.idsWithScore.idsMap = mapToKVP(map);
      feedTypeFeedEntityMap.set(relevantFeedType, feed);
    }
    await this.feedService.save([...feedTypeFeedEntityMap.values()]);
    await this.updateUserExploreFeedWorker.updateUserExploreFeed({ userId });
  }

  private async clearAllPersonalizedFeedRelatedData(userId: string) {
    this.logger.debug('clearAllPersonalizedFeedRelatedData()');
    const feedsToSave: FeedEntity[] = [];
    for (const type of FeedsForBuildingUserPersonalizedFeed) {
      const feed = await this.feedService.find(toFeedId(type, userId));
      if (feed) {
        feed.page = { ids: [], idsWithScore: { idsMap: {} } };
        feedsToSave.push(feed);
      } else {
        this.logger.info('Feed is empty');
      }
    }
    await this.feedService.save(feedsToSave);
    await this.userService.update(userId, {
      exploreFeedUpdatedAt: undefined,
      subFeedUpdatedAt: undefined,
      lastSeenCursorPersonalizedFeed: undefined,
      lastSeenCursorPersonalizedFollowingFeed: undefined,
      hasConsumedExploreFeed: false,
      hasConsumedPersonalizedFollowingsFeed: false,
    });
  }

  private async findPosts(
    categoryInterestsMap: Map<string, number>,
    take = 200,
    shouldIncludeDateCheck = true
  ): Promise<PostEntity[]> {
    const categoryIds: string[] = Array.from(categoryInterestsMap.keys());
    if (categoryIds.length === 0) {
      return [];
    }
    let categoryIdsStr = '';
    categoryIds.forEach(catId => (categoryIdsStr += `'${catId}',`));
    categoryIdsStr = categoryIdsStr.slice(0, -1);
    const annotatedUndistributedPostsFeed =
      await this.feedService.getAnnotatedUndistributedPostsFeed(); //Because CRON will take care of them
    const annotatedUndistributedPostIds =
      annotatedUndistributedPostsFeed.page.ids;
    let where: FindConditions<PostEntity> = {
      willBeDeleted: IsNull(),
      state: Raw(alias => `(${alias} IS NULL OR ${alias} = 0)`),
      categoryIds: Raw(
        categoryIds => `${categoryIds} && array[${categoryIdsStr}]::varchar[]`
      ),
      isPrivate: false,
      id: Not(In(annotatedUndistributedPostIds)),
      expiry: Raw(expiry => {
        const condition = `${expiry} >= timestamp '${new Date().toISOString()}'`;
        return `(${expiry} IS NULL OR ${condition})`;
      }),
    };
    if (shouldIncludeDateCheck)
      where = {
        ...where,
        createdAt: MoreThanOrEqual(new Date(Date.now() - 12096e5)),
      };
    try {
      return await this.postService.repo.findByOptions({
        where,
        order: { createdAt: 'DESC' },
        take,
      });
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }
}

type MapEntryType = { postId: string; score: number };
