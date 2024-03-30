import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import {
  IndexingJobType,
  IndexingRequest,
  OSIndexingService,
} from './indexing.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@verdzie/server/exceptions/wildr.exception';
import {
  USER_RECENTLY_CREATED_INDEX_NAME,
  USER_SEARCH_V1_INDEX_NAME,
} from '@verdzie/server/open-search-v2/index-version/user-index-version.config';
import { IndexRequestTuples } from '@verdzie/server/open-search-v2/index-state/index-state.service';

describe('IndexingService', () => {
  describe('indexMany', () => {
    it('should retrieve snapshots for each entity', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest.fn().mockResolvedValue({
        id: '1',
        data: 'data',
      });
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({ data: 'data' }),
      } as any;
      service['incrementalIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const requests: IndexingRequest[] = [
        {
          id: '1',
          requests: {
            alias_1: USER_SEARCH_V1_INDEX_NAME,
            alias_2: USER_RECENTLY_CREATED_INDEX_NAME,
          },
        },
      ];
      await service.indexMany(
        entityName,
        requests,
        IndexingJobType.INCREMENTAL_INDEX
      );
      expect(service['indexVersionService'].getSnapshot).toHaveBeenCalledWith(
        UserEntity,
        '1'
      );
    });

    it('should retrieve snapshots for each entity in tuples', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest.fn().mockResolvedValue({
        id: '1',
        data: 'data',
      });
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({ data: 'data' }),
      } as any;
      service['incrementalIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const tuples: IndexRequestTuples = {
        __typename: 'IndexRequestTuples',
        tuples: {
          [USER_RECENTLY_CREATED_INDEX_NAME]: ['1'],
        },
      };
      const requests: IndexingRequest[] = [
        {
          id: '1',
          requests: tuples,
        },
      ];
      await service.indexMany(
        entityName,
        requests,
        IndexingJobType.INCREMENTAL_INDEX
      );
      expect(service['indexVersionService'].getSnapshot).toHaveBeenCalledWith(
        UserEntity,
        '1'
      );
    });

    it('should update the WAL with each index update', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest
        .fn()
        .mockImplementation((a, id) => {
          return {
            id,
            data: 'data',
          };
        });
      service['indexVersionService'].getOSDoc = jest
        .fn()
        .mockImplementation(doc => doc);
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({ data: 'data' }),
      } as any;
      service['incrementalIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const requests: IndexingRequest[] = [
        {
          id: '1',
          requests: {
            alias_1: USER_SEARCH_V1_INDEX_NAME,
            alias_2: USER_RECENTLY_CREATED_INDEX_NAME,
          },
        },
      ];
      await service.indexMany(
        entityName,
        requests,
        IndexingJobType.INCREMENTAL_INDEX
      );
      expect(
        service['indexWALService'].logEntityIndexUpdates
      ).toHaveBeenCalledWith([
        {
          indexAlias: 'alias_1',
          indexVersion: USER_SEARCH_V1_INDEX_NAME,
          entitySnapshot: {
            id: '1',
            data: 'data',
          },
        },
        {
          indexAlias: 'alias_2',
          indexVersion: USER_RECENTLY_CREATED_INDEX_NAME,
          entitySnapshot: {
            id: '1',
            data: 'data',
          },
        },
      ]);
    });

    it('should update the WAL with each index update in tuples', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest
        .fn()
        .mockImplementation((a, id) => {
          return {
            id,
            data: 'data',
          };
        });
      service['indexVersionService'].getOSDoc = jest
        .fn()
        .mockImplementation(doc => doc);
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({ data: 'data' }),
      } as any;
      service['incrementalIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const tuples1: IndexRequestTuples = {
        __typename: 'IndexRequestTuples',
        tuples: {
          [USER_RECENTLY_CREATED_INDEX_NAME]: ['alias_1'],
        },
      };
      const tuples2: IndexRequestTuples = {
        __typename: 'IndexRequestTuples',
        tuples: {
          [USER_SEARCH_V1_INDEX_NAME]: ['alias_1', 'alias_3'],
        },
      };
      const requests: IndexingRequest[] = [
        {
          id: '1',
          requests: tuples1,
        },
        {
          id: '1',
          requests: tuples2,
        },
      ];
      await service.indexMany(
        entityName,
        requests,
        IndexingJobType.INCREMENTAL_INDEX
      );
      expect(
        service['indexWALService'].logEntityIndexUpdates
      ).toHaveBeenCalledWith([
        {
          indexAlias: 'alias_1',
          indexVersion: USER_RECENTLY_CREATED_INDEX_NAME,
          entitySnapshot: {
            id: '1',
            data: 'data',
          },
        },
        {
          indexAlias: 'alias_1',
          indexVersion: USER_SEARCH_V1_INDEX_NAME,
          entitySnapshot: {
            id: '1',
            data: 'data',
          },
        },
        {
          indexAlias: 'alias_3',
          indexVersion: USER_SEARCH_V1_INDEX_NAME,
          entitySnapshot: {
            id: '1',
            data: 'data',
          },
        },
      ]);
    });

    it('should omit index updates that do not have an os doc', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest.fn().mockResolvedValue({
        id: '2',
        data: 'data',
      });
      service['indexVersionService'].getOSDoc = jest
        .fn()
        .mockImplementation((a, b, doc) => {
          if (doc.id !== '2') return doc;
        });
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({ data: 'data' }),
      } as any;
      service['incrementalIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const requests: IndexingRequest[] = [
        {
          id: '2',
          requests: {
            alias_1: USER_SEARCH_V1_INDEX_NAME,
          },
        },
      ];
      await service.indexMany(
        entityName,
        requests,
        IndexingJobType.INCREMENTAL_INDEX
      );
      expect(
        service['indexWALService'].logEntityIndexUpdates
      ).toHaveBeenCalledWith([]);
    });

    it('should send a bulk update request to open search', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest.fn().mockResolvedValue({
        id: '1',
        data: 'data',
      });
      service['indexVersionService'].getOSDoc = jest
        .fn()
        // @ts-ignore
        .mockImplementation((...args) => {
          return args[2];
        });
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({ data: 'data' }),
      } as any;
      service['incrementalIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const requests: IndexingRequest[] = [
        {
          id: '1',
          requests: {
            alias_1: USER_SEARCH_V1_INDEX_NAME,
            alias_2: USER_SEARCH_V1_INDEX_NAME,
          },
        },
      ];
      await service.indexMany(
        entityName,
        requests,
        IndexingJobType.INCREMENTAL_INDEX
      );
      const payload =
        `\n{"index":{"_index":"${USER_SEARCH_V1_INDEX_NAME}_alias_1","_id":"1"}}\n` +
        `{"id":"1","data":"data"}\n` +
        `{"index":{"_index":"${USER_SEARCH_V1_INDEX_NAME}_alias_2","_id":"1"}}\n` +
        `{"id":"1","data":"data"}\n`;
      expect(service['openSearchClient'].client.post).toHaveBeenCalledWith(
        '_bulk',
        payload,
        { headers: { 'Content-Type': 'application/x-ndjson' } }
      );
    });

    it('should send a bulk update request to open search from tuples', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest.fn().mockResolvedValue({
        id: '1',
        data: 'data',
      });
      service['indexVersionService'].getOSDoc = jest
        .fn()
        // @ts-ignore
        .mockImplementation((...args) => {
          return args[2];
        });
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({ data: 'data' }),
      } as any;
      service['incrementalIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const tuples1: IndexRequestTuples = {
        __typename: 'IndexRequestTuples',
        tuples: {
          [USER_SEARCH_V1_INDEX_NAME]: ['alias_1', 'alias_2'],
        },
      };
      const requests: IndexingRequest[] = [
        {
          id: '1',
          requests: tuples1,
        },
      ];
      await service.indexMany(
        entityName,
        requests,
        IndexingJobType.INCREMENTAL_INDEX
      );
      const payload =
        `\n{"index":{"_index":"${USER_SEARCH_V1_INDEX_NAME}_alias_1","_id":"1"}}\n` +
        `{"id":"1","data":"data"}\n` +
        `{"index":{"_index":"${USER_SEARCH_V1_INDEX_NAME}_alias_2","_id":"1"}}\n` +
        `{"id":"1","data":"data"}\n`;
      expect(service['openSearchClient'].client.post).toHaveBeenCalledWith(
        '_bulk',
        payload,
        { headers: { 'Content-Type': 'application/x-ndjson' } }
      );
    });

    it('should omit updates without os doc from bulk update', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest
        .fn()
        .mockImplementation((a, id) => {
          return {
            id,
            data: 'data',
          };
        });
      service['indexVersionService'].getOSDoc = jest
        .fn()
        // @ts-ignore
        .mockImplementation((...args) => {
          if (args[2].id === '1' && args[1] === USER_SEARCH_V1_INDEX_NAME)
            return args[2];
        });
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({ data: 'data' }),
      } as any;
      service['incrementalIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const requests: IndexingRequest[] = [
        {
          id: '1',
          requests: {
            alias_1: USER_SEARCH_V1_INDEX_NAME,
            alias_2: USER_RECENTLY_CREATED_INDEX_NAME, // Omitted
          },
        },
      ];
      await service.indexMany(
        entityName,
        requests,
        IndexingJobType.INCREMENTAL_INDEX
      );
      const payload =
        `\n{"index":{"_index":"${USER_SEARCH_V1_INDEX_NAME}_alias_1","_id":"1"}}\n` +
        `{"id":"1","data":"data"}\n`;
      expect(service['openSearchClient'].client.post).toHaveBeenCalledWith(
        '_bulk',
        payload,
        { headers: { 'Content-Type': 'application/x-ndjson' } }
      );
    });

    it('should omit updates without os doc from bulk update with tuples', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest
        .fn()
        .mockImplementation((a, id) => {
          return {
            id,
            data: 'data',
          };
        });
      service['indexVersionService'].getOSDoc = jest
        .fn()
        // @ts-ignore
        .mockImplementation((...args) => {
          if (args[2].id === '1' && args[1] === USER_SEARCH_V1_INDEX_NAME)
            return args[2];
        });
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({ data: 'data' }),
      } as any;
      service['incrementalIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const tuples: IndexRequestTuples = {
        __typename: 'IndexRequestTuples',
        tuples: {
          [USER_SEARCH_V1_INDEX_NAME]: ['alias_1'],
          [USER_RECENTLY_CREATED_INDEX_NAME]: ['alias_1'], // Omitted
        },
      };
      const requests: IndexingRequest[] = [
        {
          id: '1',
          requests: tuples,
        },
      ];
      await service.indexMany(
        entityName,
        requests,
        IndexingJobType.INCREMENTAL_INDEX
      );
      const payload =
        `\n{"index":{"_index":"${USER_SEARCH_V1_INDEX_NAME}_alias_1","_id":"1"}}\n` +
        `{"id":"1","data":"data"}\n`;
      expect(service['openSearchClient'].client.post).toHaveBeenCalledWith(
        '_bulk',
        payload,
        { headers: { 'Content-Type': 'application/x-ndjson' } }
      );
    });

    it('should not send empty bulk update to open search', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest
        .fn()
        .mockImplementation((a, id) => {
          return {
            id,
            data: 'data',
          };
        });
      service['indexVersionService'].getOSDoc = jest
        .fn()
        // @ts-ignore
        .mockImplementation((...args) => {
          return undefined;
        });
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({ data: 'data' }),
      } as any;
      service['incrementalIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const tuples: IndexRequestTuples = {
        __typename: 'IndexRequestTuples',
        tuples: {
          [USER_SEARCH_V1_INDEX_NAME]: ['alias_1'],
          [USER_RECENTLY_CREATED_INDEX_NAME]: ['alias_1'], // Omitted
        },
      };
      const requests: IndexingRequest[] = [
        {
          id: '1',
          requests: tuples,
        },
      ];
      await service.indexMany(
        entityName,
        requests,
        IndexingJobType.INCREMENTAL_INDEX
      );
      expect(service['openSearchClient'].client.post).not.toHaveBeenCalled();
    });

    it('should throw if the bulk update returns open search errors', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest.fn().mockResolvedValue({
        id: '1',
        data: 'data',
      });
      service['indexVersionService'].getOSDoc = jest
        .fn()
        // @ts-ignore
        .mockImplementation((...args) => {
          return args[2];
        });
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: {
            errors: true,
            items: [
              {
                index: {
                  error: {
                    reason: 'reason',
                  },
                },
              },
            ],
          },
        }),
      } as any;
      service['incrementalIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const requests: IndexingRequest[] = [
        {
          id: '1',
          requests: {
            alias_1: USER_SEARCH_V1_INDEX_NAME,
            alias_2: USER_SEARCH_V1_INDEX_NAME,
          },
        },
      ];
      try {
        await service.indexMany(
          entityName,
          requests,
          IndexingJobType.INCREMENTAL_INDEX
        );
        throw new Error('should not reach here');
      } catch (err) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
      }
      expect(
        service['incrementalIndexStateProducer'].markIncrementalIndexComplete
      ).not.toHaveBeenCalled();
      expect(
        service['reIndexStateProducer'].markReIndexComplete
      ).not.toHaveBeenCalled();
    });

    it('should create job to mark incremental index updates as complete', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest.fn().mockResolvedValue({
        id: '1',
        data: 'data',
      });
      service['indexVersionService'].getOSDoc = jest
        .fn()
        // @ts-ignore
        .mockImplementation((...args) => {
          return args[2];
        });
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: 'data',
        }),
      } as any;
      service['incrementalIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const requests: IndexingRequest[] = [
        {
          id: '1',
          requests: {
            alias_1: USER_SEARCH_V1_INDEX_NAME,
            alias_2: USER_SEARCH_V1_INDEX_NAME,
          },
        },
      ];
      await service.indexMany(
        entityName,
        requests,
        IndexingJobType.INCREMENTAL_INDEX
      );
      expect(
        service['incrementalIndexStateProducer'].markIncrementalIndexComplete
      ).toHaveBeenCalledWith({
        entityName: 'UserEntity',
        snapshots: [
          {
            id: '1',
            data: 'data',
          },
        ],
      });
    });

    it('should create job to mark re-index updates as complete', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].getSnapshot = jest.fn().mockResolvedValue({
        id: '1',
        data: 'data',
      });
      service['indexVersionService'].getOSDoc = jest
        .fn()
        // @ts-ignore
        .mockImplementation((...args) => {
          return args[2];
        });
      service['openSearchClient'].client = {
        post: jest.fn().mockResolvedValue({
          data: 'data',
        }),
      } as any;
      service['reIndexStateProducer'].produce = jest.fn();
      const entityName = 'UserEntity';
      const requests: IndexingRequest[] = [
        {
          id: '1',
          requests: {
            alias_1: USER_SEARCH_V1_INDEX_NAME,
            alias_2: USER_SEARCH_V1_INDEX_NAME,
          },
        },
      ];
      await service.indexMany(entityName, requests, IndexingJobType.RE_INDEX);
      expect(
        service['reIndexStateProducer'].markReIndexComplete
      ).toHaveBeenCalledWith({
        entityName: 'UserEntity',
        snapshots: [
          {
            id: '1',
            data: 'data',
          },
        ],
      });
    });
  });

  describe('createMapping', () => {
    it('should throw if an index version with the given name is not found', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].findIndexVersions = jest
        .fn()
        .mockResolvedValue(undefined);
      try {
        await service.upsertMapping({
          indexVersionName: USER_SEARCH_V1_INDEX_NAME,
          entityName: 'UserEntity',
          indexVersionAlias: 'index_version_alias',
        });
        throw new Error('should not reach here');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
      }
      expect(
        service['indexVersionService'].findIndexVersions
      ).toHaveBeenCalledWith(UserEntity, [USER_SEARCH_V1_INDEX_NAME]);
    });

    it('should create mapping for the given index version if it does not exist', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].findIndexVersions = jest
        .fn()
        .mockReturnValue([
          {
            name: 'index_version_1',
            getMapping: jest.fn().mockReturnValue({
              mappings: {
                properties: {
                  name: {
                    type: 'text',
                  },
                },
              },
            }),
          },
        ]);
      service['openSearchClient'].client = {
        put: jest.fn(),
        get: jest.fn().mockResolvedValue({
          data: {
            index_version_2_index_version_alias: {},
          },
        }),
      } as any;
      await service.upsertMapping({
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        entityName: 'UserEntity',
        indexVersionAlias: 'index_version_alias',
      });
      expect(service['openSearchClient'].client.put).toHaveBeenCalledWith(
        `/${USER_SEARCH_V1_INDEX_NAME}_index_version_alias`,
        {
          mappings: {
            properties: {
              name: {
                type: 'text',
              },
            },
          },
        }
      );
    });

    it('should throw if mapping creation fails', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingService],
      });
      const service = module.get(OSIndexingService);
      service['indexVersionService'].findIndexVersions = jest
        .fn()
        .mockReturnValue([
          {
            name: USER_SEARCH_V1_INDEX_NAME,
            getMapping: jest.fn().mockReturnValue({
              mappings: {
                properties: {
                  name: {
                    type: 'text',
                  },
                },
              },
            }),
          },
        ]);
      service['openSearchClient'].client = {
        put: jest.fn().mockRejectedValue(new Error('error')),
      } as any;
      try {
        await service.upsertMapping({
          indexVersionName: USER_SEARCH_V1_INDEX_NAME,
          entityName: 'UserEntity',
          indexVersionAlias: 'index_version_alias',
        });
        throw new Error('should not reach here');
      } catch (err) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });
});
