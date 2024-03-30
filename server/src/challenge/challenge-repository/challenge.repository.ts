import { Injectable } from '@nestjs/common';
import {
  EntityManager,
  EntityRepository,
  FindConditions,
  FindOneOptions,
  ObjectID,
  Raw,
  Repository,
  SaveOptions,
  UpdateResult,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { preserveOrderByIds } from '@verdzie/server/data/common';

export interface ChallengeTxMethodOpts {
  repo?: Repository<ChallengeEntity>;
  txManager?: EntityManager;
}

@Injectable()
@EntityRepository()
export class ChallengeRepository {
  @InjectRepository(ChallengeEntity)
  repo: Repository<ChallengeEntity>;

  public get manager(): EntityManager {
    return this.repo.manager;
  }

  private isNotDeleted: FindConditions<ChallengeEntity> = {
    willBeDeleted: Raw(alias => `(${alias} IS NULL OR ${alias} = FALSE)`),
  };

  private existenceStateIsAlive: FindConditions<ChallengeEntity> = {
    state: Raw(alias => `(${alias} IS NULL OR ${alias} = 0)`),
  };

  private isAvailableFindCondition = {
    where: {
      ...this.isNotDeleted,
      ...this.existenceStateIsAlive,
    },
  };

  /**
   * Parse transaction method opts for a repository or fall back to the default
   * challenge repo if one is not passed.
   */
  getRepo(txOptions?: ChallengeTxMethodOpts): Repository<ChallengeEntity> {
    return (
      txOptions?.repo ||
      txOptions?.txManager?.getRepository(ChallengeEntity) ||
      this.repo
    );
  }

  private prepareFilteredFindOptions(
    findOptions?: FindOneOptions<ChallengeEntity>,
    shouldSkipDeleted = true,
    shouldSkipSuspended = true
  ): FindOneOptions<ChallengeEntity> {
    let where =
      findOptions?.where && typeof findOptions.where === 'object'
        ? findOptions.where
        : {};
    if (shouldSkipDeleted) where = { ...where, ...this.isNotDeleted };
    if (shouldSkipSuspended)
      where = {
        ...where,
        ...this.existenceStateIsAlive,
      };
    return {
      ...findOptions,
      where,
    };
  }

  async find({
    findOptions,
    txOptions,
    shouldSkipSuspended,
    shouldSkipDeleted,
  }: {
    findOptions?: FindOneOptions<ChallengeEntity>;
    txOptions?: ChallengeTxMethodOpts;
    shouldSkipDeleted?: boolean;
    shouldSkipSuspended?: boolean;
  }): Promise<ChallengeEntity[]> {
    return this.getRepo(txOptions).find(
      this.prepareFilteredFindOptions(
        findOptions,
        shouldSkipDeleted,
        shouldSkipSuspended
      )
    );
  }

  /**
   * Find a challenge by id. Challenges that are soft deleted or not be
   * shown.
   */
  async findOne({
    id,
    findOptions,
    txOptions,
  }: {
    id: string;
    findOptions?: FindOneOptions<ChallengeEntity>;
    txOptions?: ChallengeTxMethodOpts;
  }): Promise<ChallengeEntity | undefined> {
    return this.getRepo(txOptions).findOne(
      id,
      this.prepareFilteredFindOptions(findOptions)
    );
  }

  async findOneIncludingSoftDelete(id: string) {
    return this.repo.findOne(id);
  }

  /**
   * Find challenges by ids. Challenges that are soft deleted will not be returned.
   */
  async findByIds({
    ids,
    findOptions,
    txOptions,
  }: {
    ids: string[];
    findOptions?: FindOneOptions<ChallengeEntity>;
    txOptions?: ChallengeTxMethodOpts;
  }): Promise<ChallengeEntity[]> {
    const result = await this.getRepo(txOptions).findByIds(
      ids,
      this.prepareFilteredFindOptions(findOptions)
    );
    return preserveOrderByIds(ids, result);
  }

  async save({
    challenge,
    options,
    txOptions,
  }: {
    challenge: ChallengeEntity;
    options?: SaveOptions;
    txOptions?: ChallengeTxMethodOpts;
  }): Promise<ChallengeEntity> {
    return this.getRepo(txOptions).save(challenge, options);
  }

  async insert({
    challenge,
    txOptions,
  }: {
    challenge: ChallengeEntity;
    txOptions?: ChallengeTxMethodOpts;
  }): Promise<ChallengeEntity | undefined> {
    await this.getRepo(txOptions).insert(challenge);
    return challenge;
  }

  async update({
    criteria,
    partialEntity,
    txOptions,
  }: {
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectID
      | ObjectID[]
      | FindConditions<ChallengeEntity>;
    partialEntity: QueryDeepPartialEntity<ChallengeEntity>;
    txOptions?: ChallengeTxMethodOpts;
  }): Promise<UpdateResult> {
    return this.getRepo(txOptions).update(criteria, partialEntity);
  }
}
