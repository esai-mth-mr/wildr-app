import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';

export interface TxMethodOpts {
  repo?: Repository<CommentEntity>;
  txManager?: EntityManager;
}

@Injectable()
@EntityRepository()
export class CommentRepository {
  @InjectRepository(CommentEntity)
  repo: Repository<CommentEntity>;

  private isNotDeleted: FindConditions<CommentEntity> = {
    willBeDeleted: false,
  };

  private existenceStateIsAlive: FindConditions<CommentEntity> = {
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
   * comment repo if one is not passed.
   */
  getRepo(txOptions?: TxMethodOpts) {
    return (
      txOptions?.repo ||
      txOptions?.txManager?.getRepository(CommentEntity) ||
      this.repo
    );
  }

  async find(
    findCondition?: FindConditions<CommentEntity>,
    shouldSkipDeleted = true,
    shouldSkipSuspended = true
  ): Promise<CommentEntity[]> {
    let where: FindConditions<CommentEntity> = findCondition ?? {};
    if (shouldSkipDeleted) where = { ...this.isNotDeleted };
    if (shouldSkipSuspended)
      where = {
        ...this.existenceStateIsAlive,
      };
    const options: FindOneOptions<CommentEntity> = {
      where,
    };
    return this.repo.find(options);
  }

  /**
   * Find a comment by id. Comments that are soft deleted or not be
   * shown.
   */
  async findOne(
    id: string,
    findOptions?: FindOneOptions<CommentEntity>,
    txOptions?: TxMethodOpts
  ): Promise<CommentEntity | undefined> {
    return this.getRepo(txOptions).findOne(id, {
      ...findOptions,
      where: {
        ...this.isAvailableFindCondition.where,
        ...(findOptions?.where && typeof findOptions.where === 'object'
          ? findOptions.where
          : {}),
      },
    });
  }

  async findOneIncludingSoftDelete(id: string) {
    return this.repo.findOne(id);
  }

  /**
   * Finds a comment by id and returns it with the post relation. Comments that
   * are soft deleted will not be returned.
   */
  async findByIdWithPost(
    id: string,
    txOptions?: TxMethodOpts
  ): Promise<CommentEntity | undefined> {
    return this.findOne(
      id,
      {
        relations: [CommentEntity.kPostRelation],
      },
      txOptions
    );
  }

  /**
   * Finds a comment by id and returns it with the post relation. Comments that
   * are soft deleted will not be returned.
   */
  async findByIdWithChallenge(
    id: string,
    txOptions?: TxMethodOpts
  ): Promise<CommentEntity | undefined> {
    return this.findOne(
      id,
      {
        relations: [CommentEntity.kChallengeRelation],
      },
      txOptions
    );
  }

  /**
   * Find comments by id's. Comments that are soft deleted will not be returned.
   */
  async findByIds(
    ids: any[],
    findOptions?: FindOneOptions<CommentEntity>,
    txOptions?: TxMethodOpts
  ): Promise<CommentEntity[]> {
    return this.getRepo(txOptions).findByIds(ids, {
      ...findOptions,
      where: {
        ...this.isAvailableFindCondition.where,
        ...(findOptions?.where && typeof findOptions.where === 'object'
          ? findOptions.where
          : {}),
      },
    });
  }

  //save
  async save(
    comment: CommentEntity,
    options?: SaveOptions
  ): Promise<CommentEntity> {
    return this.repo.save(comment, options);
  }

  //update
  async update(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectID
      | ObjectID[]
      | FindConditions<CommentEntity>,
    partialEntity: QueryDeepPartialEntity<CommentEntity>
  ): Promise<UpdateResult> {
    return this.repo.update(criteria, partialEntity);
  }
}
