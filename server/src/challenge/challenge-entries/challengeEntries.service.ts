import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  ChallengeEntriesPaginationInput,
  ChallengeEntry,
  ChallengeEntryType,
  ChallengeParticipantPostEntry,
  getChallengeAllPostsFeedId,
  GetChallengeEntriesResult,
  getChallengeFeaturedPostsFeedId,
  fromChallengeParticipantPostEntryStr,
  getUserPostEntriesOnChallengeFeedId,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import {
  FilterPaginateEntriesPredicate,
  PageNotFoundError,
  PaginateEntriesResponse,
  getEmptyPaginateEntriesResponse,
} from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { PostService } from '@verdzie/server/post/post.service';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import {
  PaginationInput,
  PaginationOrder,
} from '@verdzie/server/generated-graphql';
import { format, getTimezoneOffset } from 'date-fns-tz';
import { last } from 'lodash';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { Result, err, ok } from 'neverthrow';

const DATE_FORMAT = 'yyyy-MM-dd';

@Injectable()
export class ChallengeEntriesService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly feedService: FeedService,
    private readonly postService: PostService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  private async getBlockedOrBlockedByUserIds(
    user?: UserEntity
  ): Promise<Set<string>> {
    if (!user) {
      return new Set();
    }
    const feedIdsToGet: string[] = [];
    const blockedFeedId = toFeedId(FeedEntityType.BLOCK_LIST, user.id);
    feedIdsToGet.push(blockedFeedId);
    const blockedByFeedId = toFeedId(
      FeedEntityType.BLOCKED_BY_USERS_LIST,
      user.id
    );
    feedIdsToGet.push(blockedByFeedId);
    const feedsMap = await this.feedService.findByIdsWithMap(feedIdsToGet);
    const userIdsToSkip: Set<string> = new Set();
    const blockedFeed = feedsMap.get(blockedFeedId);
    if (blockedFeed) blockedFeed.ids.forEach(id => userIdsToSkip.add(id));
    const blockedByFeed = feedsMap.get(blockedByFeedId);
    if (blockedByFeed) blockedByFeed.ids.forEach(id => userIdsToSkip.add(id));
    return userIdsToSkip;
  }

  private async getBlockedUserIds(userId: string): Promise<Set<string>> {
    const blockedFeed = await this.feedService.find(
      toFeedId(FeedEntityType.BLOCK_LIST, userId)
    );
    if (!blockedFeed) return new Set();
    return new Set(blockedFeed.ids);
  }

  private getEntriesPredicate({
    userIdsToSkip,
  }: {
    userIdsToSkip: Set<string>;
  }): FilterPaginateEntriesPredicate {
    return (entryStr: string) => {
      const entry = fromChallengeParticipantPostEntryStr(entryStr);
      if (!entry) return false;
      if (entry.authorId && userIdsToSkip.has(entry.authorId)) return false;
      return true;
    };
  }

  async getEntries({
    challenge,
    paginationInput,
    entryType,
    currentUser,
    targetEntryId,
    userToSearchForId,
    timezoneOffset,
  }: ChallengeEntriesPaginationInput): Promise<
    GetChallengeEntriesResult | undefined
  > {
    let paginatedEntriesResponse: PaginateEntriesResponse;
    let hiddenPosts: Set<string> = new Set();
    switch (entryType) {
      case ChallengeEntryType.ALL:
        paginatedEntriesResponse = await this.getAllEntriesPaginated({
          challenge,
          paginationInput,
          currentUser: currentUser,
        });
        break;
      case ChallengeEntryType.FEATURED:
        paginatedEntriesResponse = await this.getFeaturedEntriesPaginated({
          challenge,
          paginationInput,
          currentUser: currentUser,
        });
        break;
      case ChallengeEntryType.TODAY:
        const getTodaysEntriesPaginated = await this.getTodaysEntriesPaginated({
          challenge,
          paginationInput,
          currentUser: currentUser,
          timezoneOffset,
        });
        paginatedEntriesResponse =
          getTodaysEntriesPaginated.paginateEntriesResponse;
        hiddenPosts = getTodaysEntriesPaginated.hiddenPosts;
        break;
      case ChallengeEntryType.USER:
        paginatedEntriesResponse = await this.getUserEntriesPaginated({
          challenge,
          paginationInput,
          currentUser,
          userToSearchForId,
        });
        break;
    }
    let hasFoundTarget = false;
    const postIdToPinnedMap: Map<string, boolean> = new Map();
    for (const entry of paginatedEntriesResponse.ids) {
      const participantEntry = fromChallengeParticipantPostEntryStr(entry);
      if (!participantEntry) continue;
      hasFoundTarget = participantEntry.postId === targetEntryId;
      postIdToPinnedMap.set(
        participantEntry.postId,
        participantEntry.hasPinned
      );
    }
    const posts = await this.postService.findAllNonExpired([
      ...postIdToPinnedMap.keys(),
    ]);
    const entries: ChallengeEntry[] = [];
    for (const post of posts) {
      post.parentChallenge = challenge;
      entries.push({
        post,
        isPinned: postIdToPinnedMap.get(post.id) ?? false,
        isHidden: hiddenPosts.has(post.id),
      });
    }
    const targetEntryError = !hasFoundTarget ? undefined : 'Post not found';
    return {
      entries,
      targetEntryError,
      ...paginatedEntriesResponse,
      count: entries.length,
      totalCount: paginatedEntriesResponse.totalCount,
    };
  }

  private async getAllEntriesPaginated({
    challenge,
    paginationInput,
    currentUser,
  }: {
    challenge: ChallengeEntity;
    paginationInput: PaginationInput;
    currentUser?: UserEntity;
  }): Promise<PaginateEntriesResponse> {
    const userIdsToSkip = await this.getBlockedOrBlockedByUserIds(currentUser);
    const predicate: FilterPaginateEntriesPredicate = this.getEntriesPredicate({
      userIdsToSkip,
    });
    return this.feedService.paginateEntries(
      getChallengeAllPostsFeedId(challenge.id),
      paginationInput,
      predicate
    );
  }

  private async getFeaturedEntriesPaginated({
    challenge,
    paginationInput,
    currentUser,
  }: {
    challenge: ChallengeEntity;
    paginationInput: PaginationInput;
    currentUser?: UserEntity;
  }): Promise<PaginateEntriesResponse> {
    const userIdsToSkip = await this.getBlockedOrBlockedByUserIds(currentUser);
    const predicate: FilterPaginateEntriesPredicate = this.getEntriesPredicate({
      userIdsToSkip,
    });
    return this.feedService.paginateEntries(
      getChallengeFeaturedPostsFeedId(challenge.id),
      paginationInput,
      predicate
    );
  }

  private async getUserEntriesPaginated({
    challenge,
    paginationInput,
    currentUser,
    userToSearchForId,
  }: {
    challenge: ChallengeEntity;
    paginationInput: PaginationInput;
    currentUser?: UserEntity;
    userToSearchForId?: string;
  }): Promise<PaginateEntriesResponse> {
    if (!currentUser && !userToSearchForId) {
      this.logger.error('[getUserEntriesPaginated] User not provided');
      return getEmptyPaginateEntriesResponse();
    }
    if (
      userToSearchForId &&
      currentUser &&
      userToSearchForId !== currentUser.id
    ) {
      const blockedUsers = await this.getBlockedUserIds(userToSearchForId);
      if (blockedUsers.has(currentUser.id)) {
        this.logger.warn(
          '[getUserEntriesPaginated] User is blocked by the user to search',
          {
            userToSearchId: userToSearchForId,
            currentUserId: currentUser.id,
          }
        );
        return getEmptyPaginateEntriesResponse();
      }
    }
    const allPages = await this.feedService.findAllPagesById(
      getUserPostEntriesOnChallengeFeedId(
        challenge.id,
        userToSearchForId ?? currentUser?.id ?? ''
      )
    );
    const allEntries = allPages.flatMap(page => page.ids);
    if (paginationInput.order === PaginationOrder.OLDEST_FIRST) {
      allEntries.reverse();
      paginationInput.order = PaginationOrder.DEFAULT;
    }
    const feedPageAndInfo = this.feedService.getPageOfIdsFromFeedIds({
      allFeedIds: allEntries,
      paginationInput,
    });
    return {
      pageNumber: 1,
      ...feedPageAndInfo,
    };
  }

  async getTodaysEntriesPaginated({
    challenge,
    paginationInput,
    currentUser,
    timezoneOffset,
  }: {
    challenge: ChallengeEntity;
    paginationInput: PaginationInput;
    currentUser?: UserEntity;
    timezoneOffset?: string;
  }): Promise<{
    paginateEntriesResponse: PaginateEntriesResponse;
    hiddenPosts: Set<string>;
  }> {
    const [userIdsToSkip, allPages] = await Promise.all([
      this.getBlockedOrBlockedByUserIds(currentUser),
      this.feedService.findAllPagesById(
        getChallengeAllPostsFeedId(challenge.id)
      ),
    ]);
    userIdsToSkip.add(challenge.authorId);
    const allEntries = allPages.flatMap(page => page.ids);
    const authorsEntryStrings: string[] = [];
    const authorsEntries: ChallengeParticipantPostEntry[] = [];
    let userHasEntryToday = false;
    const timezoneOffsetMs = getTimezoneOffset(
      timezoneOffset || 'America/Los_Angeles'
    );
    const currentDateFormatted = format(
      new Date(Date.now() + timezoneOffsetMs),
      DATE_FORMAT
    );
    if (challenge.authorId === currentUser?.id) {
      userHasEntryToday = true;
    }
    const filteredEntries = allEntries.filter((entryStr: string) => {
      const entry = fromChallengeParticipantPostEntryStr(entryStr);
      if (!entry) {
        return false;
      }
      const entryDateFormatted = format(
        new Date(+entry.date + timezoneOffsetMs),
        DATE_FORMAT
      );
      if (
        entry.authorId &&
        entry.authorId === challenge.authorId &&
        entryDateFormatted === currentDateFormatted
      ) {
        authorsEntryStrings.push(entryStr);
        authorsEntries.push(entry);
        return false;
      }
      if (entry.authorId && userIdsToSkip.has(entry.authorId)) {
        return false;
      } else if (entryDateFormatted === currentDateFormatted) {
        if (entry.authorId === currentUser?.id) {
          userHasEntryToday = true;
        }
        return true;
      }
      return false;
    });
    const allFeedIds = filteredEntries.concat(authorsEntryStrings);
    const feedPageAndInfo = this.feedService.getPageOfIdsFromFeedIds({
      allFeedIds,
      paginationInput,
    });
    const hiddenPosts = new Set<string>();
    if (!userHasEntryToday) {
      for (const entry of authorsEntries) {
        hiddenPosts.add(entry.postId);
      }
    }
    return {
      hiddenPosts,
      paginateEntriesResponse: {
        pageNumber: 1,
        ...feedPageAndInfo,
      },
    };
  }
}
