import { Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ChallengeRepository } from '@verdzie/server/challenge/challenge-repository/challenge.repository';
import { insertToSortedArray } from '@verdzie/server/common/insert-to-sorted-array';
import { EntitiesWithPagesCommon } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import { PaginationInput } from '@verdzie/server/generated-graphql';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import _ from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Connection } from 'typeorm';
import { Logger } from 'winston';
import { PostRepository } from '@verdzie/server/post/post-repository/post.repository';
import {
  getChallengeLeaderboardFeedId,
  getUserPostEntriesOnChallengeFeedId,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import {
  fromChallengeLeaderboardEdge,
  toChallengeLeaderboardEdge,
} from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.common';

export type ChallengeLeaderboardId = string;

export interface ChallengeLeaderboardEntry {
  participantId: string;
  entryCount: number;
  latestEntryId: string;
}

export enum ChallengeLeaderboardOperation {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export class ChallengeLeaderboardService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly userService: UserService,
    private readonly entitiesWithPagesCommon: EntitiesWithPagesCommon,
    private readonly challengeRepository: ChallengeRepository,
    private readonly postRepository: PostRepository
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  async updateChallengeLeaderboard({
    challengeIdOrChallenge,
    participantId,
    latestEntryId,
    entryCount,
  }: {
    challengeIdOrChallenge: string | ChallengeEntity;
    participantId: string;
    latestEntryId: string;
    entryCount?: number;
  }): Promise<{
    operationPerformed?: ChallengeLeaderboardOperation;
    error?: string;
  }> {
    const challenge =
      typeof challengeIdOrChallenge === 'string'
        ? await this.challengeRepository.findOne({
            id: challengeIdOrChallenge,
          })
        : challengeIdOrChallenge;
    if (!challenge) return { error: 'challenge not found' };
    if (challenge.authorId === participantId) {
      this.logger.info('[updateChallengeLeaderboard] updating owner', {
        challengeId: challenge.id,
        participantId,
      });
      return this.upsertChallengeOwnerToLeaderboard({
        challengeId: challenge.id,
        participantId,
        latestEntryId,
        entryCount,
      });
    }
    this.logger.info('[updateChallengeLeaderboard] updating participant', {
      challengeId: challenge.id,
      participantId,
    });
    return this.upsertChallengeParticipantToLeaderboard({
      challenge,
      participantId,
      latestEntryId,
      entryCount,
    });
  }

  async paginateLeaderboardParticipants({
    challenge,
    paginationInput,
    currentUser,
  }: {
    challenge: ChallengeEntity;
    paginationInput: PaginationInput;
    currentUser?: UserEntity;
  }): Promise<{
    rawEdges: {
      user: UserEntity;
      post: PostEntity;
      entryCount: number;
      isCreator: boolean;
      cursor: string;
    }[];
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    let userIdsToSkip: string[] = [];
    if (currentUser) {
      userIdsToSkip = await this.userService.userIdsOfBlockedUsersOnEitherSide(
        currentUser
      );
    }
    const userIdsToSkipSet = new Set(userIdsToSkip);
    const result = await this.entitiesWithPagesCommon.paginateEntries({
      entityId: getChallengeLeaderboardFeedId(challenge.id),
      // @ts-ignore
      repo: this.connection.getRepository(FeedEntity),
      paginationInput,
      predicate: (edge: ChallengeLeaderboardId) => {
        const entry = fromChallengeLeaderboardEdge(edge);
        return !userIdsToSkipSet.has(entry.participantId);
      },
    });
    if (!result) {
      this.logger.warn('paginateLeaderboardParticipants: result is null', {
        challengeId: challenge.id,
      });
      return { rawEdges: [], hasNextPage: false, hasPreviousPage: false };
    }
    const postIds = [];
    const userIds = [];
    const entries = result.ids.map(fromChallengeLeaderboardEdge);
    for (const entry of entries) {
      postIds.push(entry.latestEntryId);
      userIds.push(entry.participantId);
    }
    const [posts, users] = await Promise.all([
      this.postRepository.findByIds(postIds),
      this.userService.findAllById(userIds),
    ]);
    const postsById = _.keyBy(posts, 'id');
    const usersById = _.keyBy(users, 'id');
    const participants = [];
    for (const entry of entries) {
      const post = postsById[entry.latestEntryId];
      const user = usersById[entry.participantId];
      if (post && user) {
        participants.push({
          post,
          user,
          entryCount: entry.entryCount,
          isCreator: challenge.authorId === user.id,
          cursor: toChallengeLeaderboardEdge({
            participantId: user.id,
            entryCount: entry.entryCount,
            latestEntryId: post.id,
          }),
        });
      }
    }
    return {
      rawEdges: participants,
      hasNextPage: result?.hasMoreItems ?? false,
      hasPreviousPage: result?.hasPreviousItems ?? false,
    };
  }

  private async upsertChallengeOwnerToLeaderboard({
    challengeId,
    participantId,
    latestEntryId,
    entryCount,
  }: {
    challengeId: string;
    participantId: string;
    latestEntryId: string;
    entryCount?: number;
  }): Promise<{
    operationPerformed?: ChallengeLeaderboardOperation;
    error?: string;
  }> {
    const leaderboardFeedId = getChallengeLeaderboardFeedId(challengeId);
    return this.connection.manager.transaction(async manager => {
      const feedRepo = manager.getRepository(FeedEntity);
      const [leaderboardFeed, ownerEntriesFeed] = await Promise.all([
        feedRepo.findOne(leaderboardFeedId, {
          lock: { mode: 'pessimistic_write' },
        }),
        entryCount === undefined &&
          feedRepo.findOne(
            getUserPostEntriesOnChallengeFeedId(challengeId, participantId)
          ),
      ]);
      if (ownerEntriesFeed instanceof FeedEntity) {
        entryCount ??= ownerEntriesFeed.count;
      }
      if (entryCount === undefined) {
        return {
          error: 'challenge owner entries feed not found',
        };
      }
      if (!leaderboardFeed) {
        const newFeed = new FeedEntity();
        newFeed.id = leaderboardFeedId;
        newFeed.page.ids = [
          toChallengeLeaderboardEdge({
            participantId,
            entryCount,
            latestEntryId,
          }),
        ];
        newFeed.count = newFeed.page.ids.length;
        await feedRepo.insert(newFeed);
        return {
          operationPerformed: ChallengeLeaderboardOperation.INSERT,
        };
      }
      if (!leaderboardFeed.page.ids.length) {
        leaderboardFeed.page.ids.push(
          toChallengeLeaderboardEdge({
            participantId,
            entryCount,
            latestEntryId,
          })
        );
        leaderboardFeed.count = leaderboardFeed.page.ids.length;
        await feedRepo.update(leaderboardFeedId, leaderboardFeed);
        return {
          operationPerformed: ChallengeLeaderboardOperation.INSERT,
        };
      }
      const firstPosition = fromChallengeLeaderboardEdge(
        leaderboardFeed.page.ids[leaderboardFeed.page.ids.length - 1]
      );
      if (firstPosition.participantId === participantId) {
        let operationPerformed: ChallengeLeaderboardOperation =
          ChallengeLeaderboardOperation.DELETE;
        leaderboardFeed.page.ids.pop();
        if (entryCount > 0) {
          operationPerformed = ChallengeLeaderboardOperation.UPDATE;
          leaderboardFeed.page.ids.push(
            toChallengeLeaderboardEdge({
              participantId,
              entryCount,
              latestEntryId,
            })
          );
        }
        leaderboardFeed.count = leaderboardFeed.page.ids.length;
        await feedRepo.update(leaderboardFeedId, leaderboardFeed);
        return {
          operationPerformed,
        };
      }
      if (entryCount > 0) {
        leaderboardFeed.page.ids.push(
          toChallengeLeaderboardEdge({
            participantId,
            entryCount,
            latestEntryId,
          })
        );
        leaderboardFeed.count = leaderboardFeed.page.ids.length;
        await feedRepo.update(leaderboardFeedId, leaderboardFeed);
        return {
          operationPerformed: ChallengeLeaderboardOperation.INSERT,
        };
      } else {
        return {
          error: 'entry count is 0, insert not performed',
        };
      }
    });
  }

  private async upsertChallengeParticipantToLeaderboard({
    challenge,
    participantId,
    latestEntryId,
    entryCount,
  }: {
    challenge: ChallengeEntity;
    participantId: string;
    latestEntryId: string;
    entryCount?: number;
  }): Promise<{
    operationPerformed?: ChallengeLeaderboardOperation;
    error?: string;
  }> {
    const leaderboardFeedId = getChallengeLeaderboardFeedId(challenge.id);
    return await this.connection.manager.transaction(async manager => {
      const feedRepo = manager.getRepository(FeedEntity);
      const [leaderboardFeed, participantEntriesFeed] = await Promise.all([
        feedRepo.findOne(leaderboardFeedId, {
          lock: { mode: 'pessimistic_write' },
        }),
        entryCount === undefined &&
          feedRepo.findOne(
            getUserPostEntriesOnChallengeFeedId(challenge.id, participantId)
          ),
      ]);
      if (participantEntriesFeed instanceof FeedEntity) {
        entryCount ??= participantEntriesFeed.count;
      }
      if (entryCount === undefined) {
        return {
          error: 'challenge participant entries feed not found',
        };
      }
      if (!leaderboardFeed) {
        const newFeed = new FeedEntity();
        newFeed.id = leaderboardFeedId;
        newFeed.page.ids = [
          toChallengeLeaderboardEdge({
            participantId,
            entryCount,
            latestEntryId,
          }),
        ];
        newFeed.count = 1;
        await feedRepo.insert(newFeed);
        return {
          operationPerformed: ChallengeLeaderboardOperation.INSERT,
        };
      }
      const previousLength = leaderboardFeed.page.ids.length;
      _.remove(leaderboardFeed.page.ids, edge => {
        return edge.includes(`"participantId":"${participantId}"`);
      });
      if (entryCount > 0) {
        let author: string | undefined;
        if (
          leaderboardFeed.page.ids.length &&
          leaderboardFeed.page.ids[
            leaderboardFeed.page.ids.length - 1
          ].includes(`"participantId":"${challenge.authorId}"`)
        ) {
          author = leaderboardFeed.page.ids.pop();
        }
        insertToSortedArray({
          array: leaderboardFeed.page.ids,
          element: toChallengeLeaderboardEdge({
            participantId,
            entryCount,
            latestEntryId,
          }),
          getValue: edge => fromChallengeLeaderboardEdge(edge).entryCount,
        });
        if (author) {
          leaderboardFeed.page.ids.push(author);
        }
      }
      leaderboardFeed.count = leaderboardFeed.page.ids.length;
      await feedRepo.update(leaderboardFeedId, leaderboardFeed);
      if (previousLength === leaderboardFeed.count) {
        return {
          operationPerformed: ChallengeLeaderboardOperation.UPDATE,
        };
      } else if (previousLength > leaderboardFeed.count) {
        return {
          operationPerformed: ChallengeLeaderboardOperation.DELETE,
        };
      }
      return {
        operationPerformed: ChallengeLeaderboardOperation.INSERT,
      };
    });
  }
}
