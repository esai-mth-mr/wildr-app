import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ChallengeSchema } from '@verdzie/server/challenge/challenge-data-objects/challenge.schema';
import {
  globalActiveChallengesFeedId,
  globalPastChallengesFeedId,
} from '@verdzie/server/challenge/challenge.service';
import { getFirstFeedPageId } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { FeedSchema } from '@verdzie/server/feed/feed.schema';
import { GlobalActiveChallengesFeedNotFoundException } from '@verdzie/server/feed/feed.service';
import { GlobalChallengeFeedEnums } from '@verdzie/server/sqs/sqs-prune-global-challenges-feed-handler/prune-global-challenges-message.dto';
import { GlobalChallengeFeedPruningProducer } from '@verdzie/server/worker/global-challenge-feed-pruning/global-challenge-feed-pruning.producer';
import { chunk } from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { In, QueryRunner, Repository } from 'typeorm';
import { Logger } from 'winston';

type ExpiredChallengeIdWithEndDate = { id: string; endDate: Date };

@Injectable()
export class GlobalChallengeFeedPruningService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly producer: GlobalChallengeFeedPruningProducer,
    @InjectRepository(FeedSchema)
    private readonly feedRepo: Repository<FeedEntity>,
    @InjectRepository(ChallengeSchema)
    private readonly challengeRepo: Repository<ChallengeEntity>
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async createPruningBatchJobs({
    globalChallengeFeedType,
  }: {
    globalChallengeFeedType: GlobalChallengeFeedEnums;
  }): Promise<
    Result<
      boolean,
      GlobalActiveChallengesFeedNotFoundException | InternalServerErrorException
    >
  > {
    const context = {
      globalChallengeFeedType,
      methodName: 'createPruningBatchJobs',
    };
    this.logger.info('creating pruning batch jobs', context);
    try {
      const globalActiveChallengesFeed = await this.feedRepo.findOne(
        getFirstFeedPageId(globalChallengeFeedType, ''),
        { select: [FeedEntity.kFields.page] }
      );
      if (!globalActiveChallengesFeed) {
        this.logger.error('global challenges feed not found', context);
        return err(new GlobalActiveChallengesFeedNotFoundException(context));
      }
      await Promise.all(
        chunk(globalActiveChallengesFeed.page.ids, 100).map(
          async (chunk, index) => {
            this.producer.createPruningBatchJob({
              // Add delay with jitter to avoid thundering herd
              delayMS: index * 100 + Math.floor(Math.random() * 50),
              job: {
                challengeIds: chunk,
                globalChallengeFeedType,
                feedPage: 1,
              },
            });
          }
        )
      );
      return ok(true);
    } catch (error) {
      this.logger.error('error creating global challenge feed pruning jobs', {
        error,
        ...context,
      });
      return err(
        new InternalServerErrorException(
          'error creating global challenge feed pruning batch jobs',
          { error, ...context }
        )
      );
    }
  }

  async pruneChallengeBatch({
    challengeIds,
    feedPage,
    globalChallengeFeedType,
  }: {
    challengeIds: string[];
    feedPage: number;
    globalChallengeFeedType: GlobalChallengeFeedEnums;
  }): Promise<
    Result<
      { removedChallengeIds: string[] },
      GlobalActiveChallengesFeedNotFoundException | InternalServerErrorException
    >
  > {
    switch (globalChallengeFeedType) {
      case FeedEntityType.GLOBAL_ACTIVE_CHALLENGES:
        return this.pruneActiveChallengesFeedInTxn({ challengeIds, feedPage });
      default:
        throw new Error('unknown global challenge feed type');
    }
  }

  private async pruneActiveChallengesFeedInTxn({
    challengeIds,
    feedPage,
  }: {
    challengeIds: string[];
    feedPage: number;
  }): Promise<
    Result<
      { removedChallengeIds: string[] },
      GlobalActiveChallengesFeedNotFoundException | InternalServerErrorException
    >
  > {
    const context = {
      methodName: 'pruneActiveChallengesFeedInTxn',
      feedPage,
      challengeIds,
    };
    let queryRunner: QueryRunner | undefined;
    try {
      const challengeIdsToRemove =
        await this.getExpiredChallengeIdsWithEndDates({
          challengeIds,
          repo: this.challengeRepo,
        });
      if (challengeIdsToRemove.isErr()) return err(challengeIdsToRemove.error);
      if (!challengeIdsToRemove.value.length) {
        this.logger.info('no active challenges to remove', context);
        return ok({ removedChallengeIds: [] });
      }
      this.logger.info('removing active challenges', {
        challengeIdsToRemove,
        ...context,
      });
      queryRunner = this.challengeRepo.manager.connection.createQueryRunner();
      await queryRunner.startTransaction();
      const moveResult = await this.moveExpiredChallengesToPastChallengesFeed({
        challengeIdsWithEndDates: challengeIdsToRemove.value,
        repo: queryRunner.manager.getRepository(FeedEntity),
      });
      if (moveResult.isErr()) {
        await queryRunner.rollbackTransaction();
        return err(moveResult.error);
      }
      await queryRunner.commitTransaction();
      this.logger.info('successfully pruned global active challenges', {
        removedChallengeIds: challengeIdsToRemove.value,
        ...context,
      });
      return ok({
        removedChallengeIds: challengeIdsToRemove.value.map(c => c.id),
      });
    } catch (error) {
      await queryRunner?.rollbackTransaction().catch(error => {
        this.logger.error('failed to rollback transaction', {
          error,
          ...context,
        });
      });
      this.logger.error('error pruning global active challenges', {
        error,
        ...context,
      });
      return err(
        new InternalServerErrorException(
          'error pruning global active challenges',
          { error, ...context }
        )
      );
    } finally {
      await queryRunner?.release().catch(error => {
        this.logger.error('failed to release query runner', {
          error,
          ...context,
        });
      });
    }
  }

  private async getExpiredChallengeIdsWithEndDates({
    challengeIds,
    repo,
  }: {
    challengeIds: string[];
    repo: Repository<ChallengeEntity>;
  }): Promise<
    Result<ExpiredChallengeIdWithEndDate[], InternalServerErrorException>
  > {
    try {
      const expiredChallenges = await repo.find({
        where: { id: In(challengeIds) },
        select: [ChallengeEntity.kFields.id, ChallengeEntity.kFields.endDate],
      });
      const expiredChallengeIds: ExpiredChallengeIdWithEndDate[] = [];
      for (const challenge of expiredChallenges) {
        if (challenge.endDate && challenge.endDate < new Date()) {
          expiredChallengeIds.push({
            id: challenge.id,
            endDate: challenge.endDate,
          });
        }
      }
      return ok(expiredChallengeIds);
    } catch (error) {
      this.logger.error('error getting expired challenge ids', {
        error,
        challengeIds,
      });
      return err(
        new InternalServerErrorException(
          'error getting expired challenge ids',
          { error, challengeIds }
        )
      );
    }
  }

  private async moveExpiredChallengesToPastChallengesFeed({
    challengeIdsWithEndDates,
    repo,
  }: {
    challengeIdsWithEndDates: ExpiredChallengeIdWithEndDate[];
    repo: Repository<FeedEntity>;
  }): Promise<
    Result<
      { removedChallengeIds: string[] },
      GlobalActiveChallengesFeedNotFoundException | InternalServerErrorException
    >
  > {
    const context = {
      methodName: 'moveExpiredChallengesToPastChallengesFeed',
      challengeIds: challengeIdsWithEndDates,
    };
    try {
      const feeds = await repo.find({
        where: {
          id: In([globalActiveChallengesFeedId, globalPastChallengesFeedId]),
        },
        select: [FeedEntity.kFields.id, FeedEntity.kFields.page],
      });
      const activeFeed = feeds.find(f => f.id === globalActiveChallengesFeedId);
      if (!activeFeed)
        return err(new GlobalActiveChallengesFeedNotFoundException(context));
      let pastFeed = feeds.find(f => f.id === globalPastChallengesFeedId);
      if (!pastFeed) {
        this.logger.info('creating global past challenges feed');
        pastFeed = new FeedEntity();
        pastFeed.id = globalPastChallengesFeedId;
      }
      const activeFeedIdsSet = new Set(activeFeed.page.ids);
      challengeIdsWithEndDates.forEach(c => activeFeedIdsSet.delete(c.id));
      activeFeed.page.ids = Array.from(activeFeedIdsSet);
      const challengeIdsSortedByEndDate = challengeIdsWithEndDates
        .sort((a, b) => +a.endDate - +b.endDate)
        .map(c => c.id);
      pastFeed.page.ids = Array.from(
        new Set([...pastFeed.page.ids, ...challengeIdsSortedByEndDate])
      );
      await Promise.all([
        repo.update(globalActiveChallengesFeedId, {
          page: activeFeed.page,
        }),
        repo.upsert(pastFeed, [FeedEntity.kFields.id]),
      ]);
      return ok({ removedChallengeIds: challengeIdsSortedByEndDate });
    } catch (error) {
      this.logger.error(
        'error moving expired challenges to past challenges feed',
        { error, challengeIds: challengeIdsWithEndDates }
      );
      return err(
        new InternalServerErrorException(
          'error moving expired challenges to past challenges feed',
          { error, challengeIds: challengeIdsWithEndDates }
        )
      );
    }
  }
}
