import { IndexingState } from '@verdzie/server/open-search-v2/index-state/index-state.service';
import { UserEntityIndexState } from '@verdzie/server/open-search-v2/index-state/user-entity/user-entity-index-state.entity.bi';
import { IndexableEntityName } from '@verdzie/server/open-search-v2/index-version/index-version.service';
import {
  INDEXING_JOB_BATCH_SIZE,
  OSIndexingAggregatorService,
} from '@verdzie/server/open-search-v2/indexing-aggregator/indexing-aggregator.service';
import { IndexingJobType } from '@verdzie/server/open-search-v2/indexing/indexing.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { In } from 'typeorm';

describe('IndexingAggregatorService', () => {
  describe('createAggregatedJobs', () => {
    it('should create a pessimistic write lock on state records that are READY for incremental index', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingAggregatorService],
      });
      const service = module.get(OSIndexingAggregatorService);
      const entityName: IndexableEntityName = 'UserEntity';
      const indexingJobType: IndexingJobType =
        IndexingJobType.INCREMENTAL_INDEX;
      const entityStateRepository = {
        find: jest.fn().mockReturnValue([
          {
            id: 1,
            incrementalIndexRequests: {
              alias_1: 'user_search_v5',
            },
          },
        ]),
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue(entityStateRepository),
      };
      service['connection'].transaction = jest
        .fn()
        .mockImplementation(async callback => {
          await callback(manager);
        });
      service['indexingServiceProducer'].index = jest.fn();

      await service.createAggregatedJobs(entityName, indexingJobType);

      expect(manager.getRepository).toHaveBeenCalledWith(UserEntityIndexState);
      expect(entityStateRepository.find).toHaveBeenCalledWith({
        select: ['id', 'incrementalIndexRequests'],
        where: { incrementalIndexState: IndexingState.READY },
        lock: { mode: 'pessimistic_write' },
        take: INDEXING_JOB_BATCH_SIZE * 20,
      });
    });

    it('should create a pessimistic write lock on state records that are READY for re-index', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingAggregatorService],
      });
      const service = module.get(OSIndexingAggregatorService);
      const entityName: IndexableEntityName = 'UserEntity';
      const indexingJobType: IndexingJobType = IndexingJobType.RE_INDEX;
      const entityStateRepository = {
        find: jest.fn().mockReturnValue([
          {
            id: 1,
            reIndexRequests: {
              alias_1: 'user_search_v5',
            },
          },
        ]),
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue(entityStateRepository),
      };
      service['connection'].transaction = jest
        .fn()
        .mockImplementation(async callback => {
          await callback(manager);
        });
      service['indexingServiceProducer'].index = jest.fn();

      await service.createAggregatedJobs(entityName, indexingJobType);

      expect(manager.getRepository).toHaveBeenCalledWith(UserEntityIndexState);
      expect(entityStateRepository.find).toHaveBeenCalledWith({
        select: ['id', 'reIndexRequests'],
        where: { reIndexState: IndexingState.READY },
        lock: { mode: 'pessimistic_write' },
        take: INDEXING_JOB_BATCH_SIZE * 20,
      });
    });

    it('should return if no state records are READY for index', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingAggregatorService],
      });
      const service = module.get(OSIndexingAggregatorService);
      const entityName: IndexableEntityName = 'UserEntity';
      const indexingJobType: IndexingJobType = IndexingJobType.RE_INDEX;
      const entityStateRepository = {
        find: jest.fn().mockReturnValue([]),
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue(entityStateRepository),
      };
      service['connection'].transaction = jest
        .fn()
        .mockImplementation(async callback => {
          await callback(manager);
        });
      service['indexingServiceProducer'].index = jest.fn();

      await service.createAggregatedJobs(entityName, indexingJobType);

      expect(manager.getRepository).toHaveBeenCalledWith(UserEntityIndexState);
      expect(entityStateRepository.find).toHaveBeenCalledWith({
        select: ['id', 'reIndexRequests'],
        where: { reIndexState: IndexingState.READY },
        lock: { mode: 'pessimistic_write' },
        take: INDEXING_JOB_BATCH_SIZE * 20,
      });
      expect(service['indexingServiceProducer'].index).not.toHaveBeenCalled();
      expect(entityStateRepository.update).not.toHaveBeenCalled();
    });

    it('should create jobs for IndexingService', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingAggregatorService],
      });
      const service = module.get(OSIndexingAggregatorService);
      const entityName: IndexableEntityName = 'UserEntity';
      const indexingJobType: IndexingJobType = IndexingJobType.RE_INDEX;
      const entityStateRepository = {
        find: jest.fn().mockReturnValue([
          {
            id: 1,
            reIndexRequests: {
              alias_1: 'user_search_v5',
              alias_2: 'user_search_v6',
            },
          },
        ]),
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue(entityStateRepository),
      };
      service['connection'].transaction = jest
        .fn()
        .mockImplementation(async callback => {
          await callback(manager);
        });
      service['indexingServiceProducer'].index = jest.fn();

      await service.createAggregatedJobs(entityName, indexingJobType);

      expect(service['indexingServiceProducer'].index).toHaveBeenCalledWith({
        entityName,
        jobType: indexingJobType,
        requests: [
          {
            id: 1,
            requests: {
              alias_1: 'user_search_v5',
              alias_2: 'user_search_v6',
            },
          },
        ],
      });
    });

    it('should split the jobs into batches', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingAggregatorService],
      });
      const service = module.get(OSIndexingAggregatorService);
      const entityName: IndexableEntityName = 'UserEntity';
      const indexingJobType: IndexingJobType = IndexingJobType.RE_INDEX;
      const stateRecords = Array.from({ length: 300 }).map((_, index) => ({
        id: index + 1,
        reIndexRequests: {
          alias_1: 'user_search_v5',
        },
      }));
      const entityStateRepository = {
        find: jest.fn().mockReturnValue(stateRecords),
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue(entityStateRepository),
      };
      service['connection'].transaction = jest
        .fn()
        .mockImplementation(async callback => {
          await callback(manager);
        });
      service['indexingServiceProducer'].index = jest.fn();

      await service.createAggregatedJobs(entityName, indexingJobType);

      expect(service['indexingServiceProducer'].index).toHaveBeenCalledTimes(
        Math.ceil(stateRecords.length / INDEXING_JOB_BATCH_SIZE)
      );
      // @ts-ignore
      const calls = service['indexingServiceProducer'].index.mock.calls;
      expect(calls[0][0].requests.length).toEqual(INDEXING_JOB_BATCH_SIZE);
      expect(calls[1][0].requests.length).toEqual(INDEXING_JOB_BATCH_SIZE);
      expect(calls[0][0].requests[0]).toEqual({
        id: 1,
        requests: {
          alias_1: 'user_search_v5',
        },
      });
      expect(calls[1][0].requests[0]).toEqual({
        id: INDEXING_JOB_BATCH_SIZE + 1,
        requests: {
          alias_1: 'user_search_v5',
        },
      });
    });

    it('should update the state records to incrementalIndexState to INDEXING', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingAggregatorService],
      });
      const service = module.get(OSIndexingAggregatorService);
      const entityName: IndexableEntityName = 'UserEntity';
      const indexingJobType: IndexingJobType =
        IndexingJobType.INCREMENTAL_INDEX;
      const stateRecords = Array.from({ length: 1 }).map((_, index) => ({
        id: index + 1,
        incrementalIndexRequests: {
          alias_1: 'user_search_v5',
        },
      }));
      const entityStateRepository = {
        find: jest.fn().mockReturnValue(stateRecords),
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue(entityStateRepository),
      };
      service['connection'].transaction = jest
        .fn()
        .mockImplementation(async callback => {
          await callback(manager);
        });
      service['indexingServiceProducer'].index = jest.fn();

      await service.createAggregatedJobs(entityName, indexingJobType);

      expect(entityStateRepository.update).toHaveBeenCalledTimes(1);
      expect(entityStateRepository.update).toHaveBeenCalledWith(
        {
          id: In(stateRecords.map(record => record.id)),
        },
        {
          incrementalIndexState: IndexingState.INDEXING,
        }
      );
    });

    it('should update the state records to reIndexState to INDEXING', async () => {
      const module = await createMockedTestingModule({
        providers: [OSIndexingAggregatorService],
      });
      const service = module.get(OSIndexingAggregatorService);
      const entityName: IndexableEntityName = 'UserEntity';
      const indexingJobType: IndexingJobType = IndexingJobType.RE_INDEX;
      const stateRecords = Array.from({ length: 1 }).map((_, index) => ({
        id: index + 1,
        reIndexRequests: {
          alias_1: 'user_search_v5',
        },
      }));
      const entityStateRepository = {
        find: jest.fn().mockReturnValue(stateRecords),
        update: jest.fn(),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue(entityStateRepository),
      };
      service['connection'].transaction = jest
        .fn()
        .mockImplementation(async callback => {
          await callback(manager);
        });
      service['indexingServiceProducer'].index = jest.fn();

      await service.createAggregatedJobs(entityName, indexingJobType);

      expect(entityStateRepository.update).toHaveBeenCalledTimes(1);
      expect(entityStateRepository.update).toHaveBeenCalledWith(
        {
          id: In(stateRecords.map(record => record.id)),
        },
        {
          reIndexState: IndexingState.INDEXING,
        }
      );
    });
  });
});
