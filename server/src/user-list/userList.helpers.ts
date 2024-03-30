import {
  FeedEntityType,
  ListPostsForConsumptionBasedOnPostTypes,
} from '@verdzie/server/feed/feed.entity';
import {
  getIdWithoutPageDetails,
  upsertPageNumberToId,
} from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { PostType } from '@verdzie/server/post/data/post-type';
import { generateId, ID_SEPARATOR } from '@verdzie/server/common/generateId';
import { kInnerCircleListId } from '../../constants';
import { UserListEntity } from '@verdzie/server/user-list/userList.entity';
import { User } from '@verdzie/server/graphql';

export const getPostFeedId = (
  listId: string,
  feedType: FeedEntityType,
  pageNumber = 1
): string => {
  const id = getIdWithoutPageDetails(listId);
  return upsertPageNumberToId(toFeedId(feedType, id), pageNumber);
};

export const getListPostConsumptionFeedId = (
  listId: string,
  postType: PostType | undefined,
  pageNumber = 1
): string => {
  const type = ListPostsForConsumptionBasedOnPostTypes[postType ?? 0];
  return getPostFeedId(listId, type, pageNumber);
};

export const listIdWithoutPageDetails = (creatorId: string) => {
  return creatorId + ID_SEPARATOR + generateId();
};

export const innerCircleListIdWithoutPageDetails = (creatorId: string) => {
  return creatorId + ID_SEPARATOR + kInnerCircleListId;
};

export const innerCircleListIdForFetchingPostsFeed = (creatorId: string) => {
  return creatorId + ID_SEPARATOR + kInnerCircleListId;
};

export const isInnerCircleId = (id: string) => id.includes(kInnerCircleListId);

/**
 * Id Format = userId ~ic~ ~# <page-number>
 */
export const innerCircleListId = (userId: string, pageNumber = 1): string => {
  const idWithoutPageDetails = innerCircleListIdWithoutPageDetails(userId);
  return upsertPageNumberToId(idWithoutPageDetails, pageNumber);
};

/**
 * Expected id format
 * userId # ..........
 * @param ownerId
 * @param entityId
 */
export const isOwnerOfTheEntityId = (ownerId: string, entityId: string) => {
  return entityId.startsWith(ownerId);
};

export interface GetAllListsCreatedByUserResponse {
  listEntities: UserListEntity[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MembersListAndParentDetails {
  length: number;
  list: string[];
  pageNumber: number;
}

export class ListAlreadyExistsError extends Error {}

export class EntryDoesNotExistError extends Error {}

export interface PaginateGqLUserListResponse {
  users: User;
  pageNumber: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class OwnerNotMatchError extends Error {}

export class NoUUIDFoundError extends Error {}
