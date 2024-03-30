import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { PaginationInput } from '@verdzie/server/generated-graphql';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  ChallengeParticipant,
  ChallengeParticipantMeta,
  getChallengeParticipantsFeedId,
  ChallengeParticipantsInfoMap,
  getCurrentUserBlockedByFeedId,
  getCurrentUserBlockedFeedId,
  FindChallengeParticipantsResult,
  getUserPostEntriesOnChallengeFeedId,
  toChallengeParticipantIdString,
  fromChallengeParticipantIdString,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { FeedService, FeedsMap } from '@verdzie/server/feed/feed.service';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import {
  FilterPaginateEntriesPredicate,
  PaginateEntriesResponse,
} from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import {
  DEFAULT_PAGINATION_COUNT,
  preserveOrderByIds,
} from '@verdzie/server/data/common';
import { UserService } from '@verdzie/server/user/user.service';
import { PaginationOrder } from '@verdzie/server/generated-graphql';
import { isPaginationInputRefreshing } from '@verdzie/server/common';
import { PostRepository } from '@verdzie/server/post/post-repository/post.repository';
import { last } from 'lodash';

@Injectable()
export class ChallengeParticipantsService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly feedService: FeedService,
    private readonly userService: UserService,
    private readonly postRepository: PostRepository
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async findParticipants({
    challenge,
    paginationInput,
    currentUser,
    isRequestingFriendParticipants,
  }: {
    challenge: ChallengeEntity;
    paginationInput: PaginationInput;
    currentUser?: UserEntity;
    isRequestingFriendParticipants?: boolean;
  }): Promise<FindChallengeParticipantsResult> {
    const feeds = await this.getRelevantFeeds(challenge, currentUser);
    paginationInput.order ??= PaginationOrder.LATEST_FIRST;
    if (!feeds) {
      this.logger.warn('The challenge has no participants', {
        challengeId: challenge.id,
        fxtName: 'findParticipants',
      });
      return {
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
    const { friendsUserIds, userIdsToSkip } =
      await this.getRelevantUserIdsLists(feeds, currentUser);
    // NOTE: Missing provision for includingAndAfter and includingAndBefore
    // shouldAddCreator is true when hasNextPage = false in `before` or
    // `includingAndBefore`
    userIdsToSkip.push(challenge.authorId);
    isRequestingFriendParticipants ??=
      isPaginationInputRefreshing(paginationInput);
    const [
      { userEntriesWithMeta, response },
      challengeAuthorChallengeEntriesFeed,
    ] = await Promise.all([
      this.prepareUserEntriesWithMeta({
        challenge,
        friendsUserIds,
        userIdsToSkip,
        isRequestingFriendParticipants,
        paginationInput,
      }),
      this.feedService.find(
        getUserPostEntriesOnChallengeFeedId(challenge.id, challenge.authorId)
      ),
    ]);
    const shouldAddCreator =
      paginationInput.after === undefined ||
      (paginationInput.after && !response.hasPreviousItems) ||
      (paginationInput.before && !response.hasMoreItems);
    if (shouldAddCreator) {
      if (!challengeAuthorChallengeEntriesFeed) {
        userEntriesWithMeta.unshift(
          toChallengeParticipantIdString({
            id: challenge.authorId,
            postId: undefined,
            entryCount: 0,
          })
        );
      } else {
        const authorsMostRecentEntryString = last(
          challengeAuthorChallengeEntriesFeed.ids
        );
        if (authorsMostRecentEntryString) {
          const authorsMostRecentEntry = fromChallengeParticipantIdString(
            authorsMostRecentEntryString
          );
          if (authorsMostRecentEntry) {
            userEntriesWithMeta.unshift(
              toChallengeParticipantIdString({
                id: challenge.authorId,
                postId: authorsMostRecentEntry.postId,
                entryCount: challengeAuthorChallengeEntriesFeed.count,
              })
            );
          }
        } else {
          userEntriesWithMeta.unshift(
            toChallengeParticipantIdString({
              id: challenge.authorId,
              postId: undefined,
              entryCount: challengeAuthorChallengeEntriesFeed.count,
            })
          );
        }
      }
    }
    const participantsInfoMap: ChallengeParticipantsInfoMap =
      await this.prepareParticipantsInfoMap(
        userEntriesWithMeta,
        friendsUserIds
      );
    return {
      hasNextPage: response.hasMoreItems,
      hasPreviousPage: response.hasPreviousItems,
      participantsInfoMap,
    };
  }

  private async getRelevantFeeds(
    challenge: ChallengeEntity,
    currentUser?: UserEntity
  ): Promise<undefined | FeedsMap> {
    const feedIdsToGet: string[] = [];
    feedIdsToGet.push(getChallengeParticipantsFeedId(challenge.id));
    if (currentUser) {
      if (currentUser.followingFeedId)
        feedIdsToGet.push(currentUser.followingFeedId);
      feedIdsToGet.push(getCurrentUserBlockedFeedId(currentUser));
      feedIdsToGet.push(getCurrentUserBlockedByFeedId(currentUser));
    }
    const feedsMap = await this.feedService.findByIdsWithMap(feedIdsToGet);
    if (!feedsMap.get(getChallengeParticipantsFeedId(challenge.id))) {
      //This is a mandatory feed
      this.logger.info('challengeParticipantsFeed not found', {
        challengeId: challenge.id,
      });
      return;
    }
    return feedsMap;
  }

  private async getRelevantUserIdsLists(
    feedsMap: FeedsMap,
    currentUser?: UserEntity
  ): Promise<{ friendsUserIds?: string[]; userIdsToSkip: string[] }> {
    if (!currentUser) {
      return {
        friendsUserIds: undefined,
        userIdsToSkip: [],
      };
    }
    const currentUserFollowingFeed: FeedEntity | undefined = feedsMap.get(
      currentUser.followingFeedId ?? ''
    );
    const friendsUserIds = currentUserFollowingFeed?.ids;
    const userIdsToSkip =
      await this.userService.userIdsOfBlockedUsersOnEitherSide(
        currentUser,
        feedsMap.get(getCurrentUserBlockedFeedId(currentUser)),
        feedsMap.get(getCurrentUserBlockedByFeedId(currentUser))
      );
    return { friendsUserIds, userIdsToSkip };
  }

  private getPredicate({
    userIdsToSkip,
    friendsUserIds,
    isRequestingFriendParticipants,
  }: {
    isRequestingFriendParticipants?: boolean;
    userIdsToSkip?: string[];
    friendsUserIds?: string[];
  }): FilterPaginateEntriesPredicate {
    return (entry: string) => {
      try {
        const participantEntry: ChallengeParticipant = JSON.parse(entry);
        const userId = participantEntry.id;
        if (userIdsToSkip && userIdsToSkip.includes(userId)) return false;
        if (friendsUserIds) {
          if (isRequestingFriendParticipants) {
            return friendsUserIds.includes(userId);
          } else {
            return !friendsUserIds.includes(userId);
          }
        }
        return true;
      } catch (error) {
        this.logger.error('Failed to parse json entry', { entry, error });
        return false;
      }
    };
  }

  private async prepareUserEntriesWithMeta({
    userIdsToSkip,
    friendsUserIds,
    isRequestingFriendParticipants,
    challenge,
    paginationInput,
  }: {
    challenge: ChallengeEntity;
    isRequestingFriendParticipants?: boolean;
    userIdsToSkip?: string[];
    friendsUserIds?: string[];
    paginationInput: PaginationInput;
  }): Promise<{
    userEntriesWithMeta: string[];
    response: PaginateEntriesResponse;
  }> {
    const userEntriesWithMeta: string[] = [];
    let predicate: FilterPaginateEntriesPredicate = this.getPredicate({
      friendsUserIds,
      userIdsToSkip,
      isRequestingFriendParticipants,
    });
    let response: PaginateEntriesResponse =
      await this.feedService.paginateEntries(
        getChallengeParticipantsFeedId(challenge.id),
        paginationInput,
        predicate
      );
    userEntriesWithMeta.push(...response.ids);
    if (isRequestingFriendParticipants) {
      if (
        response.ids.length < (paginationInput.take ?? DEFAULT_PAGINATION_COUNT)
      ) {
        //it seems like we ran out of user's friends,
        //let's request the remaining participants.
        this.logger.info("Ran out of the user's friends", {
          responseLength: response.ids.length,
          take: paginationInput.take,
        });
        isRequestingFriendParticipants = false;
        predicate = this.getPredicate({
          friendsUserIds,
          userIdsToSkip,
          isRequestingFriendParticipants,
        });
        paginationInput.after = undefined;
        response = await this.feedService.paginateEntries(
          getChallengeParticipantsFeedId(challenge.id),
          paginationInput,
          predicate
        );
        userEntriesWithMeta.push(...response.ids);
      }
    }
    return { userEntriesWithMeta, response };
  }

  private async prepareParticipantsInfoMap(
    userEntriesWithMeta: string[],
    friendsUserIds?: string[]
  ) {
    const participantsInfoMap: ChallengeParticipantsInfoMap = new Map();
    const userIds: string[] = [];
    const postIds: string[] = [];
    for (const entry of userEntriesWithMeta) {
      try {
        const participantEntry: ChallengeParticipant = JSON.parse(entry);
        const userId = participantEntry.id;
        userIds.push(userId);
        const postId = participantEntry.postId;
        if (postId) postIds.push(postId);
        const entryCount = participantEntry.entryCount;
        participantsInfoMap.set(userId, { postId, entryCount });
      } catch (error) {
        this.logger.error('Failed to parse json entry', { entry, error });
      }
    }
    const users = preserveOrderByIds(
      userIds,
      await this.userService.findAllById(userIds)
    );
    const posts = await this.postRepository.findByIds(postIds);
    for (const user of users) {
      const info: ChallengeParticipantMeta | undefined =
        participantsInfoMap.get(user.id);
      if (!info) continue;
      participantsInfoMap.set(user.id, {
        entryCount: info.entryCount,
        postId: info.postId,
        userEntity: user,
        postEntity: posts.find(post => post?.id === info.postId),
        isFriend: friendsUserIds?.includes(user.id),
      });
    }
    return participantsInfoMap;
  }
}
