import { Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ChallengeLeaderboardService } from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.service';
import { ChallengePostEntryService } from '@verdzie/server/challenge/challenge-post-entry/challengePostEntry.service';
import { PageNotFoundError } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import { ChallengeCleanupProducer } from '@verdzie/server/worker/challenge-cleanup/challenge-cleanup.producer';
import { last } from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Connection } from 'typeorm';
import { Logger } from 'winston';

export class ChallengeCleanupService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly challengeCleanupProducer: ChallengeCleanupProducer,
    private readonly challengeLeaderboardService: ChallengeLeaderboardService,
    private readonly challengePostEntryService: ChallengePostEntryService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async cleanupAfterPostDeletion({
    challengeId,
    userId,
    postId,
  }: {
    challengeId: string;
    userId: string;
    postId: string;
  }) {
    await Promise.all([
      this.challengeCleanupProducer.cleanupChallengeEntriesFeedAndStats({
        challengeId,
        postId,
      }),
      this.challengeCleanupProducer.cleanupUserPostEntriesFeedAndLeaderboard({
        challengeId,
        userId,
        postId,
      }),
    ]);
  }

  async cleanupChallengeEntriesFeedAndStats({
    challengeId,
    postId,
  }: {
    challengeId: string;
    postId: string;
  }) {
    this.logger.info('[cleanupChallengeEntriesFeedAndStats]', {
      challengeId,
      postId,
    });
    const removalFromChallengeFeedResult =
      await this.challengePostEntryService.removeFromChallengePostEntriesFeedAndUpdateStats(
        {
          postId,
          challengeId,
          feedRepo: this.connection.getRepository(FeedEntity),
          challengeRepo: this.connection.getRepository(ChallengeEntity),
        }
      );
    if (removalFromChallengeFeedResult.isErr()) {
      if (removalFromChallengeFeedResult.error instanceof PageNotFoundError) {
        return;
      }
      throw new InternalServerErrorException(
        'Error cleaning up challenge entries feed and stats ' +
          removalFromChallengeFeedResult.error,
        {
          challengeId,
          methodName: 'cleanupChallengeParticipantsFeed',
        },
        removalFromChallengeFeedResult.error
      );
    }
  }

  async cleanupChallengeParticipantsFeed({
    challengeId,
    userId,
  }: {
    challengeId: string;
    userId: string;
  }) {
    this.logger.info('[cleanupChallengeParticipantsAfterPostDeletion]', {
      challengeId,
      userId,
    });
    const result =
      await this.challengePostEntryService.updateUserParticipantEntry({
        challengeId,
        participantId: userId,
      });
    if (result.isErr())
      throw new InternalServerErrorException(
        'Error cleaning up participants feed ' + result.error,
        {
          challengeId,
          userId,
          methodName: 'cleanupChallengeParticipantsFeed',
        },
        result.error
      );
  }

  async cleanupUserPostEntriesFeedAndLeaderboard({
    challengeId,
    userId,
    postId,
  }: {
    challengeId: string;
    userId: string;
    postId: string;
  }) {
    this.logger.info('[cleanupUserPostEntriesFeedAndLeaderboard]', {
      challengeId,
      userId,
      postId,
    });
    const removalFromUserFeedResult =
      await this.challengePostEntryService.removeFromUserPostEntriesOnChallengeFeed(
        {
          postId,
          challengeId,
          authorId: userId,
          feedRepo: this.connection.getRepository(FeedEntity),
        }
      );
    let result;
    if (removalFromUserFeedResult.isErr()) {
      if (removalFromUserFeedResult.error instanceof PageNotFoundError) {
        result =
          await this.challengeLeaderboardService.updateChallengeLeaderboard({
            challengeIdOrChallenge: challengeId,
            participantId: userId,
            latestEntryId: '',
            entryCount: 0,
          });
      } else {
        throw removalFromUserFeedResult.error;
      }
    } else {
      result =
        await this.challengeLeaderboardService.updateChallengeLeaderboard({
          challengeIdOrChallenge: challengeId,
          participantId: userId,
          latestEntryId:
            last(
              removalFromUserFeedResult.value.userPostEntriesOnChallengeFeed.ids
            ) ?? '',
          entryCount:
            removalFromUserFeedResult.value.userPostEntriesOnChallengeFeed
              .count,
        });
    }
    if (result.error) {
      throw new InternalServerErrorException(
        'Error cleaning up leaderboard ' + result.error,
        {
          challengeId,
          userId,
          postId,
          methodName: 'cleanupUserPostEntriesFeedAndLeaderboard',
        },
        result.error
      );
    } else {
      this.challengeCleanupProducer.cleanupChallengeParticipantsFeed({
        challengeId,
        userId,
      });
    }
  }
}
