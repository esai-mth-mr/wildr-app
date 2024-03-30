import { UserListEntity } from '@verdzie/server/user-list/userList.entity';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import {
  userPropertyKvPToUserPropertyMap,
  UserPropertyMapEntity,
} from '@verdzie/server/user-property-map/userPropertyMap.entity';
import {
  ID_SEPARATOR,
  PAGE_NUMBER_SEPARATOR,
} from '@verdzie/server/common/generateId';
import _ from 'lodash';
import { EntityManager, In, Like, Repository } from 'typeorm';
import validator from 'validator';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  PageInfo,
  PaginationInput,
  PaginationOrder,
} from '@verdzie/server/generated-graphql';
import { kInnerCircleListId } from '../../constants';
import { EntityFieldsNames } from 'typeorm/common/EntityFieldsNames';
import { DEFAULT_PAGINATION_COUNT } from '@verdzie/server/data/common';
import { FEED_ID_SEPARATOR, toFeedId } from '@verdzie/server/feed/feed.service';
import isNumeric = validator.isNumeric;

export const MAX_LENGTH_OF_PAGE = 1000000 / 16; // (1mb / 16 bytes)

@Injectable()
export class EntitiesWithPagesCommon {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'EntitiesWithPagesCommon' });
  }

  /**
   * Doesn't care about the page number.
   *
   * Removes the pageNumber via {@link getIdWithoutPageNumber}
   */
  async findAllPagesById(args: {
    entityId: string;
    repo: Repository<EntityWithListOfIds>;
    orderBy?: 'ASC' | 'DESC';
  }): Promise<EntityWithListOfIds[]> {
    const entityIdWithoutPageNumber = getIdWithoutPageDetails(args.entityId);
    let order:
      | {
          [P in EntityFieldsNames<EntityWithListOfIds>]?:
            | 'ASC'
            | 'DESC'
            | 1
            | -1;
        }
      | undefined;
    if (args.orderBy) {
      order = { id: args.orderBy };
    }
    return await args.repo.find({
      where: {
        // id: Like(entityIdWithoutPageNumber + '%'),
        id: In([
          upsertPageNumberToId(entityIdWithoutPageNumber, 1),
          entityIdWithoutPageNumber, //For old feeds
        ]),
      },
      order: order,
    });
  }

  /**
   * Stitches all entries in a list
   *
   * @throws PageNotFoundError
   *
   * @returns
   * {@link GetAllEntriesResponse}
   * (i) A single list with all the ids/entries
   * (ii) an array of lengths of all the page
   * (iii) an array of lengths of upper-bound of every page
   * (iv) an array of all the pages of a UserListEntity
   */
  async getAllEntriesFromEveryPage(args: {
    entityId: string;
    repo: Repository<EntityWithListOfIds>;
  }): Promise<GetAllEntriesResponse> {
    // this.logger.info('getAllEntriesFromEveryPage', { id: args.entityId });
    const allPages = await this.findAllPagesById({ ...args, orderBy: 'ASC' });
    if (allPages.length === 0) {
      // this.logger.warn('getAllEntriesFromEveryPage() -> No Page Found');
      throw new PageNotFoundError(
        'getAllEntriesFromEveryPage() -> Page not found error'
      );
    }
    const stitchedIdsList: string[] = [];
    const listLengths: number[] = [];
    const upperLimits: number[] = [];
    let upperLimit = 0;
    for (const list of allPages) {
      const ids = this.getIds(list);
      stitchedIdsList.push(...ids);
      listLengths.push(ids.length);
      upperLimit += ids.length;
      upperLimits.push(upperLimit);
    }
    return {
      stitchedIdsList,
      allPages,
      listLengths,
      upperLimits,
    };
  }

  getIds(entity: EntityWithListOfIds): string[] {
    if (entity instanceof UserPropertyMapEntity) {
      if (entity.userPropertyKvP) {
        userPropertyKvPToUserPropertyMap(entity.userPropertyKvP!).keys();
      }
      return [];
    }
    return entity.ids;
  }

  /**
   * Pushes entry to the `ids: string[]` array of {@link EntityWithListOfIds}
   */
  private pushEntry(
    entity: EntityWithListOfIds,
    entry: string
  ): EntityWithListOfIds {
    if (entity instanceof UserPropertyMapEntity) {
      return entity;
    } else {
      entity.ids.push(entry);
      entity.updatedAt = new Date();
    }
    return entity;
  }

  removeEntry(
    entity: EntityWithListOfIds,
    entryToRemove: string
  ): EntityWithListOfIds {
    if (entity instanceof UserPropertyMapEntity) {
      entity.removeEntry(entryToRemove);
    } else {
      _.remove(entity.ids, id => id.includes(entryToRemove));
    }
    return entity;
  }

  //TODO: Add optional `findIndex` function
  /**
   * Performs `include` check against the record
   */
  async indexOfEntry({
    entityId,
    entryToFind,
    repo,
  }: {
    entityId: string; //irrespective of the page number
    entryToFind: string;
    repo: Repository<EntityWithListOfIds>;
  }): Promise<GetIndexOfEntryResponse> {
    const allEntries = await this.getAllEntriesFromEveryPage({
      entityId,
      repo,
    });
    const index = allEntries.stitchedIdsList.findIndex(value =>
      value.includes(entryToFind)
    );
    const pageNumber = this.findPageNumberFromIndexOfEntry(allEntries, index);
    let indexInPage = index;
    if (pageNumber > 1) {
      const upperLimitNearestToIndex =
        allEntries.upperLimits[Math.max(0, pageNumber - 2)];
      indexInPage = index - upperLimitNearestToIndex;
    }
    // this.logger.info('Index of entry', {
    //   index,
    //   pageNumber,
    //   indexInPage,
    // });
    return {
      index,
      allEntries,
      pageNumber,
      indexInPage,
    };
  }

  /**
   * Throws Exception on failure
   *
   * - Adds entry to the last page of the Entity if the entry doesn't exist
   * - Updates the count in the metadata based on the EntityType
   * in any page
   * - Updates the count on the Page#1 (the original page)
   * - Creates a new page if the existing page is already filled
   * - Checks for duplicates in all the lists
   */
  private async tryAndPushItemToEntityWithoutTransaction(args: {
    entityId: string; //irrespective of the page number
    entryToAdd: string;
    repo: Repository<EntityWithListOfIds>;
  }): Promise<TryAndPushItemToEntityResult> {
    this.logger.info('tryAndPushItemToEntityWithoutTransaction', {
      entityId: args.entityId,
      entryToAdd: args.entryToAdd,
    });
    const repo = args.repo;
    const entitiesWithListOfIds = await this.indexOfEntry({
      repo,
      entityId: args.entityId,
      entryToFind: args.entryToAdd,
    });
    const allEntries: GetAllEntriesResponse = entitiesWithListOfIds.allEntries;
    const indexOfEntryToAdd = entitiesWithListOfIds.index;
    this.logger.info('indexOfEntryToAdd', { indexOfEntryToAdd });
    const firstEntity = _.first(allEntries.allPages);
    if (indexOfEntryToAdd > -1) {
      const pageNumber = this.findPageNumberFromIndexOfEntry(
        allEntries,
        indexOfEntryToAdd
      );
      this.logger.info('Entry already exist at page #', {
        pageNumber,
        entityId: args.entityId,
      });
      return {
        entity: firstEntity,
        didAddEntry: false,
      };
    }
    const lastPage = _.last(allEntries.allPages);
    if (lastPage) {
      await this.pushEntryAndSave({
        entity: lastPage,
        repo,
        entryToAdd: args.entryToAdd,
      });
      switch (repo.metadata.name) {
        case FeedEntity.name:
          const firstFeedEntity: FeedEntity = firstEntity as FeedEntity;
          firstFeedEntity.count++;
          await repo.update(firstFeedEntity.id, {
            _count: firstFeedEntity.count,
            updatedAt: new Date(),
          });
          return {
            entity: firstFeedEntity,
            didAddEntry: true,
          };
        case UserListEntity.name:
          const firstUserListEntity = firstEntity as UserListEntity;
          if (!firstUserListEntity.metaData)
            firstUserListEntity.metaData = { memberCount: 0 };
          firstUserListEntity.metaData.memberCount += 1;
          await repo.update(firstUserListEntity.id, {
            metaData: firstUserListEntity.metaData,
            updatedAt: new Date(),
          });
          return {
            entity: firstUserListEntity,
            didAddEntry: true,
          };
      }
    }
    this.logger.error('Failed to locate the lastPage');
    throw new Error('Something went wrong');
  }

  /**
   * @throws Exception on failure
   * @throws Exception when entry already exists
   *
   * - Performs action in a transaction (optional)
   * - Adds entry to the last page of the Entity if the entry doesn't exist
   * - Updates the count in the metadata based on the EntityType
   * in any page.
   * - Creates a new page if the existing page is already filled
   * - Checks for duplicates in all the lists
   */
  async tryAndPushItemToEntity(args: {
    entityId: string; //irrespective of the page number
    entryToAdd: string;
    repo: Repository<EntityWithListOfIds>;
    inTxt?: boolean | undefined;
  }): Promise<TryAndPushItemToEntityResult> {
    let entityType: FeedEntityType | undefined;
    try {
      entityType = parseInt(
        _.first(args.entityId.split(FEED_ID_SEPARATOR)) ?? '0'
      );
    } catch (e) {}
    this.logger.info('tryAndPushItemToEntityWithoutTransaction() EntityID', {
      entityType: FeedEntityType[entityType ?? 0],
      entityId: args.entityId,
      entryToAdd: args.entryToAdd,
    });
    if (args.inTxt)
      return await args.repo.manager.transaction<TryAndPushItemToEntityResult>(
        async manager => {
          const repo: Repository<EntityWithListOfIds> =
            this.getRepo(args.repo.metadata.name, manager) ?? args.repo;
          return await this.tryAndPushItemToEntityWithoutTransaction({
            ...args,
            repo,
          });
        }
      );
    return await this.tryAndPushItemToEntityWithoutTransaction(args);
  }

  getRepo(
    repoName: string,
    manager: EntityManager
  ): Repository<EntityWithListOfIds> | undefined {
    switch (repoName) {
      case FeedEntity.name:
        return manager.getRepository(FeedEntity);
      case UserListEntity.name:
        return manager.getRepository(UserListEntity);
      case UserPropertyMapEntity.name:
        return manager.getRepository(UserPropertyMapEntity);
    }
  }

  /**
   * @return Updated Entity;
   *
   * * Creates and returns a new Page if created.
   * * Also saves the new page in DB.
   *
   * @description Performs `repo.save()` and not `repo.update()`
   */
  private async pushEntryAndSave(args: {
    entity: EntityWithListOfIds;
    entryToAdd: string;
    repo: Repository<EntityWithListOfIds>;
  }): Promise<EntityWithListOfIds> {
    if (this.getIds(args.entity).length < MAX_LENGTH_OF_PAGE) {
      this.pushEntry(args.entity, args.entryToAdd);
      await args.repo.save(args.entity);
      return args.entity;
    } else {
      this.logger.info('creating a new page and adding entry to that', {
        entryToAdd: args.entryToAdd,
      });
      const updatedEntity = await this.addNewPage({ ...args, inTxt: false });
      this.pushEntry(updatedEntity, args.entryToAdd);
      await args.repo.save(updatedEntity);
      return updatedEntity;
    }
  }

  private async addNewPageWithoutTransaction(args: {
    entity: EntityWithListOfIds;
    repo: Repository<EntityWithListOfIds>;
  }): Promise<EntityWithListOfIds> {
    const repo = args.repo;
    const entity = args.entity;
    let newPageEntity: EntityWithListOfIds = entity;
    const allPages = await this.findAllPagesById({
      entityId: args.entity.id,
      repo,
    });
    const lastPage = _.last(allPages);
    if (!lastPage)
      throw new PageNotFoundError(`No page found for id ${entity.id}`);
    if (entity instanceof UserPropertyMapEntity) {
      newPageEntity = new UserPropertyMapEntity('', {}); //TODO: Fix it
    } else if (entity instanceof UserListEntity) {
      const listEntity = new UserListEntity();
      listEntity.name = (lastPage as UserListEntity).name;
      listEntity.iconUrl = (lastPage as UserListEntity).iconUrl;
      newPageEntity = listEntity;
    } else {
      newPageEntity = new FeedEntity();
    }
    newPageEntity.id = addNewPageNumberToId(lastPage.id);
    await repo.save(newPageEntity);
    return newPageEntity;
  }

  /**
   * * Performs action in Transaction (optional)
   * * Saves the new Page in the DB
   */
  async addNewPage(args: {
    entity: EntityWithListOfIds;
    repo: Repository<EntityWithListOfIds>;
    inTxt?: boolean | undefined;
  }): Promise<EntityWithListOfIds> {
    if (args.inTxt)
      return await args.repo.manager.transaction<EntityWithListOfIds>(
        async manager => {
          const repo: Repository<EntityWithListOfIds> =
            this.getRepo(args.repo.metadata.name, manager) ?? args.repo;
          return await this.addNewPageWithoutTransaction({ ...args, repo });
        }
      );
    return await this.addNewPageWithoutTransaction(args);
  }

  /**
   * @description
   * - Removes an entry (id) from the Entity
   * - Updates count in the first page
   *
   * @return the Entity#Page in which the memberId was removed.
   *
   * @example If there are two pages in a list `user_1#list_uuid#1` and
   * `user_1#list_uuid#2`, and memberId to remove is present in
   * user_1#list_uuid#2 the function will return `user_1#list_uuid#2`
   *
   * @throws PageNotFoundError
   */
  private async removeEntryFromEntityWithoutTransaction(args: {
    entityId: string; //irrespective of the page number
    entryToRemove: string;
    repo: Repository<EntityWithListOfIds>;
  }): Promise<RemoveEntryResult> {
    const repo = args.repo;
    const allEntries: GetAllEntriesResponse | undefined =
      await this.getAllEntriesFromEveryPage(args);
    const firstEntity = _.first(allEntries.allPages);
    if (!firstEntity) {
      throw new PageNotFoundError('No pages found for the id ' + args.entityId);
    }
    if (!allEntries) {
      this.logger.error('removeEntryFromEntity() No page found');
      throw new PageNotFoundError('Page does not exist');
    }
    const indexOfEntry = allEntries.stitchedIdsList.findIndex(value =>
      value.includes(args.entryToRemove)
    );
    if (indexOfEntry === -1) {
      this.logger.info(
        'removeEntryFromEntityWithoutTransaction() Entry does not exist',
        {}
      );
      return { entity: firstEntity, didRemoveEntry: false };
    }
    // this.logger.info('indexOfEntry', { indexOfEntry });
    const pageToRemoveFrom = this.findPageNumberFromIndexOfEntry(
      allEntries,
      indexOfEntry
    );
    this.logger.info('pageNumber', {
      pageToRemoveFrom,
      indexOfEntry,
      entryToRemove: args.entryToRemove,
    });
    if (pageToRemoveFrom === -1) {
      throw new PageNotFoundError(
        'removeEntryFromEntityWithoutTransaction()' + ' Could not find the page'
      );
    }
    let entityPage = allEntries.allPages[Math.max(0, pageToRemoveFrom - 1)];
    entityPage = this.removeEntry(entityPage, args.entryToRemove);
    await repo.save(entityPage);
    //Update the first page, original entity, with the total count
    switch (repo.metadata.name) {
      case FeedEntity.name:
        const firstFeedEntity: FeedEntity = firstEntity as FeedEntity;
        firstFeedEntity.count = Math.max(0, firstFeedEntity.count - 1);
        await repo.save(firstFeedEntity);
        return { entity: firstFeedEntity, didRemoveEntry: true };
      case UserListEntity.name:
        const firstUserListEntity = firstEntity as UserListEntity;
        if (!firstUserListEntity.metaData)
          firstUserListEntity.metaData = { memberCount: 0 };
        firstUserListEntity.metaData.memberCount = Math.max(
          0,
          firstUserListEntity.metaData.memberCount - 1
        );
        await repo.save(firstUserListEntity);
        return { entity: firstUserListEntity, didRemoveEntry: true };
    }
    return { entity: firstEntity, didRemoveEntry: true };
  }

  /**
   * @description
   * - Removes an entry (id) from the Entity in a *transaction*
   * - Updates count in the first page
   *
   * @return the Entity#Page in which the memberId was removed.
   *
   * @example If there are two pages in a list `user_1#list_uuid#1` and
   * `user_1#list_uuid#2`, and memberId to remove is present in
   * user_1#list_uuid#2 the function will return `user_1#list_uuid#2`
   *
   * @throws PageNotFoundError
   */
  async removeEntryFromEntity(args: {
    entityId: string; //irrespective of the page number
    entryToRemove: string;
    repo: Repository<EntityWithListOfIds>;
    inTxt?: boolean | undefined;
  }): Promise<RemoveEntryResult> {
    if (args.inTxt)
      return await args.repo.manager.transaction(async manager => {
        const repo: Repository<EntityWithListOfIds> =
          this.getRepo(args.repo.metadata.name, manager) ?? args.repo;
        return await this.removeEntryFromEntityWithoutTransaction({
          ...args,
          repo,
        });
      });
    return await this.removeEntryFromEntityWithoutTransaction(args);
  }

  /**
   * Params:
   * `response` -> [GetAllEntriesResponse]
   * <pre><code>
   * GetAllEntriesResponse {
   *  stitchedIdsList: string[];
   *  allPages: EntityWithIdAndIds[];
   *  listLengths: number[];
   *  upperLimits: number[];
   * }
   * </code></pre>
   *
   * Uses `stitchedIdsList` form `response` and finds the Page number in which
   * the index was found.
   */
  findPageNumberFromIndexOfEntry(
    response: GetAllEntriesResponse,
    indexOfMember: number
  ): number {
    // this.logger.info('findPageNumberFromIndexOfEntry', { response: response. });
    const upperLimits = response.upperLimits;
    for (let i = 0; i < upperLimits.length; i++)
      if (indexOfMember < upperLimits[i]) return i + 1;
    return -1;
  }

  /**
   * Ignores the PageDetails form id and uses args.pageNumber to create a new id
   */
  async getPage(args: {
    pageNumber: number;
    entityId: string;
    repo: Repository<EntityWithListOfIds>;
  }): Promise<EntityWithListOfIds | undefined> {
    const idWithoutPageNumber = getIdWithoutPageDetails(args.entityId);
    const idWithPageNumber = upsertPageNumberToId(
      idWithoutPageNumber,
      args.pageNumber
    );
    if (args.pageNumber === -1) {
      return _.first(
        await args.repo.find({
          where: { id: Like(idWithoutPageNumber + '%') },
          order: { id: 'DESC' },
          take: 1,
        })
      );
    } else if (args.pageNumber === 1) {
      return _.first(
        await args.repo.find({
          where: {
            id: In([
              idWithPageNumber,
              idWithoutPageNumber, //For old feeds
            ]),
          },
          take: 1,
        })
      );
    } else {
      return _.first(
        await args.repo.find({
          where: { id: idWithPageNumber },
          take: 1,
        })
      );
    }
  }

  /**
   * Ignores the PageDetails form id and uses args.pageNumber to create a
   * new id
   * * Reads pageNumber form {@link PaginationInput.pageNumber} and based on
   * {@link PaginationOrder}
   */
  async paginateEntries(args: {
    entityId: string;
    repo: Repository<EntityWithListOfIds>;
    paginationInput: PaginationInput;
    predicate?: FilterPaginateEntriesPredicate;
    backwardsCompatibility?: boolean;
  }): Promise<PaginateEntriesResponse | undefined> {
    // this.logger.info('paginateEntries()', { predicate: args.predicate });
    const entityId = args.entityId;
    const predicate = args.predicate;
    const repo = args.repo;
    const paginationInput = args.paginationInput;
    let pageNumber: number | undefined =
      paginationInput.pageNumber ?? undefined;
    let pageEntity: EntityWithListOfIds | undefined;
    let isAtLastPage: boolean | undefined;
    const topToBottom =
      (paginationInput.order ?? PaginationOrder.OLDEST_FIRST) ===
      PaginationOrder.OLDEST_FIRST;
    if (topToBottom) {
      pageEntity = await this.getPage({
        repo,
        entityId,
        // pageNumber: pageNumber ?? 1, // First page
        pageNumber: 1, // First page
      });
      if (!pageEntity) {
        this.logger.error('Page not found', { entityId });
        return;
      }
      //Determining last page would be an overkill at this point
    } else {
      this.logger.info('BottomToTop', {});
      pageEntity = await this.getPage({
        repo,
        entityId,
        // pageNumber: pageNumber ?? -1, //Last page
        pageNumber: 1, //Last(The only( page
      });
      if (!pageEntity) {
        this.logger.error('Page not found', { entityId });
        return;
      }
      isAtLastPage = getPageNumberFromId(pageEntity.id) === 1;
    }
    pageNumber = getPageNumberFromId(pageEntity.id);
    let pageIdsAndInfo: PageIdsAndInfo | undefined;
    let getPages: () => PageIdsAndInfo;
    switch (repo.metadata.name) {
      case FeedEntity.name:
        getPages = () => {
          return {
            ...this.getIdsFromPage(
              (pageEntity as FeedEntity).page.ids,
              paginationInput,
              predicate,
              args.backwardsCompatibility ?? false
            ),
          };
        };
        break;
      case UserListEntity.name:
        getPages = () => {
          return {
            ...this.getIdsFromPage(
              (pageEntity as UserListEntity).ids,
              paginationInput,
              predicate
            ),
            totalCount: (pageEntity as UserListEntity).ids.length,
          };
        };
        break;
      default:
        getPages = () => {
          return {
            ids: [],
            hasMoreItems: false,
            hasPreviousItems: false,
            totalCount: 0,
          };
        };
        break;
    }
    pageIdsAndInfo = getPages();
    const totalCount = pageIdsAndInfo.totalCount;
    if (
      !isAtLastPage &&
      pageIdsAndInfo.ids.length < (paginationInput.take ?? 1)
    ) {
      let loopCounter = 0;
      while (pageIdsAndInfo.ids.length < (paginationInput.take ?? 1)) {
        if (loopCounter == 500) {
          this.logger.warn('STUCK IN A LOOP');
          break;
        }
        const newPage = await this.getNextPage(pageEntity, repo, topToBottom);
        if (newPage) {
          const oldIds = pageIdsAndInfo.ids;
          pageIdsAndInfo = getPages();
          pageIdsAndInfo.ids.unshift(...oldIds);
          pageNumber = getPageNumberFromId(newPage.id);
        } else {
          // this.logger.info('Is at the last page');
          isAtLastPage = true;
          break;
        }
        loopCounter++;
      }
    }
    if (pageIdsAndInfo) {
      return {
        ids: pageIdsAndInfo.ids,
        hasMoreItems: pageIdsAndInfo.hasMoreItems,
        hasPreviousItems: pageIdsAndInfo.hasPreviousItems,
        pageNumber,
        totalCount,
      };
    }
  }

  async getNextPage(
    pageEntity: EntityWithListOfIds,
    repo: Repository<EntityWithListOfIds>,
    topToBottom: boolean
  ): Promise<EntityWithListOfIds | undefined> {
    if (topToBottom) {
      //Go to next page
      const nextPageNumber = getPageNumberFromId(pageEntity.id) + 1;
      const newId = upsertPageNumberToId(pageEntity.id, nextPageNumber);
      const result = await repo.findByIds([newId]);
      return _.first(result);
    } else {
      //Go to previous page
      const nextPageNumber = getPageNumberFromId(pageEntity.id) - 1; //PageNumber will always be > 1
      const newId = upsertPageNumberToId(pageEntity.id, nextPageNumber);
      const result = await repo.findByIds([newId]);
      return _.first(result);
    }
  }

  /**
   * Calculates {@link PageCursor} based on user's preference
   * ----
   *
   * ### Page 1: [T0, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]
   * ### Page 2: [T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20]
   * ### Page 3: [T20, T21, T22, T23, T24, T25, T26, T27, T28, T29, T30]
   *
   * ## Order of Pagination = OLDEST_FIRST
   * ### example: Replies Page
   *
   * | Case 1: User wants to load previous content (older content)
   *
   * - is at `T6` Cursor position UP, P1⬆
   * - is at `T11` and requests for 5 items, Cursor position UP, P2⬆ -> P1⬆;
   * moves from P2 to P1
   *
   * | Case 1.2: User wants to paginate content, (load new content)
   * - is at `T6`:  Cursor position DOWN, P1⬇
   * - is at `T10`:  Cursor position DOWN, P1⬇ -> P2⬇; moves from P1 to P2
   *
   * ## Order of Pagination = DEFAULT | NEWEST_FIRST
   * ### example: Posts Feed, Comments Page
   *
   * | Case 2: User wants to load previous content (load newer content)
   * - is at `T6` [Result] Cursor position DOWN, P1⬇
   * - is at `T16` [Result] Cursor position DOWN, P2⬇
   *
   * | Case 2.2: User wants to paginate content (load old content)
   * - is at `T30` Cursor position DOWN, P3⬆
   * - is at `T21` Cursor position DOWN, P3⬆ -> P2⬆, i.e. moves form P3 to P2
   *
   */
  getCursor(paginationInput: PaginationInput): PageCursor {
    //Based on the order we'll divide whether cursor is going up or down
    if (
      paginationInput.order &&
      paginationInput.order === PaginationOrder.OLDEST_FIRST
    ) {
      if (paginationInput.before || paginationInput.includingAndBefore) {
        //Towards the top, since loading before ~ "load previous" i.e. older,
        // therefore go up P1⬆ P2 P3 P4
        return {
          type: 'PageCursorUp',
          take: paginationInput.take ?? DEFAULT_PAGINATION_COUNT,
          cursor:
            paginationInput.includingAndBefore ?? paginationInput.before ?? '',
          shouldIncludeCursor: !!paginationInput.includingAndBefore,
        };
      } else {
        //Towards the bottom, since loading after ~ "paginate" i.e. newer but
        // starting form older, therefore From Top to Bottom P1⬇ P2 P3 P4
        return {
          type: 'PageCursorDown',
          take: paginationInput.take ?? DEFAULT_PAGINATION_COUNT,
          cursor:
            paginationInput.includingAndAfter ?? paginationInput.after ?? '',
          shouldIncludeCursor: !!paginationInput.includingAndAfter,
        };
      }
    } else {
      if (paginationInput.before || paginationInput.includingAndBefore) {
        //Top to Bottom P1 P2 P3 P4⬇
        //Towards the bottom, since loading before ~ "load newer"
        return {
          type: 'PageCursorDown',
          take: paginationInput.take ?? DEFAULT_PAGINATION_COUNT,
          cursor:
            paginationInput.includingAndBefore ?? paginationInput.before ?? '',
          shouldIncludeCursor: !!paginationInput.includingAndBefore,
        };
      }
      return {
        //Bottom to Top P1 P2 P3 P4⬆
        //Towards the top, since loading after ~ "load older"
        type: 'PageCursorUp',
        take: paginationInput.take ?? DEFAULT_PAGINATION_COUNT,
        cursor:
          paginationInput.includingAndAfter ?? paginationInput.after ?? '',
        shouldIncludeCursor: !!paginationInput.includingAndAfter,
      };
    }
  }

  /**
   * Provides {@link PageIdsAndInfo} from the provided Page.
   *
   * !! Does not check next page
   */
  getIdsFromPage(
    page: string[],
    paginationInput: PaginationInput,
    filterPredicate?: FilterPaginateEntriesPredicate,
    backwardsCompatibility = false
  ): PageIdsAndInfo {
    const pageCursor = this.getCursor(paginationInput);
    let ids = page;
    if (filterPredicate) ids = ids.filter(filterPredicate);
    const totalCount = ids.length;
    let result: string[] = [];
    let hasMoreItems = false;
    let hasPreviousItems = false;
    const firstEntryOnFilteredPage = _.first(ids);
    const lastEntryOnFilteredPage = _.last(ids);
    let firstEntryInResult: string | undefined;
    let lastEntryInResult: string | undefined;
    // this.logger.debug('paginationInput', { paginationInput });
    // this.logger.debug('pageCursor', { type: pageCursor });
    switch (pageCursor.type) {
      case 'PageCursorUp':
        //take from end
        if (pageCursor.cursor) {
          ids = _.dropRightWhile(
            ids,
            (id: string) => !id.includes(pageCursor.cursor)
          );
          if (!pageCursor.shouldIncludeCursor) ids = _.dropRight(ids);
        }
        result = _.takeRight(ids, pageCursor.take);
        firstEntryInResult = _.first(result);
        lastEntryInResult = _.last(result);
        if (!backwardsCompatibility) result = result.reverse();
        break;
      case 'PageCursorDown':
        if (pageCursor.cursor) {
          ids = _.dropWhile(
            ids,
            (id: string) => !id.includes(pageCursor.cursor)
          );
          if (!pageCursor.shouldIncludeCursor) ids = _.drop(ids);
        }
        result = _.take(ids, pageCursor.take);
        firstEntryInResult = _.first(result);
        lastEntryInResult = _.last(result);
        if (!backwardsCompatibility) result = result.reverse();
        break;
    }
    // this.logger.info('pageCursor', {
    //   pageCursor,
    //   firstEntryOnFilteredPage,
    //   firstEntryInResult,
    //   lastEntryOnFilteredPage,
    //   lastEntryInResult,
    // });
    switch (pageCursor.type) {
      case 'PageCursorUp':
        if (
          firstEntryOnFilteredPage !== undefined &&
          firstEntryInResult !== undefined
        ) {
          hasMoreItems = firstEntryOnFilteredPage !== firstEntryInResult;
        }
        if (
          lastEntryOnFilteredPage !== undefined &&
          lastEntryInResult !== undefined
        ) {
          hasPreviousItems = lastEntryOnFilteredPage !== lastEntryInResult;
        }
        break;
      case 'PageCursorDown':
        if (
          firstEntryOnFilteredPage !== undefined &&
          firstEntryInResult !== undefined
        ) {
          hasPreviousItems = firstEntryOnFilteredPage !== firstEntryInResult;
        }
        if (
          lastEntryOnFilteredPage !== undefined &&
          lastEntryInResult !== undefined
        ) {
          hasMoreItems = lastEntryOnFilteredPage !== lastEntryInResult;
        }
        break;
    }
    return {
      hasMoreItems,
      hasPreviousItems,
      ids: result,
      totalCount,
    };
  }

  async replaceEntryWithoutTxt({
    entityId,
    entryIndex,
    pageNumber,
    entryToReplace,
    repo,
  }: ReplaceEntryInput): Promise<ReplaceEntryOutput | undefined> {
    if (pageNumber) {
      entityId = upsertPageNumberToId(entityId, pageNumber);
    }
    let entity = await repo.findOne({ id: entityId });
    if (!entity) {
      entity = await repo.findOne({ id: getIdWithoutPageDetails(entityId) });
    }
    if (!entity) {
      throw new PageNotFoundError(`No page found for id ${entityId}`);
    }
    switch (repo.metadata.name) {
      case FeedEntity.name:
        const updatedEntity: FeedEntity = entity as FeedEntity;
        updatedEntity.ids[entryIndex] = entryToReplace;
        await repo.update(updatedEntity.id, {
          page: updatedEntity.page,
        });
        return {
          entity: updatedEntity,
          didReplaceEntry: true,
        };
      case UserListEntity.name:
        const firstUserListEntity = entity as UserListEntity;
        firstUserListEntity.ids[entryIndex] = entryToReplace;
        await repo.update(firstUserListEntity.id, {
          ids: firstUserListEntity.ids,
        });
        return {
          entity: firstUserListEntity,
          didReplaceEntry: true,
        };
    }
  }

  async replaceEntry(
    args: ReplaceEntryInput
  ): Promise<ReplaceEntryOutput | undefined> {
    let entityType: FeedEntityType | undefined;
    try {
      entityType = parseInt(
        _.first(args.entityId.split(FEED_ID_SEPARATOR)) ?? '0'
      );
    } catch (e) {}
    this.logger.info('replaceEntry()', {
      entityType: FeedEntityType[entityType ?? 0],
      entityId: args.entityId,
      entryToReplace: args.entryToReplace,
      pageNumber: args.pageNumber,
      index: args.entryIndex,
    });
    if (args.shouldStartTxt) {
      return await args.repo.manager.transaction(async manager => {
        const repo: Repository<EntityWithListOfIds> =
          this.getRepo(args.repo.metadata.name, manager) ?? args.repo;
        return await this.replaceEntryWithoutTxt({ ...args, repo });
      });
    }
    return await this.replaceEntryWithoutTxt({ ...args });
  }
}

export interface ReplaceEntryInput {
  entityId: string; //irrespective of the page number
  entryIndex: number;
  pageNumber?: number;
  entryToReplace: string;
  repo: Repository<EntityWithListOfIds>;
  shouldStartTxt?: boolean | undefined;
}

export type EntityWithListOfIds =
  | FeedEntity
  | UserListEntity
  | UserPropertyMapEntity;

/**
 * Contains '#' in the end
 * * if the id is abc#uuid#1 returns 'abc#uuid#'
 * * if the id does not contain any page info, i.e. id = `abc#uuid` or
 * `abc#123`, returns the same id without `#` in the end
 */
export const getIdWithoutPageNumber = (entityId: string): string => {
  let id = entityId;
  const list = id.split(PAGE_NUMBER_SEPARATOR);
  if (list.length == 1) {
    //i.e. no page number details
    return id;
  }
  if (isNumeric(_.last(list) ?? '')) {
    list.splice(-1);
    id = '';
    for (const str of list) {
      id += str;
      id += ID_SEPARATOR;
    }
  }
  return id;
};

/**
 * if the id is`abc#uuid#1` returns `abc#uuid`
 * i.e. removes `#<page-number>`
 */
export const getIdWithoutPageDetails = (entityId: string): string => {
  const id = getIdWithoutPageNumber(entityId);
  if (_.last(id) === '#') return id.slice(0, -1);
  return id;
};

/**
 * Requires: '#' as separator and the id to be in format `__#__#<page-number>`
 *
 * Supports:  id without a page number i.e. `__#__`
 *
 * Returns: `1` if the id does not have a page number
 *
 * Returns: the page number from id with format `__#__#<page-number>`
 *
 * Example Input: `user_id#uuid#001` -----> Output: `1`
 *
 * Example Input: `user_id#uuid#012` -----> Output: `12`
 *
 * Example Input: `user_id#321` -----> Output: `1`  //returns page #1
 */
export const getPageNumberFromId = (id: string): number => {
  const list = id.split(PAGE_NUMBER_SEPARATOR);
  if (list.length == 1) return 1;
  return Number(_.last(list));
};

/**
 * Converts a numeric page number of ### String format
 *
 * Converts `1` to `001`
 * Converts `12` to `012`
 * Converts `123` to `123`
 * Converts `1234` to `1234`
 */
export const getPageNumberStr = (pageNumber: number) => {
  return String(pageNumber).padStart(3, '0');
};

/**
 * Expected Formats
 * - userId#uuid~#<<pageNumber>>
 * - userId#~ic~~#<<pageNumber>> //Inner circle
 * @param listId
 */
export const getUUIDFromListId = (listId: string): string | undefined => {
  if (listId.includes(kInnerCircleListId)) {
    //Is Inner Circle
    const list = listId.split(PAGE_NUMBER_SEPARATOR);
    return _.first(list);
  }
  const list = listId.split(RegExp(ID_SEPARATOR + '|' + PAGE_NUMBER_SEPARATOR));
  if (list.length > 1) {
    return list[1];
  }
};

export const getUserIdFromListId = (listId: string): string | undefined => {
  return _.first(listId.split(ID_SEPARATOR));
};

/**
 * Returns a new id with the provided pageNumber
 * - replaces page number, if any, in the `id` with `pageNumber`
 * - Page number starts with 1, i.e. if pageNumber = 0 is passed, it'll be
 * bumped to 1.
 *
 * Example
 *
 * args: id = 'user_id#uid'; pageNumber = 1; output = user_id#uid#001
 *
 * args: id = 'user_id#uid#002'; pageNumber = 1; output = user_id#uid#001
 *
 * args: id = 'user_id#uid#2'; pageNumber = 1; output = user_id#uid#001
 */
export const upsertPageNumberToId = (
  id: string,
  pageNumber: number
): string => {
  const pageNumberStr = getPageNumberStr(Math.max(1, pageNumber));
  const list = id.split(PAGE_NUMBER_SEPARATOR);
  if (list.length == 1) {
    //No page number
    id += PAGE_NUMBER_SEPARATOR + pageNumberStr;
    return id;
  }
  if (isNumeric(_.last(list) ?? '')) {
    //if it has a page number, remove that replace that page number with
    // new one
    list.splice(-1); //Remove the page details
    id = '';
    for (const str of list) {
      id += str;
      id += PAGE_NUMBER_SEPARATOR;
    }
    id += pageNumberStr;
  }
  return id;
};

export const getFirstFeedPageId = (
  feedEntityType: FeedEntityType,
  id: string
) => {
  return upsertPageNumberToId(toFeedId(feedEntityType, id), 1);
};

export const getFirstPageId = (feedId: string) => {
  return upsertPageNumberToId(feedId, 1);
};

/**
 * Returns a new id with incremented page number
 */
export const addNewPageNumberToId = (id: string): string => {
  let pageNumber = getPageNumberFromId(id);
  return upsertPageNumberToId(id, ++pageNumber);
};

export interface PageCursorSuper {
  take: number;
  cursor: string;
  shouldIncludeCursor: boolean;
}

export interface PageIdsAndInfo {
  ids: string[];
  hasMoreItems: boolean;
  hasPreviousItems: boolean;
  totalCount: number;
}

export interface PageCursorUp extends PageCursorSuper {
  type: 'PageCursorUp';
}

export interface PageCursorDown extends PageCursorSuper {
  type: 'PageCursorDown';
}

export type PageCursor = PageCursorUp | PageCursorDown;

export interface GetAllEntriesResponse {
  stitchedIdsList: string[];
  allPages: EntityWithListOfIds[];
  listLengths: number[];
  upperLimits: number[];
}

export interface GetIndexOfEntryResponse {
  index: number;
  indexInPage: number;
  pageNumber: number;
  allEntries: GetAllEntriesResponse;
}

export interface PaginateEntriesResponse {
  ids: string[];
  pageNumber: number;
  hasMoreItems: boolean;
  hasPreviousItems: boolean;
  totalCount: number;
}

export const getEmptyPaginateEntriesResponse = (): PaginateEntriesResponse => {
  return {
    ids: [],
    pageNumber: 1,
    hasMoreItems: false,
    hasPreviousItems: false,
    totalCount: 0,
  };
};

export const getGqlPageInfoFromPaginatedResponse = (
  response: PaginateEntriesResponse
): PageInfo => {
  return {
    __typename: 'PageInfo',
    pageNumber: response.pageNumber,
    hasNextPage: response.hasMoreItems,
    hasPreviousPage: response.hasPreviousItems,
    startCursor: _.first(response.ids) ?? '',
    endCursor: _.last(response.ids) ?? '',
  };
};

export class PageNotFoundError extends Error {}

export type FilterPaginateEntriesPredicate = (
  value: string,
  index: number
) => boolean;

export interface TryAndPushItemToEntityResult {
  entity: EntityWithListOfIds | undefined;
  didAddEntry: boolean;
}

export interface RemoveEntryResult {
  entity: EntityWithListOfIds;
  didRemoveEntry: boolean;
}

export interface ReplaceEntryOutput {
  entity: EntityWithListOfIds | undefined;
  didReplaceEntry: boolean;
}
