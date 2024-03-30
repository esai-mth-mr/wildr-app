import {
  OSIndexStateService,
  IndexingState,
  DEFAULT_INDEX_VERSION_ALIAS,
} from './index-state.service';
import { EntityManager, In, Repository } from 'typeorm';
import { IndexVersionService } from '@verdzie/server/open-search-v2/index-version/index-version.service';
import { UserEntityIndexState } from './user-entity/user-entity-index-state.entity.bi';
import {
  BI_CONN_INSTANCE_TOKEN_NAME,
  createMockedTestingModule,
} from '@verdzie/server/testing/base.module';
import { InstanceToken } from '@nestjs/core/injector/module';
import {
  USER_RECENTLY_CREATED_INDEX_NAME,
  USER_SEARCH_V1_INDEX_NAME,
} from '@verdzie/server/open-search-v2/index-version/user-index-version.config';

describe('IndexStateService', () => {
  describe('recordIncrementalIndexRequest', () => {
    let service: OSIndexStateService;

    beforeEach(async () => {
      const mockMap: Map<InstanceToken, any> = new Map();
      mockMap.set(BI_CONN_INSTANCE_TOKEN_NAME, {
        getRepository: jest.fn().mockReturnValue({
          upsert: jest.fn(),
        }),
      });
      mockMap.set(IndexVersionService, {
        getIncrementalIndexVersions: jest.fn().mockReturnValue([
          {
            name: USER_RECENTLY_CREATED_INDEX_NAME,
          },
          {
            name: USER_SEARCH_V1_INDEX_NAME,
          },
        ]),
      });
      const module = await createMockedTestingModule(
        { providers: [OSIndexStateService] },
        mockMap
      );
      service = module.get<OSIndexStateService>(OSIndexStateService);
    });

    it('should call upsert with correct arguments', async () => {
      await service.recordIncrementalIndexRequest({
        entityId: 'entityId',
        entityName: 'UserEntity',
      });
      expect(service['connection'].getRepository).toHaveBeenCalledWith(
        UserEntityIndexState
      );
      expect(
        service['connection'].getRepository(UserEntityIndexState).upsert
      ).toHaveBeenCalledWith(
        {
          id: 'entityId',
          incrementalIndexState: IndexingState.READY,
          incrementalIndexRequests: {
            __typename: 'IndexRequestTuples',
            tuples: {
              [USER_RECENTLY_CREATED_INDEX_NAME]: [DEFAULT_INDEX_VERSION_ALIAS],
              [USER_SEARCH_V1_INDEX_NAME]: [DEFAULT_INDEX_VERSION_ALIAS],
            },
          },
        },
        {
          conflictPaths: ['id'],
        }
      );
    });
  });

  describe('recordReIndexRequest', () => {
    let service: OSIndexStateService;

    beforeEach(async () => {
      const mockMap: Map<InstanceToken, any> = new Map();
      mockMap.set(BI_CONN_INSTANCE_TOKEN_NAME, {
        getRepository: jest.fn().mockReturnValue({
          upsert: jest.fn(),
        }),
      });
      mockMap.set(IndexVersionService, {
        getIncrementalIndexVersions: jest.fn().mockReturnValue([
          {
            name: 'index1',
          },
        ]),
      });

      const module = await createMockedTestingModule(
        {
          providers: [OSIndexStateService],
        },
        mockMap
      );

      service = module.get<OSIndexStateService>(OSIndexStateService);
    });

    it('should perform an upsert for each entity in request', async () => {
      await service.recordReIndexRequest({
        entityIds: ['entityId1', 'entityId2'],
        entityName: 'UserEntity',
        requests: {
          indexAlias: 'post_search_v1',
        },
      });
      expect(service['connection'].getRepository).toHaveBeenCalledWith(
        UserEntityIndexState
      );
      expect(
        service['connection'].getRepository(UserEntityIndexState).upsert
      ).toHaveBeenCalledWith(
        [
          {
            id: 'entityId1',
            reIndexState: IndexingState.READY,
            reIndexRequests: {
              indexAlias: 'post_search_v1',
            },
          },
          {
            id: 'entityId2',
            reIndexState: IndexingState.READY,
            reIndexRequests: {
              indexAlias: 'post_search_v1',
            },
          },
        ],
        {
          conflictPaths: ['id'],
        }
      );
    });
  });

  describe('markIncrementalIndexComplete', () => {
    let service: OSIndexStateService;
    let indexStateRepo: Repository<UserEntityIndexState>;
    let manager: EntityManager;

    beforeEach(async () => {
      indexStateRepo = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'entityId1',
            incrementalIndexState: IndexingState.INDEXING,
            incrementalIndexRequests: {
              indexAlias: 'index1',
            },
            reIndexState: IndexingState.READY,
            reIndexRequests: {
              indexAlias: 'index1',
            },
            snapshot: {
              id: 'entityId1',
            },
          },
          {
            id: 'entityId2',
            incrementalIndexState: IndexingState.READY,
            snapshot: {
              id: 'entityId2',
            },
          },
        ]),
        upsert: jest.fn(),
      } as any;
      manager = {
        getRepository: jest.fn().mockReturnValue(indexStateRepo),
      } as any;

      const mockMap: Map<InstanceToken, any> = new Map();
      mockMap.set(BI_CONN_INSTANCE_TOKEN_NAME, {
        transaction: jest.fn().mockImplementation(cb => cb(manager)),
      });
      const module = await createMockedTestingModule(
        {
          providers: [OSIndexStateService],
        },
        mockMap
      );

      service = module.get<OSIndexStateService>(OSIndexStateService);
    });

    it(`should use the correct entity repository to perform the transaction`, async () => {
      await service.markIncrementalIndexComplete({
        snapshots: [
          {
            id: 'entityId1',
          },
          {
            id: 'entityId2',
          },
        ] as any,
        entityName: 'UserEntity',
      });

      expect(manager.getRepository).toHaveBeenCalledWith(UserEntityIndexState);
    });

    it(`should lock indexes with pessimistic write as to not overwrite concurrent re-request`, async () => {
      await service.markIncrementalIndexComplete({
        snapshots: [
          {
            id: 'entityId1',
          },
          {
            id: 'entityId2',
          } as any,
        ],
        entityName: 'UserEntity',
      });

      expect(indexStateRepo.find).toHaveBeenCalledWith({
        where: {
          id: In(['entityId1', 'entityId2']),
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });
    });

    it(`should only modify index state if it is not in READY state as to not overwrite re-request`, async () => {
      await service.markIncrementalIndexComplete({
        snapshots: [
          {
            id: 'entityId1',
          },
          {
            id: 'entityId2',
          },
        ] as any,
        entityName: 'UserEntity',
      });

      expect(indexStateRepo.upsert).toHaveBeenCalledWith(
        [
          {
            id: 'entityId1',
            incrementalIndexState: IndexingState.INDEXED,
            incrementalIndexRequests: {},
            reIndexState: IndexingState.READY,
            reIndexRequests: {
              indexAlias: 'index1',
            },
            snapshot: {
              id: 'entityId1',
            },
          },
          {
            id: 'entityId2',
            incrementalIndexState: IndexingState.READY,
            snapshot: {
              id: 'entityId2',
            },
          },
        ],
        {
          conflictPaths: ['id'],
        }
      );
    });

    it(`should update the snapshot of all entity index states`, async () => {
      await service.markIncrementalIndexComplete({
        snapshots: [
          {
            id: 'entityId1',
            property: 'value',
          },
          {
            id: 'entityId2',
            property: 'value',
          },
        ] as any,
        entityName: 'UserEntity',
      });

      expect(indexStateRepo.upsert).toHaveBeenCalledWith(
        [
          {
            id: 'entityId1',
            incrementalIndexState: IndexingState.INDEXED,
            incrementalIndexRequests: {},
            reIndexState: IndexingState.READY,
            reIndexRequests: {
              indexAlias: 'index1',
            },
            snapshot: {
              id: 'entityId1',
              property: 'value',
            },
          },
          {
            id: 'entityId2',
            incrementalIndexState: IndexingState.READY,
            snapshot: {
              id: 'entityId2',
              property: 'value',
            },
          },
        ],
        {
          conflictPaths: ['id'],
        }
      );
    });
  });

  describe('markReIndexComplete', () => {
    let service: OSIndexStateService;
    let indexStateRepo: Repository<UserEntityIndexState>;
    let manager: EntityManager;

    beforeEach(async () => {
      indexStateRepo = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'entityId1',
            incrementalIndexState: IndexingState.READY,
            incrementalIndexRequests: {
              indexAlias: 'index1',
            },
            reIndexState: IndexingState.INDEXING,
            reIndexRequests: {
              indexAlias: 'index1',
            },
            snapshot: {
              id: 'entityId1',
            },
          },
          {
            id: 'entityId2',
            reIndexState: IndexingState.READY,
            snapshot: {
              id: 'entityId2',
            },
          },
        ]),
        upsert: jest.fn(),
      } as any;
      manager = {
        getRepository: jest.fn().mockReturnValue(indexStateRepo),
      } as any;
      const mockMap: Map<InstanceToken, any> = new Map();
      mockMap.set(BI_CONN_INSTANCE_TOKEN_NAME, {
        transaction: jest.fn().mockImplementation(cb => cb(manager)),
      });
      const module = await createMockedTestingModule(
        {
          providers: [OSIndexStateService],
        },
        mockMap
      );

      service = module.get<OSIndexStateService>(OSIndexStateService);
    });

    it(`should use the correct entity repository to perform the transaction`, async () => {
      await service.markReIndexComplete({
        snapshots: [
          {
            id: 'entityId1',
          },
          {
            id: 'entityId2',
          },
        ] as any,
        entityName: 'UserEntity',
      });

      expect(manager.getRepository).toHaveBeenCalledWith(UserEntityIndexState);
    });

    it(`should lock indexes with pessimistic write as to not overwrite concurrent re-request`, async () => {
      await service.markReIndexComplete({
        snapshots: [
          {
            id: 'entityId1',
          },
          {
            id: 'entityId2',
          } as any,
        ],
        entityName: 'UserEntity',
      });

      expect(indexStateRepo.find).toHaveBeenCalledWith({
        where: {
          id: In(['entityId1', 'entityId2']),
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });
    });

    it(`should only modify index state if it is not in READY state as to not overwrite re-request`, async () => {
      await service.markReIndexComplete({
        snapshots: [
          {
            id: 'entityId1',
          },
          {
            id: 'entityId2',
          },
        ] as any,
        entityName: 'UserEntity',
      });

      expect(indexStateRepo.upsert).toHaveBeenCalledWith(
        [
          {
            id: 'entityId1',
            incrementalIndexState: IndexingState.READY,
            incrementalIndexRequests: {
              indexAlias: 'index1',
            },
            reIndexState: IndexingState.INDEXED,
            reIndexRequests: {},
            snapshot: {
              id: 'entityId1',
            },
          },
          {
            id: 'entityId2',
            reIndexState: IndexingState.READY,
            snapshot: {
              id: 'entityId2',
            },
          },
        ],
        {
          conflictPaths: ['id'],
        }
      );
    });

    it(`should update the snapshot of all entity index states`, async () => {
      await service.markReIndexComplete({
        snapshots: [
          {
            id: 'entityId1',
            property: 'value',
          },
          {
            id: 'entityId2',
            property: 'value',
          },
        ] as any,
        entityName: 'UserEntity',
      });

      expect(indexStateRepo.upsert).toHaveBeenCalledWith(
        [
          {
            id: 'entityId1',
            incrementalIndexState: IndexingState.READY,
            incrementalIndexRequests: {
              indexAlias: 'index1',
            },
            reIndexState: IndexingState.INDEXED,
            reIndexRequests: {},
            snapshot: {
              id: 'entityId1',
              property: 'value',
            },
          },
          {
            id: 'entityId2',
            reIndexState: IndexingState.READY,
            snapshot: {
              id: 'entityId2',
              property: 'value',
            },
          },
        ],
        {
          conflictPaths: ['id'],
        }
      );
    });
  });
});
