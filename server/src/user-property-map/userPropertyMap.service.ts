import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPropertyMapEntity } from './userPropertyMap.entity';
import { PAGE_NUMBER_SEPARATOR } from '@verdzie/server/common/generateId';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { UpdateResult } from 'typeorm/query-builder/result/UpdateResult';

@Injectable()
export class UserPropertyMapService {
  @InjectRepository(UserPropertyMapEntity)
  public repo: Repository<UserPropertyMapEntity>;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'UserPropertyMapService' });
  }

  private generateId(ownerId: string, pageNumber = 1) {
    return ownerId + PAGE_NUMBER_SEPARATOR + pageNumber;
  }

  /**
   * ID Format = userId {@link PAGE_NUMBER_SEPARATOR} pageNumber
   * @param userId
   */
  async createMapEntity(userId: string): Promise<UserPropertyMapEntity> {
    this.logger.info('createMapEntity()', { userId });
    try {
      const id = this.generateId(userId);
      return await this.repo.save(new UserPropertyMapEntity(id, {}));
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async findOrCreateByOwnerId(
    ownerId: string,
    pageNumber = 1
  ): Promise<UserPropertyMapEntity | undefined> {
    let entity = await this.findByOwnerId(ownerId, pageNumber);
    if (!entity) {
      entity = await this.createMapEntity(ownerId);
    }
    return entity;
  }

  private async findByOwnerId(
    ownerId: string,
    pageNumber = 1
  ): Promise<UserPropertyMapEntity | undefined> {
    return await this.repo.findOne({
      id: this.generateId(ownerId, pageNumber),
    });
  }

  async findAllByOwnerId(
    ownerId: string,
    orderBy: 'ASC' | 'DESC' = 'ASC'
  ): Promise<UserPropertyMapEntity[]> {
    try {
      const result = await this.findByOwnerId(ownerId);
      return !!result ? [result] : [];
      // return await this.repo.find({
      //   where: { id: Like(ownerId + '%') },
      //   order: { id: orderBy },
      // });
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }

  /**
   * Followed User needs to know in which list has the follower added this user
   */
  async followedEvent(followerId: string, followedUserId: string) {
    await this.setOrAppendProperties(followedUserId, followerId, [
      toFeedId(FeedEntityType.FOLLOWING, followerId),
    ]);
  }

  /**
   * User being unfollowed doesn't, anymore, need to know any property about the
   * user that followed them.
   *
   * Again, Followers Feed is the superset.
   */
  async unfollowEvent(
    unfollowedUserId: string,
    unfollower: string,
    repo?: Repository<UserPropertyMapEntity>
  ) {
    await this.removeId(unfollowedUserId, unfollower, undefined, repo);
  }

  isFollowingFeedId(property: string): boolean {
    return property.startsWith(`${FeedEntityType.FOLLOWING}`);
  }

  async update(
    id: string,
    partialEntity: QueryDeepPartialEntity<UserPropertyMapEntity>
  ): Promise<UpdateResult> {
    return this.repo.update(id, partialEntity);
  }

  /**
   * Appends @param properties to existing entry if exists otherwise adds a
   * new entry.
   */
  async setOrAppendProperties(
    ownerId: string,
    entryId: string,
    properties: string[] = [],
    fromEntity?: UserPropertyMapEntity | undefined
  ): Promise<boolean> {
    this.logger.info('setOrAppendProperties', { ownerId, entryId, properties });
    const entity = fromEntity ?? (await this.findOrCreateByOwnerId(ownerId));
    if (!entity) {
      this.logger.error('Failed to findOrCreate property');
      return false;
    }
    entity.setOrAppendProperty(entryId, properties);
    try {
      await this.repo.update(entity.id, {
        userPropertyKvP: entity.userPropertyKvP,
      });
      this.logger.info('successful', { entityId: entity.id });
    } catch (e) {
      this.logger.error(e);
      return false;
    }
    return true;
  }

  async removeProperties(
    ownerId: string,
    entryId: string,
    properties: string[] = [],
    fromEntity?: UserPropertyMapEntity | undefined
  ) {
    this.logger.info('removeProperties', { ownerId, entryId, properties });
    const entity = fromEntity ?? (await this.findByOwnerId(ownerId));
    if (!entity) return true;
    entity.removeProperties(entryId, properties);
    try {
      await this.repo.update(entity.id, {
        userPropertyKvP: entity.userPropertyKvP,
      });
      this.logger.info('successful', { entityId: entity.id });
    } catch (e) {
      this.logger.error(e);
      return false;
    }
    return true;
  }

  async getProperties(
    ownerId: string,
    userId: string,
    fromEntity?: UserPropertyMapEntity | undefined
  ): Promise<string[] | undefined> {
    const entity = fromEntity ?? (await this.findByOwnerId(ownerId));
    if (!entity) {
      this.logger.info('Entity not found', { ownerId, entryId: userId });
      return;
    }
    return entity.userPropertyMap.get(userId);
  }

  async removeId(
    ownerId: string,
    entryId: string,
    fromEntity?: UserPropertyMapEntity | undefined,
    repo?: Repository<UserPropertyMapEntity>
  ) {
    this.logger.info('removeId', { ownerId, entryId });
    const entity = fromEntity ?? (await this.findByOwnerId(ownerId));
    if (!entity) {
      this.logger.info('Entity not found', { ownerId, entryId });
      return false;
    }
    entity.removeEntry(entryId);
    const repository: Repository<UserPropertyMapEntity> = repo ?? this.repo;
    const result = await repository.update(entity.id, {
      userPropertyKvP: entity.userPropertyKvP,
    });
    this.logger.info('Entity removed successfully', {});
    return result.affected === 1;
  }
}

class UserPropMapNotFound extends Error {}
