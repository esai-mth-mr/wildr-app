import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FeedCursor,
  FeedEntity,
  FeedEntityType,
  FeedPage,
  FollowingUserPostsFeedBasedOnPostTypes,
  GlobalPostsFeedTypesBasedOnPostTypes,
  PersonalizedPostsFeedBasedOnPostTypes,
  toCursor,
} from '@verdzie/server/feed/feed.entity';
import {
  Feed as GqlFeed,
  FeedScopeType,
  FeedType as GqlFeedType,
  GetFeedInput,
  PaginationInput,
  PaginationOrder,
} from '@verdzie/server/generated-graphql';
import { UserEntity } from '@verdzie/server/user/user.entity';
import _ from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  DeleteResult,
  FindConditions,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Logger } from 'winston';
import {
  EntitiesWithPagesCommon,
  FilterPaginateEntriesPredicate,
  GetAllEntriesResponse,
  PageCursor,
  PageIdsAndInfo,
  PaginateEntriesResponse,
  RemoveEntryResult,
  ReplaceEntryInput,
  TryAndPushItemToEntityResult,
  upsertPageNumberToId,
} from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostService } from '@verdzie/server/post/post.service';
import {
  getListPostConsumptionFeedId,
  innerCircleListIdForFetchingPostsFeed,
} from '@verdzie/server/user-list/userList.helpers';
import { WildrSpan } from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import { ignoreRepostsPredicate } from '@verdzie/server/post/post-repository/post.predicates';
import {
  canShowReposts,
  DEFAULT_PAGINATION_COUNT,
  preserveOrderByIds,
} from '@verdzie/server/data/common';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';
import { POSTGRES_UNIQUE_VIOLATION_CODE } from '@verdzie/server/typeorm/postgres-driver.constants';
import {
  DebugData,
  NotFoundException,
  NotFoundExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';
import { Result, ResultAsync, err, fromPromise, ok } from 'neverthrow';
import {
  PostgresQueryFailedException,
  PostgresTransactionFailedException,
} from '@verdzie/server/typeorm/postgres-exceptions';
import { fromTransaction } from '@verdzie/server/common/transaction-result';

export const FEED_ID_SEPARATOR = ':';
export const REPOST_MIN_VERSION = '1.4.0';
export const CHALLENGE_MIN_VERSION = '1.6.0';

/**
 * @returns FeedEntityType # id
 */
export const toFeedId = (
  feedType: FeedEntityType,
  id: string,
  ...extraIds: string[]
): string => {
  return [feedType, id, ...(extraIds ?? [])].join(FEED_ID_SEPARATOR);
};

export const GLOBAL_ALL_POSTS_FEED_ID = toFeedId(
  FeedEntityType.GLOBAL_ALL_POSTS,
  ''
);
export const GLOBAL_TEXT_POSTS_FEED_ID = toFeedId(
  FeedEntityType.GLOBAL_TEXT_POSTS,
  ''
);
export const GLOBAL_IMAGE_POSTS_FEED_ID = toFeedId(
  FeedEntityType.GLOBAL_IMAGE_POSTS,
  ''
);
export const GLOBAL_VIDEO_POSTS_FEED_ID = toFeedId(
  FeedEntityType.GLOBAL_VIDEO_POSTS,
  ''
);
export const GLOBAL_COLLAGE_POSTS_FEED_ID = toFeedId(
  FeedEntityType.GLOBAL_COLLAGE_POST,
  ''
);

export const UNANNOTATED_POSTS_FEED_ID = toFeedId(
  FeedEntityType.UNANNOTATED_POSTS,
  ''
);
export const ANNOTATED_UNDISTRIBUTED_POSTS_FEED_ID = toFeedId(
  FeedEntityType.ANNOTATED_UNDISTRIBUTED_POSTS,
  ''
);
export const ANNOTATED_DISTRIBUTION_IN_PROGRESS_POSTS_FEED_ID = toFeedId(
  FeedEntityType.ANNOTATED_DISTRIBUTION_IN_PROGRESS_POSTS,
  ''
);

export const getParentIdFromFeedId = (feedId: string): string => {
  const feedIdParts = feedId.split(FEED_ID_SEPARATOR);
  return feedIdParts[1];
};

export const getFeedTypeFromFeedId = (feedId: string): FeedEntityType => {
  const feedIdParts = feedId.split(FEED_ID_SEPARATOR);
  return parseInt(feedIdParts[0]);
};

interface TxMethodOpts {
  /**
   * Repository retrieved from transaction manager.
   */
  repo: Repository<FeedEntity>;
}

interface FindOrCreateTxtOpts {
  findOneOptions?: FindOneOptions<FeedEntity>;
  repo: Repository<FeedEntity>;
}

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(FeedEntity)
    public repo: Repository<FeedEntity>,
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private common: EntitiesWithPagesCommon
  ) {
    this.logger = this.logger.child({ context: 'FeedService' });
  }

  public toFeedObject(feed: FeedEntity): GqlFeed {
    return {
      __typename: 'Feed',
      id: feed.id,
      ts: {
        createdAt: feed.createdAt,
        updatedAt: feed.updatedAt,
      },
    };
  }

  async findById({
    id,
  }: {
    id: string;
  }): Promise<Result<FeedEntity | undefined, PostgresQueryFailedException>> {
    const context = {
      methodName: FeedService.prototype.findById.name,
      id,
    };
    const feedResult = await fromPromise(
      this.repo.findOne(id),
      error => new PostgresQueryFailedException({ error, ...context })
    );
    if (feedResult.isErr()) {
      this.logger.error('failed to find feed', context);
      return err(feedResult.error);
    }
    return ok(feedResult.value);
  }

  @WildrSpan()
  async findEntry(
    entityId: string,
    entryToFind: string,
    opts?: TxMethodOpts
  ): Promise<string | undefined> {
    try {
      const response = await this.findEntryWithDetails({
        entityId,
        entryToFind,
        opts,
      });
      if (response) {
        return response.allEntries.stitchedIdsList.find(entry =>
          entry.includes(entryToFind)
        );
      }
    } catch (e) {
      return;
    }
  }

  @WildrSpan()
  async findEntryWithDetails({
    entityId,
    entryToFind,
    opts,
  }: {
    entityId: string;
    entryToFind: string;
    opts?: TxMethodOpts;
  }): Promise<FindEntryWithDetails | undefined> {
    try {
      const response = await this.common.indexOfEntry({
        repo: opts?.repo || this.repo,
        entityId,
        entryToFind,
      });
      return {
        ...response,
        entry: response.allEntries.stitchedIdsList.find(entry =>
          entry.includes(entryToFind)
        ),
      };
    } catch (e) {
      return;
    }
  }

  @WildrSpan()
  async findIndex(
    entityId: string,
    entryToFind: string,
    opts?: TxMethodOpts
  ): Promise<number> {
    try {
      const response = await this.common.indexOfEntry({
        repo: opts?.repo || this.repo,
        entityId,
        entryToFind,
      });
      return response.index;
    } catch (e) {
      return -1;
    }
  }

  @WildrSpan()
  async findAllPages(
    feedEntityType: FeedEntityType,
    userId: string,
    orderBy?: 'ASC' | 'DESC'
  ): Promise<FeedEntity[]> {
    return await this.findAllPagesById(
      toFeedId(feedEntityType, userId),
      orderBy
    );
  }

  @WildrSpan()
  async findAllPagesById(
    id: string,
    orderBy?: 'ASC' | 'DESC'
  ): Promise<FeedEntity[]> {
    return (await this.common.findAllPagesById({
      entityId: id,
      repo: this.repo,
      orderBy,
    })) as FeedEntity[];
  }

  public newFeed(feedType: FeedEntityType, id: string): FeedEntity {
    const feed = new FeedEntity();
    feed.id = toFeedId(feedType, id);
    return feed;
  }

  @WildrSpan()
  async createWithId(id: string, opts?: TxMethodOpts): Promise<FeedEntity> {
    this.logger.info('createWithId', { id, inTxt: !!opts?.repo });
    const feed = new FeedEntity();
    feed.id = id;
    const activeRepo = opts?.repo || this.repo;
    await activeRepo.insert(feed);
    return feed;
  }

  @WildrSpan()
  async create(
    feedType: FeedEntityType,
    id: string,
    opts?: TxMethodOpts
  ): Promise<FeedEntity> {
    const feed = this.newFeed(feedType, id);
    const activeRepo = opts?.repo || this.repo;
    return activeRepo.save(feed);
  }

  @WildrSpan()
  async createIfNotExists(
    id: string,
    txtOpts?: FindOrCreateTxtOpts
  ): Promise<FeedEntity> {
    const repo = txtOpts?.repo ?? this.repo;
    const existingFeed = await repo.findOne(id, txtOpts?.findOneOptions);
    if (existingFeed) {
      this.logger.debug('feed already exists', { feedId: id });
      return existingFeed;
    }
    this.logger.debug(`creating new feed`, { feedId: id });
    try {
      const feed = new FeedEntity();
      feed.id = id;
      await repo.insert(feed);
      return feed;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError.code === POSTGRES_UNIQUE_VIOLATION_CODE
      ) {
        this.logger.debug('feed already created');
        return await repo.findOneOrFail(id);
      }
      this.logger.error('feed create failed with unknown error', { id, error });
      throw error;
    }
  }

  async createManyIfNotExists({
    feedIds,
  }: {
    feedIds: string[];
  }): Promise<Result<boolean, PostgresQueryFailedException>> {
    const context = {
      methodName: FeedService.prototype.createManyIfNotExists.name,
      feedIds,
    };
    const tasks: ResultAsync<FeedEntity, PostgresQueryFailedException>[] = [];
    for (const feedId of feedIds) {
      const result = fromPromise(
        this.createIfNotExists(feedId),
        error => new PostgresQueryFailedException({ error, ...context })
      );
      tasks.push(result);
    }
    const results = await Promise.all(tasks);
    const failedResults = results.filter(result => result.isErr());
    if (failedResults.length > 0) {
      this.logger.error('failed to create feeds', {
        ...context,
        failedResults,
      });
      return err(new PostgresQueryFailedException());
    }
    return ok(true);
  }

  @WildrSpan()
  async findOrCreateWithId(
    id: string,
    txtOpts?: FindOrCreateTxtOpts
  ): Promise<FeedEntity> {
    return await this.createIfNotExists(id, txtOpts);
  }

  @WildrSpan()
  async findOrCreate(
    feedType: FeedEntityType,
    id: string,
    pageNumber?: number
  ): Promise<FeedEntity> {
    let feedId = toFeedId(feedType, id);
    if (pageNumber) {
      feedId = upsertPageNumberToId(feedId, pageNumber);
    }
    return this.createIfNotExists(feedId);
  }

  @WildrSpan()
  async createAll(
    feedTypes: FeedEntityType[],
    id: string
  ): Promise<FeedEntity[]> {
    const feeds = feedTypes.map(feedType => this.newFeed(feedType, id));
    return await this.repo.save(feeds);
  }

  @WildrSpan()
  async deleteAll(
    feedTypes: FeedEntityType[],
    id: string
  ): Promise<DeleteResult> {
    const feedIds = feedTypes.map(feedType => toFeedId(feedType, id));
    return this.repo.delete(feedIds);
  }

  @WildrSpan()
  async find(id: string, opts?: TxMethodOpts): Promise<FeedEntity | undefined> {
    const activeRepo = opts?.repo || this.repo;
    return activeRepo.findOne(id);
  }

  @WildrSpan()
  async findByIds(ids: string[], opts?: TxMethodOpts): Promise<FeedEntity[]> {
    const activeRepo = opts?.repo || this.repo;
    return preserveOrderByIds(ids, await activeRepo.findByIds(ids));
  }

  @WildrSpan()
  async findByIdsWithMap(
    ids: string[],
    opts?: TxMethodOpts
  ): Promise<FeedsMap> {
    const activeRepo = opts?.repo || this.repo;
    const map: FeedsMap = new Map();
    const feeds = await activeRepo.findByIds(ids);
    ids.forEach(id => {
      const feed = feeds.find(feed => feed.id === id);
      if (feed) map.set(id, feed);
    });
    return map;
  }

  @WildrSpan()
  async save(feeds: FeedEntity[]) {
    return await this.repo.manager.transaction(async entityManager => {
      return await entityManager.save(feeds);
    });
  }

  @WildrSpan()
  async update(
    feedId: string,
    partialEntity: QueryDeepPartialEntity<FeedEntity>
  ) {
    try {
      return await this.repo.update(feedId, partialEntity);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * @deprecated use tryPushEntry instead to maintain chronological order and
   * account for pagination
   */
  @WildrSpan()
  async tryUnshiftEntry(
    idOrFeed: string | FeedEntity,
    entryId: string,
    repo?: Repository<FeedEntity>
  ): Promise<FeedEntity | undefined> {
    const feedId = typeof idOrFeed === 'string' ? idOrFeed : idOrFeed.id;
    await this.createIfNotExists(feedId);
    this.logger.info(`[tryUnshiftEntry] adding element to feed`, {
      feedId,
      entryId,
    });
    if (repo) {
      return await this.tryUnshiftEntryWithoutTransaction({
        repo,
        feedId,
        entryId,
      });
    }
    return await this.repo.manager.transaction(async manager => {
      return await this.tryUnshiftEntryWithoutTransaction({
        repo: manager.getRepository(FeedEntity),
        feedId,
        entryId,
      });
    });
  }

  private async tryUnshiftEntryWithoutTransaction({
    repo,
    feedId,
    entryId,
  }: {
    repo: Repository<FeedEntity>;
    feedId: string;
    entryId: string;
  }): Promise<FeedEntity | undefined> {
    const feed = await repo.findOne(feedId, {
      lock: { mode: 'pessimistic_write' },
    });
    if (!feed) {
      this.logger.info(`[tryUnshiftEntry] feed ${feedId} not found`);
      return;
    }
    feed.tryUnshiftEntry(entryId);
    return repo.save(feed);
  }

  /**
   * @deprecated use removeEntry instead to account for pagination
   */
  @WildrSpan()
  async tryRemoveEntry(
    idOrFeed: string | FeedEntity,
    entryId: string
  ): Promise<FeedEntity | undefined> {
    const feedId = typeof idOrFeed === 'string' ? idOrFeed : idOrFeed.id;
    this.logger.info(`[tryRemoveEntry] removing element from feed`, {
      feedId,
      entryId,
    });
    return await this.repo.manager.transaction(async manager => {
      const feedRepo = manager.getRepository(FeedEntity);
      const feed = await feedRepo.findOne(feedId, {
        lock: { mode: 'pessimistic_write' },
      });
      if (!feed) {
        this.logger.info(`[tryRemoveEntry] feed ${feedId} not found`);
        return;
      }
      feed.tryRemoveEntry(entryId);
      return feedRepo.save(feed);
    });
  }

  @WildrSpan()
  async tryRemoveEntries(
    idOrFeed: string | FeedEntity,
    entries: string[],
    repo?: Repository<FeedEntity>
  ): Promise<FeedEntity | undefined> {
    repo ??= this.repo;
    const feed =
      typeof idOrFeed === 'string' ? await repo.findOne(idOrFeed) : idOrFeed;
    if (feed === undefined) return undefined;
    entries.forEach(entryId => feed.tryRemoveEntry(entryId));
    return await repo.save(feed);
  }

  @WildrSpan()
  async deleteEntity(entity: FeedEntity): Promise<boolean> {
    try {
      await this.repo.delete(entity);
      return true;
    } catch (err) {
      this.logger.error('FAILED TO DELETE');
      this.logger.error(err);
      return false;
    }
  }

  @WildrSpan()
  async delete(id: string): Promise<boolean> {
    try {
      await this.repo.delete(id);
      return true;
    } catch (err) {
      this.logger.error(err);
      return false;
    }
  }

  @WildrSpan()
  async getGlobalFeed(): Promise<FeedEntity> {
    const feed = await this.repo.findOne(GLOBAL_ALL_POSTS_FEED_ID);
    if (feed) return feed;
    const newFeed = new FeedEntity();
    newFeed.id = GLOBAL_ALL_POSTS_FEED_ID;
    await this.repo.save(newFeed);
    return newFeed;
  }

  @WildrSpan()
  async getUnannotatedPostsFeed(): Promise<FeedEntity> {
    this.logger.debug(' getUnannotatedPostsFeed()');
    const feed = await this.repo.findOne(UNANNOTATED_POSTS_FEED_ID);
    if (feed) return feed;
    this.logger.warn('getUnannotatedPostsFeed() creating a new one');
    const newFeed = new FeedEntity();
    newFeed.id = UNANNOTATED_POSTS_FEED_ID;
    await this.repo.save(newFeed);
    return newFeed;
  }

  @WildrSpan()
  async removeFromAnnotationsPendingPostsFeed(postId: string) {
    const feed = await this.getUnannotatedPostsFeed();
    feed.page.ids.splice(feed.page.ids.indexOf(postId), 1);
    await this.save([feed]);
  }

  @WildrSpan()
  async getAnnotatedUndistributedPostsFeed(): Promise<FeedEntity> {
    const feed = await this.repo.findOne(ANNOTATED_UNDISTRIBUTED_POSTS_FEED_ID);
    if (feed) return feed;
    const newFeed = new FeedEntity();
    newFeed.id = ANNOTATED_UNDISTRIBUTED_POSTS_FEED_ID;
    await this.repo.save(newFeed);
    return newFeed;
  }

  @WildrSpan()
  async addToAnnotatedUndistributedPostsFeed(postId: string) {
    const feed = await this.getAnnotatedUndistributedPostsFeed();
    feed.page.ids.push(postId);
    await this.save([feed]);
  }

  async removeEntry(
    entityId: string,
    entryToRemove: string,
    opts?: TxMethodOpts & { inTxt?: boolean }
  ): Promise<RemoveFeedEntryResult> {
    const result: RemoveEntryResult = await this.common.removeEntryFromEntity({
      entityId,
      entryToRemove,
      inTxt: opts?.inTxt || false,
      repo: opts?.repo || this.repo,
    });

    return {
      entity: result.entity as FeedEntity,
      didRemoveEntry: result.didRemoveEntry,
    };
  }

  async replaceEntry(args: ReplaceEntryInput) {
    return await this.common.replaceEntry(args);
  }

  async tryAndPushEntry(
    entityId: string,
    entryToAdd: string,
    opts?: TxMethodOpts & { inTxt?: boolean }
  ): Promise<TryAndPushItemToEntityResult> {
    const result = await this.common.tryAndPushItemToEntity({
      entityId,
      entryToAdd,
      inTxt: opts?.inTxt || false,
      repo: opts?.repo || this.repo,
    });
    this.logger.info('tryAndPushEntry', {
      didAddEntry: result.didAddEntry,
      entityId,
      entryToAdd,
    });
    return result;
  }

  @WildrSpan()
  async getAnnotatedDistributionInProgressPostsFeed(): Promise<FeedEntity> {
    const feed = await this.repo.findOne(
      ANNOTATED_DISTRIBUTION_IN_PROGRESS_POSTS_FEED_ID
    );
    if (feed) return feed;
    const newFeed = new FeedEntity();
    newFeed.id = ANNOTATED_DISTRIBUTION_IN_PROGRESS_POSTS_FEED_ID;
    await this.repo.save(newFeed);
    return newFeed;
  }

  @WildrSpan()
  async findGlobalAllPostsFeed(): Promise<FeedEntity> {
    // TODO: Return user-specific feed
    return this.getGlobalFeed();
  }

  @WildrSpan()
  private async getTextFeed(): Promise<FeedEntity> {
    const feed = await this.repo.findOne(GLOBAL_TEXT_POSTS_FEED_ID);
    if (feed) return feed;
    const newFeed = new FeedEntity();
    newFeed.id = GLOBAL_TEXT_POSTS_FEED_ID;
    return newFeed;
  }

  @WildrSpan()
  private async getImageFeed(): Promise<FeedEntity> {
    const feed = await this.repo.findOne(GLOBAL_IMAGE_POSTS_FEED_ID);
    if (feed) return feed;
    const newFeed = new FeedEntity();
    newFeed.id = GLOBAL_IMAGE_POSTS_FEED_ID;
    return newFeed;
  }

  @WildrSpan()
  private async getVideoFeed(): Promise<FeedEntity> {
    const feed = await this.repo.findOne(GLOBAL_VIDEO_POSTS_FEED_ID);
    if (feed) return feed;
    const newFeed = new FeedEntity();
    newFeed.id = GLOBAL_VIDEO_POSTS_FEED_ID;
    return newFeed;
  }

  @WildrSpan()
  private async getMultiMediaFeed(): Promise<FeedEntity> {
    const feed = await this.repo.findOne(GLOBAL_COLLAGE_POSTS_FEED_ID);
    if (feed) return feed;
    const newFeed = new FeedEntity();
    newFeed.id = GLOBAL_COLLAGE_POSTS_FEED_ID;
    return newFeed;
  }

  gqlFeedTypeToPostTypeInt(type: GqlFeedType) {
    switch (type) {
      case GqlFeedType.IMAGE:
        return 2;
      case GqlFeedType.TEXT:
        return 3;
      case GqlFeedType.VIDEO:
        return 4;
      case GqlFeedType.MULTI_MEDIA:
        return 5;
      default:
        return 0; //ALL
    }
  }

  @WildrSpan()
  private async getFeed(feedId?: string): Promise<FeedEntity> {
    const feed = await this.repo.findOne(feedId);
    if (feed) return feed;
    this.logger.error('Feed not found', { feedId: feedId, method: 'getFeed' });
    const newFeed = new FeedEntity();
    newFeed.id = feedId ?? '';
    return newFeed;
  }

  @WildrSpan()
  async getPostsFeed(
    input: GetFeedInput,
    user?: UserEntity
  ): Promise<FeedEntity> {
    //TODO: What about page number????
    const type = input?.feedType;
    const scope = input?.scopeType ?? FeedScopeType.PUBLIC;
    let feedId: string | undefined;
    const postType = this.gqlFeedTypeToPostTypeInt(type ?? GqlFeedType.ALL);
    if (user) {
      if (scope === FeedScopeType.PERSONALIZED) {
        if (user.exploreFeedUpdatedAt) {
          feedId = toFeedId(
            PersonalizedPostsFeedBasedOnPostTypes[postType],
            user.id
          );
        } else {
          this.logger.info("Main Feed doesn't exist");
        }
      } else if (scope === FeedScopeType.PERSONALIZED_FOLLOWING) {
        feedId = toFeedId(
          FollowingUserPostsFeedBasedOnPostTypes[postType],
          user.id
        );
      } else if (scope === FeedScopeType.FOLLOWING) {
        //Backward compatibility
        feedId = toFeedId(
          FollowingUserPostsFeedBasedOnPostTypes[postType],
          user.id
        );
      } else if (scope === FeedScopeType.LIST_CONSUMPTION && input.listId) {
        return await this.findOrCreateWithId(
          getListPostConsumptionFeedId(input.listId, postType)
        );
      } else if (scope === FeedScopeType.INNER_CIRCLE_CONSUMPTION) {
        //TODO: What about page number????
        const innerCircleId = innerCircleListIdForFetchingPostsFeed(user.id);
        const feedId = getListPostConsumptionFeedId(innerCircleId, postType);
        return await this.findOrCreateWithId(feedId);
      }
    }
    if (!feedId) {
      feedId = toFeedId(GlobalPostsFeedTypesBasedOnPostTypes[postType], '');
    }
    this.logger.debug('FeedId', { feedId, currentUserId: user?.id });
    let feed: FeedEntity | undefined = await this.find(feedId);
    if (
      feed &&
      feed.id.startsWith(
        String(PersonalizedPostsFeedBasedOnPostTypes[postType])
      ) &&
      feed.page.ids.length === 0
    ) {
      this.logger.info('Personalized Feed is Empty');
      feed = await this.find(
        toFeedId(GlobalPostsFeedTypesBasedOnPostTypes[postType], '')
      );
      this.logger.info('Getting Global Feed');
    }
    if (!feed) {
      feed = new FeedEntity();
      feed.id = feedId;
    }
    return feed;
  }

  private filterFeedPage(
    cursor: FeedCursor,
    page: FeedPage,
    shouldReverse?: boolean,
    paginationOrder?: PaginationOrder
  ): string[] {
    if (paginationOrder) {
      shouldReverse = paginationOrder !== PaginationOrder.OLDEST_FIRST;
    }
    const ids = shouldReverse ? page.ids.reverse() : page.ids;
    switch (cursor.type) {
      case 'FeedCursorUp':
        return _.takeRight(
          cursor.before
            ? _.dropRight(
                _.dropRightWhile(ids, (id: string) => id !== cursor.before)
              )
            : ids,
          cursor.last
        );
      case 'FeedCursorDown':
        return _.take(
          cursor.after
            ? _.drop(_.dropWhile(ids, id => id !== cursor.after))
            : ids,
          cursor.first
        );
    }
  }

  @WildrSpan()
  async paginateEntries(
    entityId: string,
    paginationInput: PaginationInput,
    predicate?: FilterPaginateEntriesPredicate,
    backwardsCompatibility = false
  ): Promise<PaginateEntriesResponse> {
    const response: PaginateEntriesResponse | undefined =
      await this.common.paginateEntries({
        entityId,
        repo: this.repo,
        paginationInput,
        predicate,
        backwardsCompatibility,
      });
    return (
      response ?? {
        ids: [],
        hasMoreItems: false,
        hasPreviousItems: false,
        pageNumber: -1,
        totalCount: 0,
      }
    );
  }

  @WildrSpan()
  async getPage(
    args: {
      feedOrId: FeedEntity | string;
      first?: number; //Deprecated, use paginationInput
      after?: string; //Deprecated, use paginationInput
      last?: number; //Deprecated, use paginationInput
      before?: string; //Deprecated, use paginationInput
      includingAndAfter?: string; //Deprecated, use paginationInput
      includingAndBefore?: string; //Deprecated, use paginationInput
      shouldReverse?: boolean; //Deprecated, use paginationInput
    },
    paginationInput?: PaginationInput
  ): Promise<[FeedPage, boolean, boolean]> {
    if (paginationInput) {
      const response = await this.common.paginateEntries({
        entityId:
          typeof args.feedOrId === 'string' ? args.feedOrId : args.feedOrId.id,
        repo: this.repo,
        paginationInput,
      });
      if (response) {
        this.logger.info('giving response');
        return [
          {
            ids: response.ids,
            idsWithScore: { idsMap: {} },
          },
          response.hasPreviousItems,
          response.hasMoreItems,
        ];
      }
    }
    const feedEntity: FeedEntity | undefined =
      typeof args.feedOrId === 'string'
        ? await this.find(args.feedOrId)
        : args.feedOrId;
    if (!feedEntity)
      return [
        {
          ids: [],
          idsWithScore: { idsMap: {} },
        },
        false,
        false,
      ];
    const cursor = toCursor(
      paginationInput?.take ?? args.first,
      paginationInput?.includingAndAfter ??
        paginationInput?.after ??
        args.includingAndAfter ??
        args.after,
      args.last,
      paginationInput?.includingAndBefore ??
        paginationInput?.before ??
        args.includingAndBefore ??
        args.before
    );
    const filteredEntryIds: string[] = this.filterFeedPage(
      cursor,
      feedEntity.page,
      args.shouldReverse,
      paginationInput?.order ?? undefined
    );
    if (args.includingAndAfter)
      filteredEntryIds.unshift(args.includingAndAfter);
    if (args.includingAndBefore) filteredEntryIds.push(args.includingAndBefore);
    const lastEntryFromFeed = _.last(feedEntity.page.ids);
    const lastEntryFromFilteredList = _.last(filteredEntryIds);
    let hasNextPage = false;
    if (
      lastEntryFromFeed !== undefined &&
      lastEntryFromFilteredList !== undefined
    ) {
      hasNextPage = lastEntryFromFeed !== lastEntryFromFilteredList;
    }
    const firstEntryFromFeed = _.first(feedEntity.page.ids);
    const firstEntryFromFilteredList = _.first(filteredEntryIds);
    let hasPreviousPage = false;
    if (
      firstEntryFromFeed !== undefined &&
      firstEntryFromFilteredList !== undefined
    ) {
      hasPreviousPage = firstEntryFromFeed !== firstEntryFromFilteredList;
    }
    return [
      {
        ids: filteredEntryIds,
        idsWithScore: feedEntity.page.idsWithScore ?? { idsMap: {} },
      },
      hasPreviousPage,
      hasNextPage,
    ];
  }

  /**
   * Runs a `while` loop to make sure the requested count is satisfied and
   * expired posts are filtered out
   */
  async getFilteredPosts(
    feedId: string,
    paginationInput: PaginationInput,
    postService: PostService,
    backwardsCompatibility = false,
    version?: string
  ): Promise<[PostEntity[], boolean, boolean]> {
    this.logger.info('getFilteredPost', { paginationInput });
    let hasFoundRequiredNumberOfPosts = false;
    let nonExpiredPostsCount = 0;
    let hasPreviousPage = false;
    let hasNextPage = false;
    let posts: PostEntity[] = [];
    let afterCursor = paginationInput.after;
    let infiniteLoopCheckCounter = 0;
    let predicate: FindConditions<PostEntity> | undefined;
    try {
      if (!canShowReposts(version)) {
        this.logger.info('App version is less required Repost version', {
          version,
          reqVersion: REPOST_MIN_VERSION,
        });
        predicate = ignoreRepostsPredicate;
      }
    } catch (e) {
      this.logger.error(e);
    }
    while (!hasFoundRequiredNumberOfPosts) {
      infiniteLoopCheckCounter += 1;
      if (infiniteLoopCheckCounter == 50) {
        this.logger.error('RAN INTO INFINITE LOOP');
        break;
      }
      const response: PaginateEntriesResponse | undefined =
        await this.common.paginateEntries({
          entityId: feedId,
          repo: this.repo,
          paginationInput: {
            ...paginationInput,
            after: afterCursor,
          },
          backwardsCompatibility,
        });
      if (!response) {
        return [posts, hasPreviousPage, hasNextPage];
      }
      hasPreviousPage = response.hasPreviousItems;
      hasNextPage = response.hasMoreItems;
      afterCursor = _.last(response.ids) ?? '';
      const nonExpiredPosts: PostEntity[] =
        (
          await postService.findAllNonExpired(
            response.ids,
            [
              PostEntity.kAuthorRelation,
              PostEntity.kLikeReactionFeedRelation,
              PostEntity.kParentChallengeRelation,
            ],
            predicate
          )
        ).filter(p => p !== undefined) ?? [];
      if (nonExpiredPosts.length == 0 && !hasNextPage) {
        hasFoundRequiredNumberOfPosts = true;
        break;
      }
      nonExpiredPostsCount += nonExpiredPosts.length;
      hasFoundRequiredNumberOfPosts =
        nonExpiredPostsCount >=
          (paginationInput.take ?? DEFAULT_PAGINATION_COUNT) || !hasNextPage;
      posts = posts.concat(nonExpiredPosts);
      const lastPostId = _.last(response.ids);
      if (lastPostId) {
        afterCursor = lastPostId;
      }
      if (afterCursor === '') {
        hasFoundRequiredNumberOfPosts = true;
      }
    } //end of while loop
    return [posts, hasPreviousPage, hasNextPage];
  }

  @WildrSpan()
  async createUserCreatedList(userId: string): Promise<FeedEntity> {
    return await this.create(FeedEntityType.USER_CREATED_LISTS, userId);
  }

  @WildrSpan()
  async deleteUserCreatedList(id: string) {
    await this.repo.delete({ id });
  }

  @WildrSpan()
  async getAllEntriesFromEveryPage({
    feedId,
    repo,
  }: {
    feedId: string;
    repo?: Repository<FeedEntity>;
  }): Promise<GetAllEntriesResponse> {
    return await this.common.getAllEntriesFromEveryPage({
      entityId: feedId,
      repo: repo || this.repo,
    });
  }

  @WildrSpan()
  getPageOfIdsFromFeedIds({
    allFeedIds,
    paginationInput,
    predicate,
    backwardsCompatibility,
  }: {
    allFeedIds: string[];
    paginationInput: PaginationInput;
    predicate?: FilterPaginateEntriesPredicate;
    backwardsCompatibility?: boolean;
  }): PageIdsAndInfo {
    return this.common.getIdsFromPage(
      allFeedIds,
      paginationInput,
      predicate,
      backwardsCompatibility
    );
  }

  getCursor(paginationInput: PaginationInput): PageCursor {
    return this.common.getCursor(paginationInput);
  }

  async unshiftToSinglePageFeedInTxn({
    feedId,
    entry,
  }: {
    feedId: string;
    entry: string;
  }): Promise<
    Result<
      string,
      | PostgresQueryFailedException
      | FeedNotFoundException
      | PostgresTransactionFailedException
    >
  > {
    const context = {
      methodName: 'unshiftToSinglePageFeed',
      feedId,
      entry,
    };
    const feedResult = await fromPromise(
      this.findOrCreateWithId(feedId),
      error => new PostgresQueryFailedException({ error, ...context })
    );
    if (feedResult.isErr()) {
      this.logger.error('failed to find or create feed', {
        error: feedResult.error,
        ...context,
      });
      return err(feedResult.error);
    }
    return await fromTransaction<string, FeedNotFoundException>({
      queryRunner: this.repo.manager.connection.createQueryRunner(),
      context,
      txn: async ({ queryRunner }) => {
        const feedRepo = queryRunner.manager.getRepository(FeedEntity);
        const feed = await feedRepo.findOne(feedId);
        if (!feed) {
          this.logger.error('feed not found', context);
          return err(new FeedNotFoundException(context));
        }
        feed.tryUnshiftEntry(entry);
        await feedRepo.update(feedId, feed);
        return ok(entry);
      },
      logger: this.logger,
      retryCount: 3,
    });
  }

  paginateReverseChronFeed({
    feed,
    paginationInput,
  }: {
    feed: FeedEntity;
    paginationInput: PaginationInput;
  }): PaginateFeedResponse<string> {
    if (feed.page.ids.length === 0) {
      return {
        items: [],
        pageInfo: {
          count: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
    if (paginationInput.before || paginationInput.includingAndBefore) {
      return this.paginateReverseChronFeedBefore({
        feed,
        before: paginationInput.before,
        includingAndBefore: paginationInput.includingAndBefore,
        take: paginationInput.take,
      });
    } else {
      return this.paginateReverseChronFeedAfter({
        feed,
        after: paginationInput.after,
        includingAndAfter: paginationInput.includingAndAfter,
        take: paginationInput.take,
      });
    }
  }

  private paginateReverseChronFeedAfter({
    feed,
    after,
    includingAndAfter,
    take,
  }: {
    feed: FeedEntity;
    after?: string | null;
    includingAndAfter?: string | null;
    take?: number | null;
  }): PaginateFeedResponse<string> {
    const start = after ?? includingAndAfter;
    let startIndex = start ? feed.page.ids.findIndex(id => id === start) : 0;
    if (startIndex === -1) {
      return {
        items: [],
        pageInfo: {
          count: 0,
          totalCount: feed.page.ids.length,
          hasNextPage: false,
          hasPreviousPage: feed.page.ids.length > 0,
        },
      };
    }
    let endIndex = startIndex + (take ?? DEFAULT_PAGINATION_COUNT);
    if (after) {
      startIndex += 1;
      endIndex += 1;
    }
    const ids = feed.page.ids.slice(startIndex, endIndex);
    return {
      items: ids,
      pageInfo: {
        count: ids.length,
        totalCount: feed.page.ids.length,
        hasNextPage: _.last(ids) !== _.last(feed.page.ids),
        hasPreviousPage: _.first(ids) !== _.first(feed.page.ids),
        startCursor: _.first(ids),
        endCursor: _.last(ids),
      },
    };
  }

  private paginateReverseChronFeedBefore({
    feed,
    before,
    includingAndBefore,
    take,
  }: {
    feed: FeedEntity;
    before?: string | null;
    includingAndBefore?: string | null;
    take?: number | null;
  }): PaginateFeedResponse<string> {
    const end = before ?? includingAndBefore;
    let endIndex = end
      ? feed.page.ids.findIndex(id => id === end)
      : feed.page.ids.length - 1;
    if (endIndex === -1) {
      return {
        items: [],
        pageInfo: {
          count: 0,
          totalCount: feed.page.ids.length,
          hasNextPage: feed.page.ids.length > 0,
          hasPreviousPage: false,
        },
      };
    }
    if (includingAndBefore) {
      endIndex += 1;
    }
    const startIndex = Math.max(
      endIndex - (take ?? DEFAULT_PAGINATION_COUNT),
      0
    );
    const ids = feed.page.ids.slice(startIndex, endIndex);
    return {
      items: ids,
      pageInfo: {
        count: ids.length,
        totalCount: feed.page.ids.length,
        hasNextPage: _.first(ids) !== _.first(feed.page.ids),
        hasPreviousPage: _.last(ids) !== _.last(feed.page.ids),
        startCursor: _.first(ids),
        endCursor: _.last(ids),
      },
    };
  }
}

export interface RemoveFeedEntryResult {
  entity: FeedEntity;
  didRemoveEntry: boolean;
}

export type FeedsMap = Map<string, FeedEntity>;

export interface FindEntryWithDetails {
  index: number;
  pageNumber: number;
  allEntries: GetAllEntriesResponse;
  entry?: string;
  indexInPage: number;
}

export interface FeedPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  count: number;
  totalCount: number;
  startCursor?: string;
  endCursor?: string;
}

export const emptyFeedPageInfo: FeedPageInfo = {
  hasNextPage: false,
  hasPreviousPage: false,
  count: 0,
  totalCount: 0,
};

export interface PaginateFeedResponse<T> {
  items: T[];
  pageInfo: FeedPageInfo;
}

export const emptyFeedPage: PaginateFeedResponse<any> = {
  items: [],
  pageInfo: emptyFeedPageInfo,
};

export class FeedNotFoundException extends NotFoundException {
  constructor(debugData: DebugData<NotFoundExceptionCodes> = {}) {
    super('Feed not found', {
      ...debugData,
      exceptionCode: NotFoundExceptionCodes.FEED_NOT_FOUND,
    });
  }
}

export class GlobalActiveChallengesFeedNotFoundException extends FeedNotFoundException {
  constructor(debugData: DebugData<NotFoundExceptionCodes> = {}) {
    super({
      ...debugData,
      code: NotFoundExceptionCodes.GLOBAL_ACTIVE_CHALLENGES_FEED_NOT_FOUND,
    });
  }
}
