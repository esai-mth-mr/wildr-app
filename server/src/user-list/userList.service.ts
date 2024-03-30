// noinspection JSUnusedGlobalSymbols

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  generateId,
  ID_SEPARATOR,
  PAGE_NUMBER_SEPARATOR,
} from '@verdzie/server/common/generateId';
import {
  CreateUserListInput,
  FeedType,
  FeedType as GqlFeedType,
  PaginationInput,
  UserList,
} from '@verdzie/server/generated-graphql';
import { UploadService } from '@verdzie/server/upload/upload.service';
import { UserListEntity } from '@verdzie/server/user-list/userList.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { EntityManager, Like, Repository } from 'typeorm';
import { Logger } from 'winston';
import {
  EntitiesWithPagesCommon,
  getIdWithoutPageDetails,
  getUserIdFromListId,
  getUUIDFromListId,
  PageNotFoundError,
  PaginateEntriesResponse,
  TryAndPushItemToEntityResult,
  upsertPageNumberToId,
} from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { FeedService, toFeedId } from '../feed/feed.service';
import {
  FeedEntity,
  FeedEntityType,
  ListPostsConsumption,
  ListPostsForConsumptionBasedOnPostTypes,
  ListPostsForDistribution,
  ListPostsForDistributionBasedOnPostTypes,
} from '@verdzie/server/feed/feed.entity';
import { toUrl } from '@verdzie/server/common';
import { S3UrlPreSigner } from '@verdzie/server/upload/s3UrlPreSigner';
import { CDNPvtUrlSigner } from '@verdzie/server/upload/CDNPvtUrlSigner';
import { UserService } from '@verdzie/server/user/user.service';
import { PostType } from '@verdzie/server/post/data/post-type';
import { kInnerCircleIconUrl, kInnerCircleListName } from '../../constants';
import {
  GetAllListsCreatedByUserResponse,
  innerCircleListId,
  innerCircleListIdWithoutPageDetails,
  isOwnerOfTheEntityId,
  ListAlreadyExistsError,
  listIdWithoutPageDetails,
  NoUUIDFoundError,
  OwnerNotMatchError,
} from '@verdzie/server/user-list/userList.helpers';
import _ from 'lodash';
import { UserPropertyMapService } from '@verdzie/server/user-property-map/userPropertyMap.service';
import { NotifyAddedToICProducer } from '@verdzie/server/worker/notify-add-to-inner-circle/notifyAddedToIC.producer';
import { AddOrRemovePostsFromFeedProducer } from '@verdzie/server/worker/add-remove-posts-feed/addOrRemovePostsFromFeed.producer';

@Injectable()
export class UserListService {
  constructor(
    @InjectRepository(UserListEntity)
    public repo: Repository<UserListEntity>,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private feedService: FeedService,
    private common: EntitiesWithPagesCommon,
    private readonly uploadService: UploadService,
    private readonly s3UrlPreSigner: S3UrlPreSigner,
    private readonly cdnPvtS3UrlPreSigner: CDNPvtUrlSigner,
    private readonly userPropertyMapService: UserPropertyMapService,
    private readonly notifyAddedToICWorker: NotifyAddedToICProducer,
    private addOrRemovePostsFromFeedWorker: AddOrRemovePostsFromFeedProducer
  ) {
    this.logger = this.logger.child({ context: 'UserListService' });
  }

  async addToUserCreatedLists(creatorId: string, idWithoutPageDetails: string) {
    const allListsByUserFeedEntity = await this.feedService.findOrCreate(
      FeedEntityType.USER_CREATED_LISTS,
      creatorId
    );
    allListsByUserFeedEntity.tryUnshiftEntry(idWithoutPageDetails);
    await this.feedService.update(allListsByUserFeedEntity.id, {
      page: allListsByUserFeedEntity.page,
    });
  }

  /**
   * The length of FeedEntity#id = 30 characters
   *
   * From a list id, which is `userId # listUUID ~# pageNumber`
   * we first get the `listUUID`, and then generate the FeedID
   *
   * FeedID =
   * listUUID # FeedType ~# <PageNumber>
   *
   * Case: innerCircle:
   * to easily generate user's inner circle, we use userId
   * therefore, FeedID = userId~ic~ # FeedType ~# Page Number
   * 4 + 17 + 1 + 2 + 2 + 3 = 29 characters
   *
   *
   *
   * - Creates first page of Posts{@link FeedEntity}for
   * consumption > {@link FeedEntityType.USER_LIST_CONSUMPTION_ALL_POSTS}
   *
   * - Creates first page of Posts{@link FeedEntity} for
   * distribution -> {@link FeedEntityType.USER_LIST_CREATOR_ALL_POSTS}
   */
  async createPostFeeds(listId: string, isInnerCircle = false) {
    this.logger.info('createPostFeeds()');
    let listUUID;
    if (isInnerCircle) {
      const userId = getUserIdFromListId(listId);
      if (!userId) {
        throw Error('getUserIdFromListId() returned null');
      }
      listUUID = innerCircleListIdWithoutPageDetails(userId);
    } else {
      listUUID = getUUIDFromListId(listId);
    }
    if (!listUUID) {
      throw new NoUUIDFoundError(
        'Could not retrieve UUI from the listId' + listId
      );
    }
    const feeds: FeedEntity[] = [];
    for (const entityType of [
      ...ListPostsForDistribution,
      ...ListPostsConsumption,
    ]) {
      const feed = new FeedEntity();
      const id = toFeedId(entityType, listUUID);
      feed.id = upsertPageNumberToId(id, 1);
      feeds.push(feed);
    }
    try {
      await this.feedService.save(feeds);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Caution!!
   * * Use this only while creating the list entity.
   * * Calls {@link generateId()}
   */
  private createInnerCircleListIdFirstPage(userId: string): string {
    return innerCircleListId(userId, 1);
  }

  async createInnerCircleList(creatorId: string): Promise<UserListEntity> {
    this.logger.info('createInnerCircleList');
    return await this.createList(creatorId, undefined, true);
  }

  /**
   * Creates {@link UserListEntity} in a Transaction
   * - Adds the entry to {@link FeedEntityType.USER_CREATED_LISTS}
   * - Creates Posts {@link FeedEntity} for consumption > {@link FeedEntityType.USER_LIST_CONSUMPTION_ALL_POSTS}
   * - Creates Posts {@link FeedEntity} for distribution -> {@link FeedEntityType.USER_LIST_CREATOR_ALL_POSTS}
   */
  async createList(
    creatorId: string,
    input: CreateUserListInput | undefined,
    isInnerCircle = false
  ): Promise<UserListEntity> {
    this.logger.info('createList()');
    let name: string;
    let iconUrl: string | undefined;
    let idWithoutPageDetails: string;
    if (isInnerCircle) {
      this.createInnerCircleListIdFirstPage(creatorId);
      idWithoutPageDetails = innerCircleListIdWithoutPageDetails(creatorId);
      name = kInnerCircleListName;
      iconUrl = kInnerCircleIconUrl;
    } else {
      if (!input) {
        throw new Error('Input is null');
      }
      idWithoutPageDetails = listIdWithoutPageDetails(creatorId);
      iconUrl = input.iconUrl ?? undefined;
      if (input.icon) {
        const uploadFile = await this.uploadService.uploadFile(input.icon);
        iconUrl = uploadFile.path;
      }
      name = input.name;
    }
    const id = upsertPageNumberToId(idWithoutPageDetails, 1);
    this.logger.info('InnerCircle listId', { id });
    const existingListWithSameName = await this.findByListNameForUserId(
      name,
      creatorId
    );
    if (existingListWithSameName) {
      this.logger.error(
        'createList() -> List with the same name already exists'
      );
      throw new ListAlreadyExistsError(
        'List with the same name already exists'
      );
    }
    let entity = new UserListEntity();
    entity.id = id;
    entity.name = name;
    entity.iconUrl = iconUrl;
    entity.ids = [];
    entity.metaData = { memberCount: 0 };
    try {
      entity = await this.repo.manager.transaction(
        async (entityManager: EntityManager) => {
          await entityManager.save(entity);
          await this.addToUserCreatedLists(creatorId, idWithoutPageDetails);
          await this.createPostFeeds(entity.id, isInnerCircle);
          this.logger.info('Successfully created entity', {});
          return entity;
        }
      );
    } catch (e) {
      throw e;
    }
    return entity;
  }

  /**
   * Default: Page#1
   * @return PostsFeedId with page number.
   */
  getPostFeedId(listId: string, feedType: FeedEntityType, pageNumber = 1) {
    const id = getUUIDFromListId(listId);
    if (!id) return '';
    return upsertPageNumberToId(toFeedId(feedType, id), pageNumber);
  }

  /**
   *
   * @param listId Page details don't matter
   * @param postType  if empty, then {@link FeedEntityType.USER_LIST_CREATOR_ALL_POSTS} is returned
   * @param pageNumber if empty, then Page #1 is returned
   */
  async findOrCreatePostDistributionFeed(
    listId: string,
    postType: PostType | undefined,
    pageNumber = 1
  ): Promise<FeedEntity> {
    const type = ListPostsForDistributionBasedOnPostTypes[postType ?? 0];
    const id = this.getPostFeedId(listId, type, pageNumber);
    return await this.feedService.findOrCreateWithId(id);
  }

  /**
   * Performs action in transaction
   */
  async pushPostToDistributionFeed(
    listId: string,
    postId: string,
    postType: PostType
  ): Promise<boolean> {
    const allFeedId = this.getPostFeedId(
      listId,
      ListPostsForDistributionBasedOnPostTypes[0],
      1
    );
    const postTypeFeedId = this.getPostFeedId(
      listId,
      ListPostsForDistributionBasedOnPostTypes[postType],
      1
    );
    try {
      return await this.repo.manager.transaction(async (): Promise<boolean> => {
        await this.common.tryAndPushItemToEntity({
          entityId: allFeedId,
          repo: this.repo,
          entryToAdd: postId,
          inTxt: false,
        });
        await this.common.tryAndPushItemToEntity({
          entityId: postTypeFeedId,
          repo: this.repo,
          entryToAdd: postId,
          inTxt: false,
        });
        return true;
      });
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  async paginatePostsFromPostsDistributionFeed(
    listId: string,
    paginationInput: PaginationInput,
    feedType: FeedType
  ): Promise<PaginateEntriesResponse | undefined> {
    const postType = this.feedService.gqlFeedTypeToPostTypeInt(
      feedType ?? GqlFeedType.ALL
    );
    const feedEntityType = ListPostsForDistributionBasedOnPostTypes[postType];
    const entityId = this.getPostFeedId(listId, feedEntityType);
    try {
      return await this.common.paginateEntries({
        entityId,
        paginationInput,
        repo: this.repo,
      });
    } catch (e) {
      this.logger.error(e);
      return undefined;
    }
  }

  /**
   *
   * @param listId Page details don't matter
   * @param postType  if empty, then {@link FeedEntityType.USER_LIST_CONSUMPTION_ALL_POSTS} is returned
   * @param pageNumber if empty, then Page #1 is returned
   */
  async findOrCreatePostConsumptionFeed(
    listId: string,
    postType: PostType | undefined,
    pageNumber = 1
  ): Promise<FeedEntity> {
    const type = ListPostsForConsumptionBasedOnPostTypes[postType ?? 0];
    const id = this.getPostFeedId(listId, type, pageNumber);
    return await this.feedService.findOrCreateWithId(id);
  }

  /**
   * Performs action in transaction
   */
  async addPostToConsumptionFeed(
    listId: string,
    postId: string,
    postType: PostType
  ): Promise<boolean> {
    this.logger.info('addPostToConsumptionFeed', { listId, postId, postType });
    const allFeedId = this.getPostFeedId(
      listId,
      ListPostsForConsumptionBasedOnPostTypes[0],
      1
    );
    const postTypeFeedId = this.getPostFeedId(
      listId,
      ListPostsForConsumptionBasedOnPostTypes[postType],
      1
    );
    this.logger.info('allFeedId', { allFeedId });
    try {
      return await this.repo.manager.transaction(async (): Promise<boolean> => {
        await this.common.tryAndPushItemToEntity({
          entityId: allFeedId,
          repo: this.feedService.repo,
          entryToAdd: postId,
          inTxt: false,
        });
        await this.common.tryAndPushItemToEntity({
          entityId: postTypeFeedId,
          repo: this.feedService.repo,
          entryToAdd: postId,
          inTxt: false,
        });
        return true;
      });
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  async paginatePostsFromPostsConsumptionFeed(
    listId: string,
    paginationInput: PaginationInput,
    feedType: FeedType
  ): Promise<PaginateEntriesResponse | undefined> {
    const postType = this.feedService.gqlFeedTypeToPostTypeInt(
      feedType ?? GqlFeedType.ALL
    );
    const feedEntityType = ListPostsForConsumptionBasedOnPostTypes[postType];
    const entityId = this.getPostFeedId(listId, feedEntityType);
    try {
      return await this.common.paginateEntries({
        entityId,
        paginationInput,
        repo: this.repo,
      });
    } catch (e) {
      this.logger.error(e);
      return undefined;
    }
  }

  /**
   * Returns the Entity#Page to which the member was added
   * or the Entity#Page in which the member was found
   *
   * - Performs action in a transaction
   * - Checks for duplicates in all the lists
   * - Checks and adds member to the last page of the UserListEntity
   * - Creates a new page if the existing page is already filled
   * - Updates memberCount in the firstPage
   *
   */
  async addMemberToList(
    ownerId: string,
    listId: string,
    addedUser: string
  ): Promise<TryAndPushItemToEntityResult | undefined> {
    this.logger.info('addMemberToList()', {});
    if (!isOwnerOfTheEntityId(ownerId, listId)) {
      this.logger.error('ownerId is not the creator of the entity', {});
      throw new OwnerNotMatchError('ownerId is not the creator of the entity');
    }
    try {
      const result = await this.common.tryAndPushItemToEntity({
        entityId: listId,
        repo: this.repo,
        entryToAdd: addedUser,
        inTxt: true,
      });
      if (result.didAddEntry) {
        //Update entry in EntryToAdd's property map
        await this.userPropertyMapService.setOrAppendProperties(
          addedUser,
          ownerId,
          [getIdWithoutPageDetails(listId)]
        );
        //Remove from suggestions
      }
      return result;
    } catch (e) {
      this.logger.error(e);
      return undefined;
    }
  }

  async findInnerCircleByOwnerId(
    ownerId: string,
    pageNumber = 1
  ): Promise<UserListEntity | undefined> {
    const id = innerCircleListId(ownerId, pageNumber);
    return _.first(
      await this.repo.find({
        where: {
          id,
        },
      })
    );
  }

  /**
   * @deprecated To be used by {@link UserService} only
   * - Adds member to Inner Circle
   * - Adds their post to IC Feed
   * - Notifies the added user
   */
  async addMemberToInnerCircle(
    ownerId: string,
    entryToAdd: string,
    shouldSendNotificationToAddedUser = true
  ): Promise<TryAndPushItemToEntityResult | undefined> {
    this.logger.info('addMemberToInnerCircle()', {});
    const result = await this.addMemberToList(
      ownerId,
      innerCircleListId(ownerId),
      entryToAdd
    );
    if (!result) return;
    if (!result?.didAddEntry) {
      this.logger.info('No new entry was added', {});
      return result;
    }
    await this.notifyAddedToICWorker.userAddedToIC({
      addedUserId: entryToAdd,
      ownerId,
      shouldSendNotificationToAddedUser,
    });
    await this.addOrRemovePostsFromFeedWorker.addTheirPostsToYourInnerCircle({
      whosePosts: entryToAdd,
      whoseFeed: ownerId,
    });
    return result;
  }

  /**
   * @deprecated Call this from {@link UserService}
   */
  async removeMemberFromInnerCircle(
    ownerId: string,
    entryToRemove: string,
    repo?: Repository<UserListEntity>
  ): Promise<UserListEntity> {
    this.logger.info('removeMemberFromInnerCircle', {});
    const result = await this.removeMemberFromList(
      ownerId,
      innerCircleListId(ownerId),
      entryToRemove,
      repo
    );
    //Remove their posts from your Inner Circle
    this.logger.info('removing their posts from inner circle', {});
    await this.addOrRemovePostsFromFeedWorker.removePostsFromInnerCircle({
      whosePosts: entryToRemove,
      whoseFeed: ownerId,
    });
    //Remove your posts, that are shared *only* with your IC from their Feed
    this.logger.info(
      'Remove your posts, that are shared *only* with your IC from their Feed',
      {}
    );
    await this.addOrRemovePostsFromFeedWorker.removeInnerCirclePostsFromFeed({
      whosePosts: ownerId,
      whoseFeed: entryToRemove,
    });
    return result;
  }

  /**
   * @define Removes a member from the list.
   *
   * @return the UserListEntity#Page in which the memberId was removed.
   *
   * @example If there are two pages in a list `user_1#list_uuid#1` and
   * `user_1#list_uuid#2`, and memberId to remove is present in
   * user_1#list_uuid#2 the function will return `user_1#list_uuid#2`
   */
  async removeMemberFromList(
    ownerId: string,
    listId: string,
    entryToRemove: string,
    repo?: Repository<UserListEntity>
  ): Promise<UserListEntity> {
    this.logger.info('removeMemberFromList', { entityId: listId });
    if (!isOwnerOfTheEntityId(ownerId, listId)) {
      throw new OwnerNotMatchError('ownerId is not the creator of the entity');
    }
    try {
      const { entity } = await this.common.removeEntryFromEntity({
        repo: repo ?? this.repo,
        entryToRemove,
        entityId: listId,
        inTxt: repo === undefined,
      });
      //Update entry in EntryToAdd's property map
      await this.userPropertyMapService.removeProperties(
        entryToRemove,
        ownerId,
        [getIdWithoutPageDetails(listId)]
      );
      return entity as UserListEntity;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * Adds a new page after the last page, maintains the order of the pages
   */
  async addNewPage(listId: string) {
    const entity = await this.repo.findOne({ id: listId });
    if (!entity) return 'entityNotFound';
    return await this.common.addNewPage({
      entity,
      repo: this.repo,
    });
  }

  /**
   * Deletes all the pages for that list
   */
  async deleteList(listId: string, creatorId: string) {
    const idWithoutPageDetails = getIdWithoutPageDetails(listId);
    try {
      await this.repo.delete({
        id: Like(idWithoutPageDetails + '%'),
      });
      const createdListsFeedEntity = await this.feedService.findOrCreate(
        FeedEntityType.USER_CREATED_LISTS,
        creatorId
      );
      createdListsFeedEntity.tryRemoveEntry(idWithoutPageDetails);
      await this.feedService.update(createdListsFeedEntity.id, {
        page: createdListsFeedEntity.page,
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  //Helpers
  /**
   * Find all the distinct UserListEntities created by a user
   * Returns Page 1 of all the lists created by the user
   */
  async findAllFirstPagesByUserId(userId: string): Promise<UserListEntity[]> {
    return await this.repo.find({
      where: {
        id: Like(userId + ID_SEPARATOR + '%' + PAGE_NUMBER_SEPARATOR + '1'),
      },
      order: { id: 'ASC' },
    });
  }

  /**
   * Returns Page#1 of the UserList
   */
  async findByListNameForUserId(
    name: string,
    userId: string
  ): Promise<UserListEntity | undefined> {
    return await this.repo.findOne({
      where: {
        id: Like(userId + ID_SEPARATOR + '%' + PAGE_NUMBER_SEPARATOR + '1'),
        name: name,
      },
    });
  }

  async findAllPages(entityId: string): Promise<UserListEntity[]> {
    return (await this.common.findAllPagesById({
      repo: this.repo,
      entityId,
    })) as UserListEntity[];
  }

  async findById(
    listId: string,
    shouldReturnFirstPage = true
  ): Promise<UserListEntity | undefined> {
    if (shouldReturnFirstPage) {
      upsertPageNumberToId(listId, 1);
    }
    return await this.repo.findOne({ id: listId });
  }

  async paginateAllListsCreatedByUser(
    userId: string,
    paginationInput: PaginationInput
  ): Promise<GetAllListsCreatedByUserResponse | undefined> {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_CREATED_LISTS, userId)
    );
    if (!feed) return;
    const [page, hasNextPage, hasPreviousPage] = await this.feedService.getPage(
      {
        feedOrId: feed,
      },
      paginationInput
    );
    const ids = page.ids.map(id => upsertPageNumberToId(id, 1));
    const listEntities: UserListEntity[] = await this.repo.findByIds(ids);
    return {
      listEntities,
      hasNextPage,
      hasPreviousPage,
    };
  }

  async paginateMembers(
    listId: string,
    paginationInput: PaginationInput
  ): Promise<PaginateEntriesResponse | undefined> {
    return await this.common.paginateEntries({
      entityId: listId,
      paginationInput,
      repo: this.repo,
    });
  }

  async paginateMemberGqlUsers(
    listId: string,
    paginationInput: PaginationInput,
    userService: UserService
  ) {
    this.logger.info('paginateMemberGqlUsers()', {});
    const paginatedResult: PaginateEntriesResponse | undefined =
      await this.paginateMembers(listId, paginationInput);
    if (!paginatedResult) {
      this.logger.error('Entries is null');
      throw Error('Something went wrong');
    }
    const userEntities = await userService.findAllById(paginatedResult.ids);
    const users = userEntities.map(user => userService.toUserObject({ user }));
    return {
      users,
      ...paginatedResult,
    };
  }

  async findInnerCircleMemberIndex(
    ownerId: string,
    entryToFind: string
  ): Promise<number> {
    // this.logger.info('findInnerCircleMemberIndex', {});
    return await this.findIndex(innerCircleListId(ownerId), entryToFind);
  }

  async findIndex(entityId: string, entryToFind: string): Promise<number> {
    // this.logger.info('findIndex()', {});
    try {
      const response = await this.common.indexOfEntry({
        repo: this.repo,
        entityId,
        entryToFind,
      });
      return response.index;
    } catch (e) {
      if (e instanceof PageNotFoundError) {
        this.logger.info('No record found', {});
      } else {
        this.logger.error(e);
      }
      return -1;
    }
  }

  async updateName(listId: string, name: string) {
    throw new Error('Unimplemented function');
  }

  async toGqlObj(entity: UserListEntity): Promise<UserList> {
    this.logger.info('toGqlObj', {});
    let iconUrl = '';
    if (entity.iconUrl) {
      if (entity.name === kInnerCircleListName) {
        this.logger.info('is INNER CIRCLE', {});
        const url = await this.toURL(kInnerCircleIconUrl);
        if (url) iconUrl = url.toString();
      } else {
        const url = await this.toURL(entity.iconUrl);
        if (url) iconUrl = url.toString();
      }
    }
    this.logger.info('iconUrl', { iconUrl });
    return {
      __typename: 'UserList',
      id: entity.id,
      name: entity.name,
      iconUrl,
      memberCount: entity.metaData?.memberCount,
    };
  }

  //------------------- helper
  async toURL(url: string): Promise<URL | undefined> {
    try {
      return await toUrl(
        url,
        this.logger,
        this.s3UrlPreSigner,
        this.cdnPvtS3UrlPreSigner
      );
    } catch (e) {
      this.logger.error(e);
    }
    return undefined;
  }
}
