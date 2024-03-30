import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ChallengeRepository } from '@verdzie/server/challenge/challenge-repository/challenge.repository';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { Result, err, ok } from 'neverthrow';

export interface RestrictedChallengeEntryError {
  challenge?: ChallengeEntity;
  errorMessage: string;
}

@Injectable()
export class ChallengeAccessControlService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly repo: ChallengeRepository,
    private readonly feedService: FeedService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async restrictedChallengeEntryError(
    challengeId: string,
    userId: string
  ): Promise<
    Result<
      undefined,
      RestrictedChallengeEntryError | InternalServerErrorException
    >
  > {
    try {
      this.logger.info('[restrictedChallengeEntryError]', {
        challengeId,
        userId,
      });
      const challenge = await this.repo.findOne({ id: challengeId });
      if (!challenge) {
        return err({
          errorMessage: 'Challenge does not exist',
        });
      }
      if (challenge.isCompleted) {
        return err({
          errorMessage: `You can't add entries to a completed challenge`,
        });
      }
      //If the user is part of the challenge, then yes
      const index = await this.feedService.findIndex(
        toFeedId(FeedEntityType.CHALLENGE_PARTICIPANTS, challengeId),
        userId
      );
      if (index === -1) {
        const errorMessage = 'Not a member of Challenge: ' + challenge.name;
        return err({
          challenge,
          errorMessage,
        });
      }
      return ok(undefined);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[restrictedChallengeEntryError] error: ' + error,
          {
            challengeId,
            userId,
          },
          error
        )
      );
    }
  }
}
