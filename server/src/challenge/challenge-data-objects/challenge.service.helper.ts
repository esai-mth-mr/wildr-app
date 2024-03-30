import { UserEntity } from '@verdzie/server/user/user.entity';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { PaginationInput } from '@verdzie/server/generated-graphql';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import {
  getFirstFeedPageId,
  getFirstPageId,
} from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { getLogger } from '@verdzie/server/winstonBeanstalk.module';

export interface FindChallengeParticipantsResult {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  participantsInfoMap?: ChallengeParticipantsInfoMap;
}

export interface ChallengeParticipantMeta {
  postId?: string;
  entryCount?: number;
  userEntity?: UserEntity;
  postEntity?: PostEntity;
  isFriend?: boolean;
}

export type ChallengeParticipantsInfoMap = Map<
  string,
  ChallengeParticipantMeta
>;

export enum ChallengeEntryType {
  ALL = 1,
  FEATURED = 2,
  TODAY = 3,
  USER = 4,
}

export type ChallengeEntriesPaginationInput = {
  challenge: ChallengeEntity;
  paginationInput: PaginationInput;
  entryType: ChallengeEntryType;
  currentUser?: UserEntity;
  targetEntryId?: string;
  userToSearchForId?: string;
  timezoneOffset?: string;
};

export interface GetFeedAndPrepareUserIdsToSkipResponse {
  feed?: FeedEntity;
  userIdsToSkip: string[];
}

export interface ChallengeEntry {
  post: PostEntity;
  isPinned: boolean;
  isHidden: boolean;
}

export interface GetChallengeEntriesResult {
  entries: ChallengeEntry[];
  hasMoreItems: boolean;
  hasPreviousItems: boolean;
  count: number;
  totalCount: number;
  targetEntryError?: string;
}

export const fromChallengeParticipantPostEntryStr = (
  entryStr: string
): ChallengeParticipantPostEntry | undefined => {
  try {
    const entry = JSON.parse(entryStr);
    entry.date = new Date(entry.date);
    return entry;
  } catch (e) {
    //console.log('Error parsing challenge participant post entry string', e);
    return;
  }
};

export const toChallengeParticipantPostEntryStr = (
  entry: ChallengeParticipantPostEntry
): string => {
  // Ensures consistent order of properties in entry string
  return JSON.stringify({
    postId: entry.postId,
    authorId: entry.authorId,
    date: entry.date.toISOString(),
    hasPinned: entry.hasPinned,
  });
};

export interface ChallengeParticipantPostEntry {
  postId: string;
  authorId?: string;
  date: Date;
  hasPinned: boolean;
}

export interface ChallengeCreatedResult {
  trollDetection?: ChallengeTrollDetectionResult;
  errorMessage?: string;
  createdChallenge?: {
    challenge: ChallengeEntity;
    creator: UserEntity;
  };
}

export interface ChallengeTrollDetectionResult {
  nameResult?: string;
  descriptionResult?: string;
}

export interface AfterChallengeCreatedTasksResult {
  creator: UserEntity;
  challenge: ChallengeEntity;
}

export const getChallengeParticipantsFeedId = (challengeId: string): string => {
  return getFirstPageId(
    toFeedId(FeedEntityType.CHALLENGE_PARTICIPANTS, challengeId)
  );
};

export const getChallengeAllPostsFeedId = (challengeId: string): string => {
  return getFirstPageId(
    toFeedId(FeedEntityType.CHALLENGE_ALL_POST_ENTRIES, challengeId)
  );
};

export const getChallengeFeaturedPostsFeedId = (
  challengeId: string
): string => {
  return getFirstFeedPageId(
    FeedEntityType.CHALLENGE_FEATURED_ENTRIES,
    challengeId
  );
};

export const getCurrentUserBlockedByFeedId = (user: UserEntity): string => {
  return toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, user.id);
};

export const getCurrentUserBlockedFeedId = (user: UserEntity): string => {
  return toFeedId(FeedEntityType.BLOCK_LIST, user.id);
};

export const getUserPostEntriesOnChallengeFeedId = (
  challengeId: string,
  userId: string
): string => {
  return getFirstPageId(
    toFeedId(FeedEntityType.USER_CHALLENGE_POST_ENTRIES, challengeId, userId)
  );
};

export const getChallengePinnedEntriesFeedId = (
  challengeId: string
): string => {
  return getFirstFeedPageId(
    FeedEntityType.CHALLENGE_PINNED_ENTRIES,
    challengeId
  );
};

export const getChallengeLeaderboardFeedId = (challengeId: string): string => {
  return getFirstPageId(
    toFeedId(FeedEntityType.CHALLENGE_LEADERBOARD, challengeId)
  );
};

export const getChallengeCommentsFeedId = (challengeId: string): string => {
  return getFirstFeedPageId(FeedEntityType.COMMENT, challengeId);
};

export interface FeaturedChallengeFeedEntry {
  id: string;
  endDate?: Date;
}

export const fromFeaturedChallengeIdString = (
  edgeStr: string
): FeaturedChallengeFeedEntry | undefined => {
  try {
    const edge = JSON.parse(edgeStr);
    edge.endDate = edge.endDate ? new Date(edge.endDate) : undefined;
    return edge;
  } catch (error) {
    getLogger().error('error parsing featured challenge entry string', {
      error,
      methodName: 'fromFeaturedChallengeIdString',
    });
    return;
  }
};

export const toFeaturedChallengesIdString = (
  edge: FeaturedChallengeFeedEntry
): string => {
  // Ensures consistent order of properties in entry string
  return JSON.stringify({
    id: edge.id,
    endDate: edge.endDate ? edge.endDate.toISOString() : undefined,
  });
};

export interface ChallengeParticipant {
  id: string;
  postId?: string; //Most recent postId
  entryCount?: number;
}

export const fromChallengeParticipantIdString = (
  edgeStr: string
): ChallengeParticipant | undefined => {
  try {
    const edge = JSON.parse(edgeStr);
    return edge;
  } catch (e) {
    getLogger().error('error parsing challenge participant entry', {
      error: e,
      methodName: 'fromChallengeParticipantIdString',
    });
    return;
  }
};

export const toChallengeParticipantIdString = (
  edge: ChallengeParticipant
): string => {
  // Ensures consistent order of properties in entry string
  return JSON.stringify({
    id: edge.id,
    postId: edge.postId,
    entryCount: edge.entryCount,
  });
};
