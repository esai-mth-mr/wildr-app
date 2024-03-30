import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { PostEntity } from '@verdzie/server/post/post.entity';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { PostSchema } from '@verdzie/server/post/post.schema';

export interface PostFindOptions {
  relations?: string[];
  includeDeleted?: boolean;
  includeExpired?: boolean;
  includeTakenDown?: boolean;
  where?: FindConditions<PostEntity>;
  comment?: string;
}

@Injectable()
export class PostRepository {
  constructor(
    @InjectRepository(PostSchema)
    readonly repository: Repository<PostEntity>
  ) {}

  private isNotDeleted: FindConditions<PostEntity> = {
    willBeDeleted: Raw(alias => `(${alias} IS NULL OR ${alias} = FALSE)`),
  };

  private existenceStateIsAlive: FindConditions<PostEntity> = {
    state: Raw(alias => `(${alias} IS NULL OR ${alias} = 0)`),
  };

  async findById(
    id: string,
    args?: {
      relations?: string[];
      predicate?: FindConditions<PostEntity>;
      shouldSkipDeletedPosts?: boolean;
      shouldSkipSuspendedPosts?: boolean;
      comment?: string;
    }
  ): Promise<PostEntity | undefined> {
    let where: FindConditions<PostEntity> = {};
    if (args?.shouldSkipDeletedPosts ?? true) where = { ...this.isNotDeleted };
    if (args?.shouldSkipSuspendedPosts ?? true)
      where = {
        ...this.existenceStateIsAlive,
        ...where,
      };
    if (args?.predicate) {
      where = {
        ...args.predicate,
        ...where,
      };
    }
    return this.repository.findOne(id, {
      relations: args?.relations ?? [],
      where,
      comment: args?.comment ?? 'PostRepository.findById',
    });
  }

  async findByOptions(
    options?: FindManyOptions<PostEntity>
  ): Promise<PostEntity[]> {
    return await this.repository.find(options);
  }

  async find(
    findCondition?: FindConditions<PostEntity>,
    shouldSkipDeletedPosts = true,
    shouldSkipSuspendedPosts = true,
    predicate?: FindConditions<PostEntity>,
    comment = 'PostRepository.find'
  ): Promise<PostEntity[]> {
    let where: FindConditions<PostEntity> = findCondition ?? {};
    if (shouldSkipDeletedPosts) where = { ...this.isNotDeleted, ...where };
    if (shouldSkipSuspendedPosts)
      where = {
        ...this.existenceStateIsAlive,
        ...where,
      };
    if (predicate) {
      where = {
        ...predicate,
        ...where,
      };
    }
    const options: FindOneOptions<PostEntity> = {
      where,
      comment,
    };
    return this.repository.find(options);
  }

  /**
   * Does not return the results in the order of @params `ids`
   */
  async findByIds(
    ids: any[],
    postFindOptions?: PostFindOptions,
    predicate?: FindConditions<PostEntity>,
    comment = 'PostRepository.findByIds'
  ): Promise<PostEntity[]> {
    postFindOptions = {
      ...postFindOptions,
      comment,
    };
    if (!postFindOptions.where) {
      postFindOptions.where = {};
    }
    if (!postFindOptions.includeDeleted) {
      postFindOptions.where = {
        ...postFindOptions.where,
        ...this.isNotDeleted,
      };
    }
    if (!postFindOptions.includeExpired) {
      postFindOptions.where.expiry = Raw(alias => {
        const condition = `${alias} >= timestamp '${new Date().toISOString()}'`;
        return `(${alias} IS NULL OR ${condition})`;
      });
    }
    if (!postFindOptions.includeTakenDown) {
      postFindOptions.where = {
        ...postFindOptions.where,
        ...this.existenceStateIsAlive,
      };
    }
    if (predicate) {
      postFindOptions.where = {
        ...postFindOptions.where,
        ...predicate,
      };
    }
    return await this.repository.findByIds(ids, {
      where: postFindOptions.where,
      relations: postFindOptions.relations,
      comment,
    });
  }

  //save
  async save(post: PostEntity, options?: SaveOptions): Promise<PostEntity> {
    return this.repository.save(post, options);
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
      | FindConditions<PostEntity>,
    partialEntity: QueryDeepPartialEntity<PostEntity>
  ): Promise<UpdateResult> {
    return this.repository.update(criteria, partialEntity);
  }
}
