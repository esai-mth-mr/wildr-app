import { Inject, Injectable } from '@nestjs/common';
import {
  fromFeaturedChallengeIdString,
  toFeaturedChallengesIdString,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { ChallengeRepository } from '@verdzie/server/challenge/challenge-repository/challenge.repository';
import { globalFeaturedChallengesFeedId } from '@verdzie/server/challenge/challenge.service';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Like, Repository } from 'typeorm';
import { SearchChallengeByNameDto } from '@verdzie/server/admin/challenge/dto/search-challenge-by-name.dto';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { FeaturedChallengesResponseDto } from '@verdzie/server/admin/challenge/dto/featured-challenges-response.dto';
import {
  BadRequestException,
  BadRequestExceptionCodes,
  InternalServerErrorException,
  NotFoundException,
  NotFoundExceptionCodes,
  WildrException,
} from '@verdzie/server/exceptions/wildr.exception';
import { Result, err, ok } from 'neverthrow';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';

type ChallengeFeaturedUpdateResponse = {
  message: string;
  challengeId: string;
};

@Injectable()
export class AdminChallengeService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly feedService: FeedService,
    private readonly challengeRepo: ChallengeRepository
  ) {}

  async addToFeatured(id: string): Promise<ChallengeFeaturedUpdateResponse> {
    const challenge = await this.challengeRepo.findOne({ id });
    if (!challenge) {
      throw new Error(`Challenge with id ${id} not found`);
    }
    await this.feedService.createIfNotExists(globalFeaturedChallengesFeedId);
    await this.feedService.tryAndPushEntry(
      globalFeaturedChallengesFeedId,
      toFeaturedChallengesIdString({
        id: challenge.id,
        endDate: challenge.endDate,
      })
    );
    return {
      message: `${challenge.name} added to featured challenges list`,
      challengeId: id,
    };
  }

  async removeFromFeatured(
    id: string
  ): Promise<ChallengeFeaturedUpdateResponse> {
    await this.feedService.removeEntry(globalFeaturedChallengesFeedId, id);
    return {
      message: 'Challenge removed from featured list',
      challengeId: id,
    };
  }

  async findChallengeByName(name: string): Promise<SearchChallengeByNameDto> {
    const challenge = await this.challengeRepo.repo.findOne({
      where: { name: Like(name + '%') },
    });
    if (!challenge) {
      throw new Error(`Challenge with name starting with '${name}' not found`);
    }
    return {
      ...challenge,
    };
  }

  async getFeaturedChallengesList(): Promise<FeaturedChallengesResponseDto> {
    const featuredChallenges = await this.feedService.find(
      globalFeaturedChallengesFeedId
    );
    if (!featuredChallenges) {
      return new FeaturedChallengesResponseDto([], new Date());
    }
    const challengeIds: string[] = [];
    for (const edge of featuredChallenges.page.ids) {
      const challengeId = fromFeaturedChallengeIdString(edge)?.id;
      if (challengeId) {
        challengeIds.push(challengeId);
      }
    }
    const challenges = await this.challengeRepo.repo.findByIds(challengeIds);
    return new FeaturedChallengesResponseDto(
      challenges,
      featuredChallenges.updatedAt
    );
  }

  async setFeaturedChallenges({
    challengeIds,
    updatedAt,
    feedRepo,
  }: {
    challengeIds: string[];
    updatedAt: Date;
    feedRepo: Repository<FeedEntity>;
  }): Promise<
    Result<
      undefined,
      | StaleDataException
      | FeaturedChallengeNotFoundException
      | NotFoundException
      | FeaturedChallengeDeletedException
      | InternalServerErrorException
    >
  > {
    try {
      const featuredChallengesFeed = await feedRepo.findOne({
        where: { id: globalFeaturedChallengesFeedId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!featuredChallengesFeed) {
        return err(
          new NotFoundException(
            'Featured challenges feed has not been created yet,' +
              ' add a challenge to featured challenges first'
          )
        );
      }
      if (updatedAt < featuredChallengesFeed.updatedAt) {
        return err(new StaleDataException());
      }
      const challenges = await this.challengeRepo.repo.findByIds(challengeIds);
      if (challenges.length !== challengeIds.length) {
        return err(
          new FeaturedChallengeNotFoundException({
            missingIds: challengeIds.filter(
              id => !challenges.find(c => c.id === id)
            ),
          })
        );
      }
      const deletedChallenges = challenges.filter(c => c.willBeDeleted);
      if (deletedChallenges.length > 0) {
        return err(
          new FeaturedChallengeDeletedException({ deletedChallenges })
        );
      }
      const newEdges: string[] = [];
      for (const id of challengeIds) {
        const challenge = challenges.find(c => c.id === id);
        if (challenge) {
          newEdges.push(
            toFeaturedChallengesIdString({ id, endDate: challenge.endDate })
          );
        }
      }
      featuredChallengesFeed.page.ids = newEdges;
      featuredChallengesFeed.updatedAt = new Date();
      featuredChallengesFeed.count = newEdges.length;
      await feedRepo.upsert(featuredChallengesFeed, ['id']);
      return ok(undefined);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[setFeaturedChallenges] ' + error,
          { challengeIds, updatedAt, methodName: 'setFeaturedChallenges' },
          error
        )
      );
    }
  }

  async reOrderFeaturedChallenges({
    challengeIds,
    updatedAt,
  }: {
    challengeIds: string[];
    updatedAt: Date;
  }): Promise<
    Result<
      undefined,
      | StaleDataException
      | FeaturedChallengeDeletedException
      | NotFoundException
      | FeaturedChallengeNotFoundException
      | InternalServerErrorException
    >
  > {
    try {
      const result = await this.feedService.repo.manager.transaction(
        async manager => {
          const result = await this.setFeaturedChallenges({
            challengeIds,
            updatedAt,
            feedRepo: manager.getRepository(FeedEntity),
          });
          if (result.isErr()) {
            throw result.error;
          }
          return result;
        }
      );
      return result;
    } catch (error) {
      if (error instanceof WildrException) {
        return err(error);
      }
      return err(
        new InternalServerErrorException(
          '[reOrderFeaturedChallenges] ' + error,
          { challengeIds, updatedAt, methodName: 'reOrderFeaturedChallenges' },
          error
        )
      );
    }
  }

  async takeDown(
    id: string
  ): Promise<
    Result<undefined, NotFoundException | InternalServerErrorException>
  > {
    const challenge = await this.challengeRepo.findOne({ id });
    if (!challenge) {
      return err(new NotFoundException(`Challenge with id ${id}`));
    }
    try {
      challenge.existenceState = ExistenceState.TAKEN_DOWN;
      await this.challengeRepo.update({
        criteria: { id },
        partialEntity: { state: challenge.existenceState },
      });
    } catch (error) {
      const errorParams = { challengeId: id, error, methodName: 'takeDown' };
      this.logger.error('Unable to change state to TAKEN_DOWN', errorParams);
      return err(
        new InternalServerErrorException('[takeDown]' + error, errorParams)
      );
    }
    return ok(undefined);
  }
}

export interface ChallengeTakeDownResponse {
  challengeId: string;
  message: string;
}

export class StaleDataException extends BadRequestException {
  constructor() {
    super('Your session is out of date. Please refresh the page.');
  }
}

export class FeaturedChallengeDeletedException extends BadRequestException {
  deletedChallengeIds: string[];

  constructor({
    deletedChallenges,
    methodName,
  }: {
    deletedChallenges: ChallengeEntity[];
    methodName?: string;
  }) {
    super(
      'The following challenges have been deleted: ' +
        deletedChallenges.map(c => c.name).join(', '),
      { exceptionCode: BadRequestExceptionCodes.CHALLENGE_DELETED, methodName }
    );
    this.deletedChallengeIds = deletedChallenges.map(c => c.id);
  }
}

export class FeaturedChallengeNotFoundException extends NotFoundException {
  missingIds: string[];

  constructor({
    missingIds,
    methodName,
  }: {
    missingIds: string[];
    methodName?: string;
  }) {
    super(
      'Challenges with the following ids were not found: ' +
        missingIds.join(', '),
      { exceptionCode: NotFoundExceptionCodes.CHALLENGE_NOT_FOUND, methodName }
    );
    this.missingIds = missingIds;
  }
}
