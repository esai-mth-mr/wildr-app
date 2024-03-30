import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from '../graphql';
import {
  FindConditions,
  In,
  LessThan,
  MoreThan,
  Raw,
  Repository,
} from 'typeorm';
import { generateId } from '../common/generateId';
import { PaginateParams } from '../data/common';
import { IndexTagsProducer } from '../worker/index-tags/indexTags.producer';
import { TagEntity } from './tag.entity';
import { now } from 'lodash';
import { randomUUID } from 'crypto';

/**
 * TODO: shouldMakeItUnique is a temp solution
 * https://www.notion.so/wildr-inc/GQL-tag-objects-wrongly-getting-reused-eb050871ac02421a9711035fd9edfd0c
 */
export const toTagObject = (
  tag: TagEntity,
  noSpace = false,
  shouldMakeItUnique = false
): Tag => {
  let id = tag.id;
  if (shouldMakeItUnique) id = +'__' + generateId();
  return {
    __typename: 'Tag',
    id,
    name: tag.name,
    noSpace,
  };
};

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(TagEntity)
    private repo: Repository<TagEntity>,
    private indexTagsWorker: IndexTagsProducer
  ) {}

  async findAllById(ids: string[]): Promise<TagEntity[]> {
    if (ids.length === 0) return [];
    return this.repo.findByIds(ids);
  }

  async findOrCreateAll(names: string[]): Promise<TagEntity[]> {
    const found = await this.repo.find({
      where: {
        name: In(names),
      },
    });
    if (found.length === names.length) return found;
    const missing = names.filter(n => !found.find(tag => tag.name === n));
    const createdTags = await this.repo.manager.transaction<TagEntity[]>(
      async (em): Promise<TagEntity[]> => {
        const foundAgain = await em.find(TagEntity, {
          where: { name: In(missing) },
        });
        const stillMissing: TagEntity[] = missing
          .filter(n => !foundAgain.find(tag => tag.name === n))
          .map((n): TagEntity => ({ id: generateId(), name: n }));
        await em.save(TagEntity, stillMissing);
        return foundAgain.concat(stillMissing);
      }
    );
    // TODO: Dispatch via worker instead
    // await this.searchIndexService.indexMultipleHashTags(createdTags);
    this.indexTagsWorker.indexTags({ tags: createdTags });
    return found.concat(createdTags);
  }
  // Returns set of tag ids that exist.
  async filter(ids: string[]): Promise<string[]> {
    const tagIds = await this.repo.findByIds(ids, { select: ['id'] });
    return tagIds.filter(u => ids.includes(u.id)).map(u => u.id);
  }

  async find(query: string, paginate: PaginateParams): Promise<TagEntity[]> {
    const conds: FindConditions<TagEntity> = {
      name: Raw(alias => `${alias} ILIKE :query`, { query: `%${query}%` }),
    };
    const limit =
      (paginate.__type == 'PaginateDownParams' ? paginate.first : undefined) ??
      (paginate.__type == 'PaginateUpParams' ? paginate.last : undefined) ??
      10;
    if (paginate.__type === 'PaginateDownParams' && paginate.after) {
      conds.id = MoreThan(paginate.after);
    } else if (paginate.__type === 'PaginateUpParams' && paginate.before) {
      conds.id = LessThan(paginate.before);
    }
    return this.repo.find({
      where: conds,
      take: limit,
    });
  }
}
