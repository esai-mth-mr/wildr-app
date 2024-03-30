import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { isEmptyObject } from '@verdzie/server/data/common';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import {
  ConsumedPostsFeedEnums,
  ConsumedPostsFeedTypes,
  FeedEntity,
  FeedEntityType,
  FeedsForBuildingUserPersonalizedFeed,
  getRelevantPostFeedEnumFromPersonalizedFeedEnum,
  isFeedType,
  PersonalizedFeedEnums,
  PersonalizedSubFeedTypes,
  RelevantPostsFeedTypes,
} from '@verdzie/server/feed/feed.entity';
import {
  toFeedId,
  FeedNotFoundException,
} from '@verdzie/server/feed/feed.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  UPDATE_USER_EXPLORE_FEED_QUEUE_NAME,
  UPDATE_USER_MAIN_FEED_JOB_NAME,
  UpdateUserMainFeedJob,
} from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.producer';
import { UpdateViewCountProducer } from '@verdzie/server/worker/update-view-count/updateViewCount.producer';
import assert from 'assert';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Connection, QueryRunner, Repository } from 'typeorm';
import { Logger } from 'winston';

const feedEnumsForExploreFeedUpdate = [
  ...FeedsForBuildingUserPersonalizedFeed,
  ...ConsumedPostsFeedEnums,
];

type ExploreFeedsByType = {
  [key in
    | PersonalizedSubFeedTypes
    | RelevantPostsFeedTypes
    | ConsumedPostsFeedTypes]: FeedEntity;
};

@Processor(UPDATE_USER_EXPLORE_FEED_QUEUE_NAME)
export class UpdateUserExploreFeedConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectConnection()
    private readonly connection: Connection,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly updateViewCountProducer: UpdateViewCountProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(UPDATE_USER_MAIN_FEED_JOB_NAME)
  async updateUserExploreFeedsInTxn({
    data: { userId },
  }: Job<UpdateUserMainFeedJob>): Promise<void> {
    let queryRunner: QueryRunner | undefined;
    try {
      this.logger.info('adding relevant posts to explore feeds', { userId });
      const user = await this.userRepo.findOne(userId, {
        select: [
          UserEntity.kFields.id,
          UserEntity.kFields.lastSeenCursorPersonalizedFeed,
          UserEntity.kFields.feedCursors,
        ],
      });
      if (!user) {
        this.logger.error('user not found', { userId });
        return;
      }
      queryRunner = this.connection.createQueryRunner();
      await queryRunner.startTransaction();
      const feedByTypeResult = await this.getExploreFeedsByType({
        userId,
        queryRunner,
      });
      if (feedByTypeResult.isErr()) throw feedByTypeResult.error;
      const exploreFeedUpdateResult = await this.updateUserExploreFeeds({
        user,
        feedByType: feedByTypeResult.value,
        queryRunner,
      });
      if (exploreFeedUpdateResult.isErr()) throw exploreFeedUpdateResult.error;
      await queryRunner.commitTransaction();
      this.logger.info('relevant posts added to explore feed', { userId });
    } catch (error) {
      await queryRunner?.rollbackTransaction().catch(error => {
        this.logger.warn('error rolling back transaction', { error, userId });
        throw error;
      });
      throw error;
    } finally {
      await queryRunner?.release();
    }
  }

  private async updateUserExploreFeeds({
    user,
    feedByType,
    queryRunner,
  }: {
    user: UserEntity;
    feedByType: ExploreFeedsByType;
    queryRunner: QueryRunner;
  }): Promise<
    Result<
      {
        allPostsFeed: FeedEntity;
        relevantPostsFeed: FeedEntity;
      },
      InternalServerErrorException
    >
  > {
    try {
      const {
        hasUnconsumedPosts,
        hasNewRelevantPosts,
        recentlyConsumedPostIds,
      } = this.removeConsumedPostsFromFeeds({
        user,
        allPostsFeed: feedByType[FeedEntityType.PERSONALIZED_ALL_POSTS],
        relevantPostsFeed: feedByType[FeedEntityType.RELEVANT_ALL_POSTS],
      });
      const updatedFeeds = PersonalizedFeedEnums.map(type =>
        this.addRelevantPostsToExploreFeed({
          exploreFeed: feedByType[type],
          relevantPostsFeed:
            feedByType[getRelevantPostFeedEnumFromPersonalizedFeedEnum(type)],
        })
      )
        .filter(result => result.changed)
        .map(results => [results.exploreFeed, results.relevantPostsFeed])
        .flat();
      const tasks: Promise<any>[] = [
        ...updatedFeeds.map(f =>
          queryRunner.manager
            .getRepository(FeedEntity)
            .upsert(f, [FeedEntity.kFields.id])
        ),
      ];
      if (recentlyConsumedPostIds.length) {
        tasks.push(
          this.updateViewCountProducer.updateViewCount({
            userId: user.id,
            postIds: recentlyConsumedPostIds,
          })
        );
      }
      if (recentlyConsumedPostIds.length) {
        const consumedPostsFeed = feedByType[FeedEntityType.CONSUMED_ALL_POSTS];
        consumedPostsFeed.page.ids = Array.from(
          new Set([...recentlyConsumedPostIds, ...consumedPostsFeed.page.ids])
        );
        tasks.push(
          queryRunner.manager
            .getRepository(FeedEntity)
            .upsert(consumedPostsFeed, [FeedEntity.kFields.id])
        );
        this.logger.info('adding consumed posts feed to consumed posts feed', {
          userId: user.id,
          consumedPostsFeedLength: consumedPostsFeed.page.ids.length,
        });
      }
      if (
        hasUnconsumedPosts ||
        hasNewRelevantPosts ||
        recentlyConsumedPostIds.length
      ) {
        tasks.push(
          queryRunner.manager
            .getRepository(UserEntity)
            .createQueryBuilder()
            .update(UserEntity)
            .set({
              // We should only update the user's cursor on the explore feed if
              // there is something new to see such as new relevant posts or
              // posts in the old feed they haven't consumed yet. Otherwise they
              // will get sent to the top of a feed that hasn't changed.
              ...((hasUnconsumedPosts || hasNewRelevantPosts) && {
                lastSeenCursorPersonalizedFeed: '',
                exploreFeedUpdatedAt: new Date(),
                hasConsumedExploreFeed: false,
              }),
              // We only need to update the startOfConsumed cursor if there are
              // new consumed posts as they extend the start of consumed.
              // Otherwise the startOfConsumed cursor remains constant.
              ...(recentlyConsumedPostIds.length && {
                feedCursors: () =>
                  `jsonb_set(COALESCE(feed_cursors, '{}'), '{startOfConsumed}', '"${recentlyConsumedPostIds[0]}"'::jsonb, true)`,
              }),
            })
            .where('id = :id', { id: user.id })
            .execute()
        );
      }
      await Promise.all(tasks);
      return ok({
        allPostsFeed: feedByType[FeedEntityType.PERSONALIZED_ALL_POSTS],
        relevantPostsFeed: feedByType[FeedEntityType.RELEVANT_ALL_POSTS],
      });
    } catch (error) {
      return err(
        new InternalServerErrorException('error updating user explore feed', {
          userId: user.id,
          error,
        })
      );
    }
  }

  /**
   * Removes the unconsumed posts from the all posts feed and removes consumed
   * posts from the relevant posts feed. This allows us to safely add all of the
   * relevant posts to the top of the explore feed without creating duplicates.
   */
  private removeConsumedPostsFromFeeds({
    user,
    allPostsFeed,
    relevantPostsFeed,
  }: {
    user: UserEntity;
    allPostsFeed: FeedEntity;
    relevantPostsFeed: FeedEntity;
  }): {
    recentlyConsumedPostIds: string[];
    hasUnconsumedPosts: boolean;
    hasNewRelevantPosts: boolean;
  } {
    const allPostsFeedIds = allPostsFeed.page.ids;
    // The index of the post the user has scrolled to on the current feed.
    const recentlyConsumedIndex = allPostsFeedIds.indexOf(
      user.lastSeenCursorPersonalizedFeed || ''
    );
    // The ids of the posts that the user has scrolled to on the current feed.
    const recentlyConsumedPostIds = allPostsFeedIds.slice(
      0,
      recentlyConsumedIndex + 1
    );
    // The index marking the start of posts that the user consumed as of the
    // last time we updated their explore feed. These are the posts that we
    // marked as consumed before this update.
    const previouslyConsumedIndex = allPostsFeedIds.indexOf(
      user.feedCursors?.startOfConsumed || ''
    );
    this.logger.info('removing consumed posts from explore feed', {
      userId: user.id,
      allPostsFeedLength: allPostsFeedIds.length,
      recentlyConsumedPostIdsLength: recentlyConsumedPostIds.length,
    });
    // If they haven't scrolled to the start of the old posts they have
    // unconsumed posts between the consumed posts and start of old posts
    // that we will want to move to the top.
    const hasUnconsumedPosts = previouslyConsumedIndex > recentlyConsumedIndex;
    if (hasUnconsumedPosts) {
      // We splice out the unconsumed posts so that they can be added to the top
      // from the relevant posts feed without creating duplicates.
      assert(previouslyConsumedIndex >= 0);
      allPostsFeedIds.splice(
        recentlyConsumedIndex + 1,
        previouslyConsumedIndex - recentlyConsumedIndex - 1
      );
    }
    // Delete the consumed posts from the relevant posts map so that they aren't
    // re-added when we add the relevant posts (including unconsumed posts) to
    // the explore feed.
    const relevantPostsFeedIdsMap = relevantPostsFeed.page.idsWithScore.idsMap;
    const hasNewRelevantPosts =
      Object.keys(relevantPostsFeedIdsMap).length > previouslyConsumedIndex;
    for (const postId of recentlyConsumedPostIds) {
      delete relevantPostsFeedIdsMap[postId];
    }
    this.logger.info('removed consumed posts from relevant feed', {
      userId: user.id,
      allPostsFeedLength: allPostsFeedIds.length,
      relevantPostFeedLength: Object.keys(relevantPostsFeedIdsMap).length,
      hasUnconsumedPosts,
      hasNewRelevantPosts,
    });
    return {
      recentlyConsumedPostIds,
      hasUnconsumedPosts,
      hasNewRelevantPosts,
    };
  }

  /**
   * Add the relevant posts into the top of a corresponding explore feed
   * ordering them by score. Relevant posts include any newly recommended posts
   * as well as unconsumed posts. Sub feeds blindly add the relevant posts to
   * the top of the explore feed because we don't keep track of cursors for them
   * in order to determine which posts the user has consumed. Because of this
   * we clear out the relevant posts feed for each sub feed after adding them to
   * the explore feed.
   */
  private addRelevantPostsToExploreFeed({
    exploreFeed,
    relevantPostsFeed,
  }: {
    exploreFeed: FeedEntity;
    relevantPostsFeed: FeedEntity;
  }): {
    exploreFeed: FeedEntity;
    relevantPostsFeed: FeedEntity;
    changed: boolean;
  } {
    const relevantPostsScoreById =
      relevantPostsFeed.page.idsWithScore.idsMap ?? {};
    if (isEmptyObject(relevantPostsScoreById))
      return { exploreFeed, relevantPostsFeed, changed: false };
    // Sorting high to low as explore feeds are left to right
    const sortedPostIds = Object.entries(relevantPostsScoreById)
      .sort((a, b) => b[1] - a[1])
      .map(a => a[0]); // Only return the post id (key) from the tuple
    // Make sure that duplicates cannot occur as it will cause feed to loop
    exploreFeed.page.ids = Array.from(
      new Set([...sortedPostIds, ...exploreFeed.page.ids])
    );
    // Reset the relevant posts feed as they have been added to the explore
    // feed. We only do this for all posts feed for new users to allow for a
    // base line of consumed posts to determine location of unconsumed posts.
    if (
      !isFeedType({
        feed: relevantPostsFeed,
        type: FeedEntityType.RELEVANT_ALL_POSTS,
      }) ||
      exploreFeed.page.ids.length ===
        Object.keys(relevantPostsFeed.page.idsWithScore.idsMap).length
    ) {
      relevantPostsFeed.page.idsWithScore.idsMap = {};
    }
    return {
      exploreFeed,
      relevantPostsFeed,
      changed: true,
    };
  }

  private async getExploreFeedsByType({
    userId,
    queryRunner,
  }: {
    userId: string;
    queryRunner: QueryRunner;
  }): Promise<
    Result<
      ExploreFeedsByType,
      FeedNotFoundException | InternalServerErrorException
    >
  > {
    try {
      const feedRepo = queryRunner.manager.getRepository(FeedEntity);
      const feedsByType = {} as ExploreFeedsByType;
      const feeds = await feedRepo.findByIds(
        feedEnumsForExploreFeedUpdate.map(type => toFeedId(type, userId))
      );
      const newFeeds = feedEnumsForExploreFeedUpdate
        .filter(type => !feeds.find(feed => isFeedType({ feed, type })))
        .map(type => {
          const feed = new FeedEntity();
          feed.id = toFeedId(type, userId);
          return feed;
        });
      feeds.push(...newFeeds);
      for (const type of feedEnumsForExploreFeedUpdate) {
        const feed = feeds.find(feed => isFeedType({ feed, type }));
        if (!feed)
          return err(new FeedNotFoundException({ feedType: type, userId }));
        feedsByType[type] = feed;
      }
      return ok(feedsByType);
    } catch (error) {
      return err(
        new InternalServerErrorException('error getting feeds', {
          userId,
          error,
        })
      );
    }
  }
}
