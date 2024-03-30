import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReplyEntity } from '@verdzie/server/reply/reply.entity';
import {
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
import { EntityManager } from 'typeorm';

export interface TxMethodOpts {
  entityManager?: EntityManager;
  repo?: Repository<ReplyEntity>;
}

@Injectable()
export class ReplyRepository {
  @InjectRepository(ReplyEntity)
  repo: Repository<ReplyEntity>;

  private isNotDeleted: FindConditions<ReplyEntity> = {
    willBeDeleted: false,
  };

  private existenceStateIsAlive: FindConditions<ReplyEntity> = {
    state: Raw(alias => `(${alias} IS NULL OR ${alias} = 0)`),
  };

  private isAvailableFindCondition = {
    where: {
      ...this.isNotDeleted,
      ...this.existenceStateIsAlive,
    },
  };

  async findOne(
    id: string,
    options?: FindOneOptions<ReplyEntity>
  ): Promise<ReplyEntity | undefined> {
    return this.repo.findOne(id, {
      ...options,
      ...this.isAvailableFindCondition,
    });
  }

  async findOneByIdWithCommentAndPost(
    id: string,
    findOptions?: FindOneOptions<ReplyEntity>
  ): Promise<ReplyEntity | undefined> {
    return this.repo.findOne(id, {
      relations: [
        ReplyEntity.kCommentRelation,
        `${ReplyEntity.kCommentRelation}.${CommentEntity.kPostRelation}`,
      ],
      ...findOptions,
      where: {
        ...this.isAvailableFindCondition.where,
        ...(findOptions?.where && typeof findOptions.where === 'object'
          ? findOptions.where
          : {}),
      },
    });
  }

  async find(
    findCondition?: FindConditions<ReplyEntity>,
    shouldSkipDeleted = true,
    shouldSkipSuspended = true
  ): Promise<ReplyEntity[]> {
    let where: FindConditions<ReplyEntity> = findCondition ?? {};
    if (shouldSkipDeleted) where = { ...this.isNotDeleted };
    if (shouldSkipSuspended)
      where = {
        ...this.existenceStateIsAlive,
      };
    const options: FindOneOptions<ReplyEntity> = {
      where,
    };
    return this.repo.find(options);
  }

  async findOneIncludingSoftDelete(
    id: string,
    options?: FindOneOptions<ReplyEntity>
  ) {
    return this.repo.findOne(id, options);
  }

  async findByIds(
    ids: any[],
    options?: FindOneOptions<ReplyEntity>
  ): Promise<ReplyEntity[]> {
    return this.repo.findByIds(ids, {
      ...options,
      ...this.isAvailableFindCondition,
    });
  }

  //save
  async save(reply: ReplyEntity, options?: SaveOptions): Promise<ReplyEntity> {
    return this.repo.save(reply, options);
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
      | FindConditions<ReplyEntity>,
    partialEntity: QueryDeepPartialEntity<ReplyEntity>
  ): Promise<UpdateResult> {
    return this.repo.update(criteria, partialEntity);
  }
}
