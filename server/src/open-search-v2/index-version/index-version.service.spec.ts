import { TestingModule } from '@nestjs/testing';
import {
  IndexVersion,
  IndexVersionConfig,
  IndexVersionName,
  IndexVersionService,
} from './index-version.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { IndexVersionConfiguration } from './index-version.config';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { Repository } from 'typeorm';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import {
  USER_RECENTLY_CREATED_INDEX_NAME,
  USER_SEARCH_V1_INDEX_NAME,
} from '@verdzie/server/open-search-v2/index-version/user-index-version.config';

function FakeUserIndexVersion(
  overrides?: Partial<IndexVersion<UserEntity, UserEntity>>
): IndexVersion<UserEntity, UserEntity> {
  return {
    name: USER_SEARCH_V1_INDEX_NAME,
    entityType: UserEntity,
    incrementalIndex: false,
    getMapping: () => {
      return {
        properties: {
          id: {
            type: 'keyword',
          },
        },
      };
    },
    getQuery: (search: string) => {
      return {
        query: {
          match: {
            id: search,
          },
        },
      };
    },
    getOSDoc: (entity: UserEntity) => {
      return {
        id: entity.id,
      };
    },
    ...overrides,
  };
}

function FakeUserIndexVersionConfig(
  overrides?: Partial<IndexVersionConfig<UserEntity, UserEntity>>
): IndexVersionConfig<UserEntity, UserEntity> {
  return {
    entityType: UserEntity,
    serializeRecord: async (id: string, repo: Repository<UserEntity>) => {
      return repo.findOneOrFail(id);
    },
    indexVersions: [
      FakeUserIndexVersion({
        name: USER_RECENTLY_CREATED_INDEX_NAME,
      }),
      FakeUserIndexVersion({
        name: USER_SEARCH_V1_INDEX_NAME,
        incrementalIndex: true,
      }),
    ],
    ...overrides,
  };
}

function FakeUserIndexVersionConfigWithMultipleIncrementalIndexes(
  overrides?: Partial<IndexVersionConfig<UserEntity, UserEntity>>
): IndexVersionConfig<UserEntity, UserEntity> {
  return {
    entityType: UserEntity,
    serializeRecord: async (id: string, repo: Repository<UserEntity>) => {
      return repo.findOneOrFail(id);
    },
    indexVersions: [
      FakeUserIndexVersion({
        name: USER_SEARCH_V1_INDEX_NAME,
        incrementalIndex: true,
      }),
      FakeUserIndexVersion({
        name: USER_RECENTLY_CREATED_INDEX_NAME,
        incrementalIndex: true,
      }),
    ],
    ...overrides,
  };
}

describe('IndexVersionService', () => {
  let service: IndexVersionService;
  let module: TestingModule;

  beforeEach(async () => {
    const indexVersionConfigs = new Map();
    indexVersionConfigs.set(UserEntity, FakeUserIndexVersionConfig());
    module = await createMockedTestingModule({
      providers: [
        IndexVersionService,
        {
          provide: IndexVersionConfiguration,
          useValue: {
            indexVersionConfigs,
          },
        },
      ],
    });
    service = module.get<IndexVersionService>(IndexVersionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getIncrementalIndexVersions', () => {
    it('should return an empty array if no incremental index versions are found', () => {
      const result = service.getIncrementalIndexVersions(PostEntity);
      expect(result).toEqual([]);
    });

    it('should return the incremental index versions for USER_QUERY_INDEX', () => {
      const entityType = UserEntity;
      const result = service.getIncrementalIndexVersions(entityType);
      expect(result?.length).toBe(1);
      if (!result) throw new Error('result is undefined');
      expect(result[0].name).toBe(USER_SEARCH_V1_INDEX_NAME);
      expect(result[0].incrementalIndex).toBe(true);
    });

    it('should return multiple incremental index versions for USER_QUERY_INDEX', async () => {
      const indexVersionConfigs = new Map();
      indexVersionConfigs.set(
        UserEntity,
        FakeUserIndexVersionConfigWithMultipleIncrementalIndexes()
      );
      const module = await createMockedTestingModule({
        providers: [
          IndexVersionService,
          {
            provide: IndexVersionConfiguration,
            useValue: {
              indexVersionConfigs,
            },
          },
        ],
      });
      const service = module.get<IndexVersionService>(IndexVersionService);
      const result = service.getIncrementalIndexVersions(UserEntity);
      expect(result?.length).toBe(2);
    });
  });

  describe('findIndexVersions', () => {
    it('should return an empty array if no index version configs are found', () => {
      const result = service.findIndexVersions(PostEntity, []);
      expect(result).toEqual([]);
    });

    it('should return an empty array if no index versions are found', () => {
      const names = ['v4'];
      // @ts-ignore
      const result = service.findIndexVersions(UserEntity, names);
      expect(result).toEqual([]);
    });

    it('should return the index versions for USER_SEARCH_V1_INDEX_NAME', () => {
      const names: IndexVersionName[] = [
        USER_SEARCH_V1_INDEX_NAME,
        USER_RECENTLY_CREATED_INDEX_NAME,
      ];
      const result = service.findIndexVersions(UserEntity, names);
      expect(result?.length).toBe(2);
      if (!result) throw new Error('result is undefined');
      expect(result[0].name).toBe(USER_SEARCH_V1_INDEX_NAME);
      expect(result[0].incrementalIndex).toBe(true);
      expect(result[1].name).toBe(USER_RECENTLY_CREATED_INDEX_NAME);
      expect(result[1].incrementalIndex).toBe(false);
    });
  });

  describe('getSnapshot', () => {
    it('should throw if there is no index version config', async () => {
      await expect(service.getSnapshot(PostEntity, '5')).rejects.toThrow(
        `No index version config found for entity type ` + PostEntity.name
      );
    });

    it('should return the snapshot for the entity type', async () => {
      const user = UserEntityFake();
      const repo = {
        findOneOrFail: jest.fn().mockResolvedValue(user),
      };
      service['connection'].getRepository = jest.fn().mockReturnValue(repo);

      const result = await service.getSnapshot(UserEntity, '5');

      expect(result).toEqual(user);
      expect(repo.findOneOrFail).toHaveBeenCalledWith('5');
      expect(service['connection'].getRepository).toHaveBeenCalledWith(
        UserEntity
      );
    });
  });
});
