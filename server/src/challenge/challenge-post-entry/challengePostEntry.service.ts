import { Inject, Injectable } from '@nestjs/common';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ChallengeRepository } from '@verdzie/server/challenge/challenge-repository/challenge.repository';
import {
  FeedService,
  FeedsMap,
  FindEntryWithDetails,
} from '@verdzie/server/feed/feed.service';
import {
  ChallengeParticipant,
  ChallengeParticipantPostEntry,
  fromChallengeParticipantIdString,
  getChallengeAllPostsFeedId,
  getChallengeFeaturedPostsFeedId,
  getChallengeParticipantsFeedId,
  getChallengePinnedEntriesFeedId,
  getUserPostEntriesOnChallengeFeedId,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { Repository } from 'typeorm';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ChallengeUpdateStatsService } from '@verdzie/server/challenge/challenge-update-stats/challengeUpdateStats.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  PageNotFoundError,
  upsertPageNumberToId,
} from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { ChallengeEntryPinFlag } from '@verdzie/server/generated-graphql';
import { Result, err, ok } from 'neverthrow';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { last } from 'lodash';

@Injectable()
export class ChallengePostEntryService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly repo: ChallengeRepository,
    private readonly feedService: FeedService,
    private readonly updateStatsService: ChallengeUpdateStatsService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  //Should be one time process
  private async createRelevantFeedsIfNotExist(
    challengeId: string,
    postAuthorId: string
  ) {
    this.logger.info('createRelevantFeedsIfNotExist');
    const challengeAllEntriesFeedId = getChallengeAllPostsFeedId(challengeId);
    const userPostEntriesOnChallengeFeedId =
      getUserPostEntriesOnChallengeFeedId(challengeId, postAuthorId);
    const participantsFeedId = getChallengeParticipantsFeedId(challengeId);
    await Promise.all([
      this.feedService.createIfNotExists(challengeAllEntriesFeedId),
      this.feedService.createIfNotExists(userPostEntriesOnChallengeFeedId),
      this.feedService.createIfNotExists(participantsFeedId),
    ]);
  }

  private async prepareAndLockRelevantFeeds({
    challengeId,
    post,
    repo,
  }: {
    challengeId: string;
    post: PostEntity;
    repo: Repository<FeedEntity>;
  }): Promise<FeedsMap | undefined> {
    try {
      this.logger.info('prepareAndLockRelevantFeeds');
      const feedsMap: FeedsMap = new Map();
      const challengeAllEntriesFeedId = getChallengeAllPostsFeedId(challengeId);
      const challengeAllEntriesFeed = await repo.findOneOrFail(
        { id: challengeAllEntriesFeedId },
        { lock: { mode: 'pessimistic_write' } }
      );
      feedsMap.set(challengeAllEntriesFeedId, challengeAllEntriesFeed);
      const userPostEntriesOnChallengeFeedId =
        getUserPostEntriesOnChallengeFeedId(challengeId, post.authorId);
      const userPostEntriesOnChallengeFeed = await repo.findOneOrFail(
        { id: userPostEntriesOnChallengeFeedId },
        { lock: { mode: 'pessimistic_write' } }
      );
      feedsMap.set(
        userPostEntriesOnChallengeFeedId,
        userPostEntriesOnChallengeFeed
      );
      const participantsFeedId = getChallengeParticipantsFeedId(challengeId);
      const participantsFeed = await repo.findOneOrFail(
        { id: participantsFeedId },
        { lock: { mode: 'pessimistic_write' } }
      );
      feedsMap.set(participantsFeedId, participantsFeed);
      return feedsMap;
    } catch (e) {
      this.logger.error(e);
    }
  }

  private async addToChallengePostEntriesFeed({
    entryStr,
    challengeId,
    repo,
    challengeRepo,
  }: {
    challengeId: string;
    entryStr: string;
    repo: Repository<FeedEntity>;
    challengeRepo: Repository<ChallengeEntity>;
  }) {
    const addChallengePostEntriesResult =
      await this.feedService.tryAndPushEntry(
        getChallengeAllPostsFeedId(challengeId),
        entryStr,
        { repo }
      );
    if (addChallengePostEntriesResult.didAddEntry) {
      await this.updateStatsService.jsonbSetStatsInTxT({
        id: challengeId,
        repo: challengeRepo,
        statsKey: 'entryCount',
        statsValue: (addChallengePostEntriesResult.entity as FeedEntity).count,
      });
    }
    this.logger.info('Pushed entry to challenge al posts feed');
  }

  private async upsertToChallengeParticipantsFeed({
    challengeId,
    authorId,
    repo,
    userPostEntriesCount,
    postOrId,
  }: {
    challengeId: string;
    authorId: string;
    userPostEntriesCount: number;
    postOrId: PostEntity | string;
    repo: Repository<FeedEntity>;
  }) {
    const challengeParticipantsFeedId =
      getChallengeParticipantsFeedId(challengeId);
    const foundParticipantEntry: FindEntryWithDetails | undefined =
      await this.feedService.findEntryWithDetails({
        entityId: challengeParticipantsFeedId,
        entryToFind: authorId,
        opts: { repo },
      });
    const participantEntryStr = foundParticipantEntry?.entry;
    this.logger.info('ParticipantEntryStr', { participantEntryStr });
    let participantEntry: ChallengeParticipant | undefined;
    if (participantEntryStr) {
      try {
        participantEntry = JSON.parse(participantEntryStr);
      } catch (e) {
        this.logger.error(e);
      }
    }
    if (!participantEntry) {
      participantEntry = {
        id: authorId,
      };
    }
    participantEntry.postId =
      typeof postOrId === 'string' ? postOrId : postOrId.id;
    participantEntry.entryCount = userPostEntriesCount;
    const updatedParticipantEntryStr = JSON.stringify(participantEntry);
    this.logger.info('updatedParticipantEntryStr', {
      updatedParticipantEntryStr,
    });
    if (foundParticipantEntry) {
      await this.feedService.replaceEntry({
        entityId: challengeParticipantsFeedId,
        entryToReplace: updatedParticipantEntryStr,
        entryIndex: foundParticipantEntry.index,
        pageNumber: foundParticipantEntry.pageNumber,
        repo,
      });
    } else {
      await this.feedService.tryAndPushEntry(
        challengeParticipantsFeedId,
        updatedParticipantEntryStr,
        { repo }
      );
    }
  }

  async updateUserParticipantEntry({
    challengeId,
    participantId,
  }: {
    challengeId: string;
    participantId: string;
  }): Promise<Result<undefined, InternalServerErrorException>> {
    try {
      this.logger.info('[updateUserParticipantEntry]', {
        challengeId,
        participantId,
      });
      await this.repo.repo.manager.transaction(async manager => {
        const feedRepo = manager.getRepository(FeedEntity);
        const userEntriesOnChallenge = await this.feedService
          .getAllEntriesFromEveryPage({
            feedId: getUserPostEntriesOnChallengeFeedId(
              challengeId,
              participantId
            ),
            repo: feedRepo,
          })
          .catch(e => {
            if (e instanceof PageNotFoundError) {
              this.logger.warn(
                '[updateUserParticipantEntry] user has no entries feed',
                {
                  challengeId,
                  participantId,
                }
              );
              return { stitchedIdsList: [] };
            }
            throw e;
          });
        let postId = '';
        const mostRecentEntry = last(userEntriesOnChallenge.stitchedIdsList);
        if (mostRecentEntry) {
          const parsedEntry = fromChallengeParticipantIdString(mostRecentEntry);
          postId = parsedEntry?.postId || '';
        } else {
          this.logger.info(
            '[updateUserParticipantEntry] users entry feed is empty',
            {
              challengeId,
              participantId,
            }
          );
        }
        await this.upsertToChallengeParticipantsFeed({
          challengeId,
          authorId: participantId,
          repo: feedRepo,
          userPostEntriesCount: userEntriesOnChallenge.stitchedIdsList.length,
          postOrId: postId,
        });
      });
      this.logger.info('[updateUserParticipantEntry] updated user entry', {
        challengeId,
        participantId,
      });
      return ok(undefined);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          'Error updating user entry ' + error,
          {
            challengeId,
            participantId,
            methodName: 'updateUserParticipantEntry',
          },
          error
        )
      );
    }
  }

  private async pushToUserPostEntriesOnChallengeFeed({
    challengeId,
    authorId,
    repo,
    entryStr,
  }: {
    challengeId: string;
    authorId: string;
    entryStr: string;
    repo: Repository<FeedEntity>;
  }) {
    const userEntriesResponse = await this.feedService.tryAndPushEntry(
      getUserPostEntriesOnChallengeFeedId(challengeId, authorId),
      entryStr,
      { repo }
    );
    this.logger.info('Pushed entry UserPostEntries on challenge');
    const entity = userEntriesResponse.entity as FeedEntity;
    return entity.count;
  }

  async addEntry({
    post,
    challengeId,
  }: {
    challengeId: string;
    post: PostEntity;
  }): Promise<{
    didAddEntry: boolean;
    entryCount: number;
  }> {
    this.logger.info('AddEntry()');
    const authorId = post.authorId;
    const entry: ChallengeParticipantPostEntry = {
      postId: post.id,
      authorId,
      date: new Date(),
      hasPinned: false,
    };
    const entryStr = JSON.stringify(entry);
    this.logger.info('[addEntry] entryStr: ', { entryStr });
    await this.createRelevantFeedsIfNotExist(challengeId, post.authorId);
    return await this.repo.repo.manager.transaction(
      'READ COMMITTED',
      async manager => {
        const repo = manager.getRepository(FeedEntity);
        const didPrepareAndLockRelevantFeeds =
          await this.prepareAndLockRelevantFeeds({
            challengeId,
            post,
            repo,
          });
        if (!didPrepareAndLockRelevantFeeds) {
          return { didAddEntry: false, entryCount: 0 };
        }
        const [_, userPostEntriesCount] = await Promise.all([
          this.addToChallengePostEntriesFeed({
            challengeId,
            repo,
            challengeRepo: manager.getRepository(ChallengeEntity),
            entryStr,
          }),
          this.pushToUserPostEntriesOnChallengeFeed({
            challengeId,
            authorId,
            repo,
            entryStr,
          }),
        ]);
        await this.upsertToChallengeParticipantsFeed({
          challengeId,
          postOrId: post,
          authorId,
          repo,
          userPostEntriesCount,
        });
        return { didAddEntry: true, entryCount: userPostEntriesCount };
      }
    );
  }

  private async findPinnedEntryAndLockFeed({
    entityId,
    entryToFind,
    repo,
  }: {
    entityId: string;
    entryToFind: string;
    repo: Repository<FeedEntity>;
  }): Promise<
    | { entityId: string; foundEntry: FindEntryWithDetails; feed: FeedEntity }
    | undefined
  > {
    const foundEntry: FindEntryWithDetails | undefined =
      await this.feedService.findEntryWithDetails({
        entityId,
        entryToFind,
        opts: { repo },
      });
    if (!foundEntry) {
      this.logger.error('entry not found', {
        entityId,
        entryToFind,
      });
      return;
    }
    //Lock the specific page
    if (foundEntry.pageNumber) {
      entityId = upsertPageNumberToId(entityId, foundEntry.pageNumber);
    }
    this.logger.info('entityId', {
      entityId,
    });
    const feed = await repo.findOne(entityId, {
      lock: { mode: 'pessimistic_write' },
    });
    if (!feed) {
      this.logger.error('feed not found', {
        entityId,
      });
      return;
    }
    return { entityId, foundEntry, feed };
  }

  private async pinEntryPrepareAndLockRelevantFeeds({
    challengeId,
    post,
    repo,
  }: {
    challengeId: string;
    post: PostEntity;
    repo: Repository<FeedEntity>;
  }): Promise<
    | {
        feedsMap: FeedsMap;
        allEntriesFoundEntry: FindEntryWithDetails;
        userPostEntriesFoundEntry: FindEntryWithDetails;
      }
    | undefined
  > {
    try {
      this.logger.info('prepareAndLockRelevantFeeds');
      const feedsMap: FeedsMap = new Map();
      //Find Existing entry in Challenge entries feed
      const challengesAllEntriesFeedId =
        getChallengeAllPostsFeedId(challengeId);
      const entryToPinInAllEntriesFeed = await this.findPinnedEntryAndLockFeed({
        entityId: challengesAllEntriesFeedId,
        entryToFind: post.id,
        repo,
      });
      if (!entryToPinInAllEntriesFeed) {
        this.logger.error('the entry does not exist in AllEntriesFeed');
        return;
      }
      feedsMap.set(
        entryToPinInAllEntriesFeed.entityId,
        entryToPinInAllEntriesFeed.feed
      );
      const allEntriesFoundEntry = entryToPinInAllEntriesFeed.foundEntry;
      //Update entry in post author's Entries Feed
      const userPostEntriesOnChallengeFeedId =
        getUserPostEntriesOnChallengeFeedId(challengeId, post.authorId);
      const entryToPinInUserEntriesFeed = await this.findPinnedEntryAndLockFeed(
        {
          entityId: userPostEntriesOnChallengeFeedId,
          entryToFind: post.id,
          repo,
        }
      );
      if (!entryToPinInUserEntriesFeed) {
        this.logger.error('the entry does not exist in UserEntriesFeed');
        return;
      }
      feedsMap.set(
        entryToPinInUserEntriesFeed.entityId,
        entryToPinInUserEntriesFeed.feed
      );
      const userPostEntriesFoundEntry = entryToPinInUserEntriesFeed.foundEntry;
      feedsMap.set(
        entryToPinInUserEntriesFeed.entityId,
        entryToPinInUserEntriesFeed.feed
      );
      //Pinned Entries feed
      const pinnedEntriesFeedId = getChallengePinnedEntriesFeedId(challengeId);
      const pinnedEntriesFeed = await this.feedService.findOrCreateWithId(
        pinnedEntriesFeedId,
        {
          repo,
          findOneOptions: { lock: { mode: 'pessimistic_write' } },
        }
      );
      feedsMap.set(pinnedEntriesFeedId, pinnedEntriesFeed);
      // Featured entries feed
      const featuredEntriesFeedId =
        getChallengeFeaturedPostsFeedId(challengeId);
      const featuredEntriesFeed = await this.feedService.findOrCreateWithId(
        featuredEntriesFeedId,
        {
          repo,
          findOneOptions: { lock: { mode: 'pessimistic_write' } },
        }
      );
      feedsMap.set(featuredEntriesFeedId, featuredEntriesFeed);
      return { feedsMap, allEntriesFoundEntry, userPostEntriesFoundEntry };
    } catch (e) {
      this.logger.error(e);
    }
  }

  async pinUnpinEntry({
    post,
    challenge,
    currentUser,
    pinUnpinFlag,
  }: {
    post: PostEntity;
    challenge: ChallengeEntity;
    currentUser: UserEntity;
    pinUnpinFlag: ChallengeEntryPinFlag;
  }): Promise<PinEntryResponse | undefined> {
    if (challenge.authorId !== currentUser.id) {
      return { errorMessage: 'Only the creator can pin the content' };
    }
    const challengeId = challenge.id;
    const isSuccessful = await this.repo.repo.manager.transaction(
      'READ COMMITTED',
      async manager => {
        const repo: Repository<FeedEntity> = manager.getRepository(FeedEntity);
        const result = await this.pinEntryPrepareAndLockRelevantFeeds({
          challengeId,
          post,
          repo,
        });
        if (!result) return false;
        //Update AllEntries feed
        const allEntriesFoundEntry = result.allEntriesFoundEntry;
        const allEntriesPostEntryStr = allEntriesFoundEntry.entry;
        let allEntriesPostEntry: ChallengeParticipantPostEntry | undefined;
        if (allEntriesPostEntryStr) {
          try {
            allEntriesPostEntry = JSON.parse(allEntriesPostEntryStr);
          } catch (e) {
            this.logger.error(e);
          }
        }
        if (!allEntriesPostEntry) {
          this.logger.error('Could not parse allEntriesFoundEntry', {
            allEntriesPostEntryStr,
          });
          return false;
        }
        allEntriesPostEntry.hasPinned =
          pinUnpinFlag === ChallengeEntryPinFlag.PIN;
        const allEntriesReplaceResult = await this.feedService.replaceEntry({
          entityId: getChallengeAllPostsFeedId(challengeId),
          entryToReplace: JSON.stringify(allEntriesPostEntry),
          entryIndex: allEntriesFoundEntry.index,
          pageNumber: allEntriesFoundEntry.pageNumber,
          repo,
        });
        this.logger.info('allEntriesReplaceResult', {
          didReplace: allEntriesReplaceResult?.didReplaceEntry,
        });
        const userEntriesFoundEntry = result.userPostEntriesFoundEntry;
        const userEntriesPostEntryStr = userEntriesFoundEntry.entry;
        let userEntriesPostEntry: ChallengeParticipantPostEntry | undefined;
        if (userEntriesPostEntryStr) {
          try {
            userEntriesPostEntry = JSON.parse(userEntriesPostEntryStr);
          } catch (e) {
            this.logger.error(e);
          }
        }
        if (!userEntriesPostEntry) {
          this.logger.error('Could not parse allEntriesFoundEntry', {
            userEntriesPostEntryStr,
          });
          return false;
        }
        userEntriesPostEntry.hasPinned =
          pinUnpinFlag === ChallengeEntryPinFlag.PIN;
        const userPostEntriesReplaceResult =
          await this.feedService.replaceEntry({
            entityId: getUserPostEntriesOnChallengeFeedId(
              challengeId,
              post.authorId
            ),
            entryToReplace: JSON.stringify(userEntriesPostEntry),
            entryIndex: userEntriesFoundEntry.index,
            pageNumber: userEntriesFoundEntry.pageNumber,
            repo,
          });
        this.logger.info('userPostEntriesReplaceResult', {
          didReplace: userPostEntriesReplaceResult?.didReplaceEntry,
        });
        //Add entries to pinned feed
        const entry: ChallengeParticipantPostEntry = {
          postId: post.id,
          authorId: post.authorId,
          date: new Date(),
          hasPinned: true,
        };
        const entryStr = JSON.stringify(entry);
        const pinnedEntriesFeedId =
          getChallengePinnedEntriesFeedId(challengeId);
        if (pinUnpinFlag === ChallengeEntryPinFlag.PIN) {
          await this.feedService.tryAndPushEntry(
            pinnedEntriesFeedId,
            entryStr,
            {
              repo,
            }
          );
          await this.feedService.tryAndPushEntry(
            getChallengeFeaturedPostsFeedId(challengeId),
            entryStr,
            { repo }
          );
        } else {
          await this.feedService.removeEntry(pinnedEntriesFeedId, post.id, {
            repo,
          });
          await this.feedService.removeEntry(
            getChallengeFeaturedPostsFeedId(challengeId),
            post.id,
            { repo }
          );
          this.logger.info('[pinUnpinEntry] Removed entry from pinned feed', {
            postId: post.id,
            challengeId,
            userId: currentUser.id,
          });
        }
        return true;
      }
    );
    if (!isSuccessful) return;
    return {
      errorMessage: undefined,
    };
  }

  async removeFromChallengePostEntriesFeedAndUpdateStats({
    postId,
    challengeId,
    feedRepo,
    challengeRepo,
  }: {
    postId: string;
    challengeId: string;
    feedRepo: Repository<FeedEntity>;
    challengeRepo: Repository<ChallengeEntity>;
  }): Promise<Result<void, PageNotFoundError | InternalServerErrorException>> {
    try {
      const removeChallengePostEntriesResult =
        await this.feedService.removeEntry(
          getChallengeAllPostsFeedId(challengeId),
          postId,
          { repo: feedRepo }
        );
      if (removeChallengePostEntriesResult.didRemoveEntry) {
        await this.updateStatsService.jsonbSetStatsInTxT({
          id: challengeId,
          repo: challengeRepo,
          statsKey: 'entryCount',
          statsValue: removeChallengePostEntriesResult.entity.count,
        });
      }
      this.logger.info(
        '[removeFromChallengePostEntriesFeedAndUpdateStats] removed entry',
        {
          postId,
          challengeId,
        }
      );
      return ok(undefined);
    } catch (error) {
      if (error instanceof PageNotFoundError) {
        return err(error);
      }
      return err(
        new InternalServerErrorException(
          'Could not remove entry from challenge post entries feed',
          {
            postId,
            challengeId,
            methodName: 'removeFromChallengePostEntriesFeedAndUpdateStats',
          },
          error
        )
      );
    }
  }

  async removeFromUserPostEntriesOnChallengeFeed({
    postId,
    challengeId,
    authorId,
    feedRepo,
  }: {
    postId: string;
    challengeId: string;
    authorId: string;
    feedRepo: Repository<FeedEntity>;
  }): Promise<
    Result<
      { userPostEntriesOnChallengeFeed: FeedEntity },
      PageNotFoundError | InternalServerErrorException
    >
  > {
    try {
      const result = await this.feedService.removeEntry(
        getUserPostEntriesOnChallengeFeedId(challengeId, authorId),
        postId,
        { repo: feedRepo }
      );
      this.logger.info(
        '[removeFromUserPostEntriesOnChallengeFeed] removed entry',
        {
          postId,
          challengeId,
          authorId,
        }
      );
      return ok({ userPostEntriesOnChallengeFeed: result.entity });
    } catch (error) {
      if (error instanceof PageNotFoundError) {
        return err(error);
      } else {
        return err(
          new InternalServerErrorException(
            'Error removing entry',
            {
              postId,
              challengeId,
              userId: authorId,
              methodName: 'removeFromUserPostEntriesOnChallengeFeed',
            },
            error
          )
        );
      }
    }
  }
}

export interface PinEntryResponse {
  errorMessage?: string;
}
