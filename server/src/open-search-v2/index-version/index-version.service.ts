import { Inject, Injectable } from '@nestjs/common';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Connection, ObjectType, Repository } from 'typeorm';
import { IndexVersionConfiguration } from './index-version.config';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { WildrExceptionDecorator } from '@verdzie/server/common/wildr-exception.decorator';
import { SnapshotType } from '../index-wal/index-wal.service';
import { InjectConnection } from '@nestjs/typeorm';
import {
  USER_RECENTLY_CREATED_INDEX_NAME,
  USER_SEARCH_V1_INDEX_NAME,
} from '@verdzie/server/open-search-v2/index-version/user-index-version.config';
import {
  POST_EXPLORE_V1_INDEX_NAME,
  POST_SEARCH_V1_INDEX_NAME,
} from '@verdzie/server/open-search-v2/index-version/post-index-version.config';

export type IndexableEntity = UserEntity | PostEntity;
export type IndexableEntityName = 'UserEntity' | 'PostEntity';

export type IndexVersionName =
  | typeof USER_SEARCH_V1_INDEX_NAME
  | typeof USER_RECENTLY_CREATED_INDEX_NAME
  | typeof POST_SEARCH_V1_INDEX_NAME
  | typeof POST_EXPLORE_V1_INDEX_NAME;

export type IndexVersionAlias = string;

export interface IndexVersion<
  Entity extends IndexableEntity,
  SerializedEntity
> {
  name: IndexVersionName;
  entityType: ObjectType<Entity>;
  incrementalIndex: boolean;
  getMapping: () => Record<string, any>;
  getQuery: (search: string) => Record<string, any>;
  getSort?: (search: string) => Record<string, any>;
  getOSDoc: (
    serializedRecord: SerializedEntity
  ) => Record<string, any> | undefined;
}

export interface IndexVersionConfig<
  Entity extends IndexableEntity,
  SerializedEntity
> {
  entityType: ObjectType<Entity>;
  serializeRecord: (
    id: string,
    repo: Repository<Entity>
  ) => Promise<SerializedEntity>;
  indexVersions: IndexVersion<Entity, SerializedEntity>[];
}

@Injectable()
export class IndexVersionService {
  private readonly incrementalIndexMap: Map<
    ObjectType<IndexableEntity>,
    IndexVersion<IndexableEntity, any>[]
  >;
  public readonly indexVersionConfigs: Map<
    ObjectType<IndexableEntity>,
    IndexVersionConfig<any, any>
  >;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly config: IndexVersionConfiguration,
    @InjectConnection('default')
    private readonly connection: Connection
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
    this.indexVersionConfigs = config.indexVersionConfigs;
    this.incrementalIndexMap = new Map();

    this.indexVersionConfigs.forEach(indexVersionConfig => {
      indexVersionConfig.indexVersions.forEach(indexVersion => {
        if (indexVersion.incrementalIndex) {
          const incrementalIndexVersions =
            this.incrementalIndexMap.get(indexVersion.entityType) ?? [];
          incrementalIndexVersions.push(indexVersion);
          this.incrementalIndexMap.set(
            indexVersion.entityType,
            incrementalIndexVersions
          );
        }
      });
    });
  }

  @WildrExceptionDecorator()
  getIncrementalIndexVersions(
    entityType: ObjectType<IndexableEntity>
  ): IndexVersion<IndexableEntity, typeof entityType>[] {
    const indexVersions = this.incrementalIndexMap.get(entityType);
    if (!indexVersions) {
      this.logger.warn(
        '[getIncrementalIndexVersions] No incremental index versions found for entity type',
        {
          entityType: entityType.name,
        }
      );
      return [];
    }
    return indexVersions;
  }

  @WildrExceptionDecorator()
  findIndexVersions(
    entityType: ObjectType<IndexableEntity>,
    names: IndexVersionName[]
  ): IndexVersion<IndexableEntity, typeof entityType>[] {
    const config = this.indexVersionConfigs.get(entityType);
    if (!config) {
      this.logger.warn(
        '[findIndexVersions] No index version config found for entity type',
        {
          entityType: entityType.name,
        }
      );
      return [];
    }
    const indexVersions: IndexVersion<IndexableEntity, typeof entityType>[] =
      [];
    names.forEach(name => {
      const indexVersion = config.indexVersions.find(
        indexVersion => indexVersion.name === name
      );
      if (!indexVersion) {
        this.logger.warn(
          '[findIndexVersions] No index version found for name',
          {
            name,
            entityType: entityType.name,
          }
        );
        return;
      }
      indexVersions.push(indexVersion);
    });
    return indexVersions;
  }

  @WildrExceptionDecorator()
  async getSnapshot(
    entityType: ObjectType<IndexableEntity>,
    id: string
  ): Promise<SnapshotType> {
    const config = this.indexVersionConfigs.get(entityType);
    if (!config)
      throw new InternalServerErrorException(
        `No index version config found for entity type ` + entityType.name,
        { entityType: entityType.name }
      );
    return config.serializeRecord(
      id,
      this.connection.getRepository(entityType)
    );
  }

  @WildrExceptionDecorator()
  getOSDoc(
    entityType: ObjectType<IndexableEntity>,
    indexVersionName: IndexVersionName,
    snapshot: SnapshotType
  ): Record<string, any> | undefined {
    const config = this.indexVersionConfigs.get(entityType);
    if (!config)
      throw new InternalServerErrorException(
        `No index version config found for entity type ` + entityType.name,
        { entityType: entityType.name }
      );
    const indexVersion = config.indexVersions.find(
      indexVersion => indexVersion.name === indexVersionName
    );
    if (!indexVersion)
      throw new InternalServerErrorException(
        `No index version found for name ` + indexVersionName,
        { indexVersionName }
      );
    return indexVersion.getOSDoc(snapshot);
  }
}
