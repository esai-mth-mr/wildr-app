import { USER_SEARCH_V1_INDEX_NAME } from '@verdzie/server/open-search-v2/index-version/user-index-version.config';
import {
  RE_INDEX_BATCH_SIZE,
  OSReIndexCoordinatorService,
} from '@verdzie/server/open-search-v2/re-index-coordinator/re-index-coordinator.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntity } from '@verdzie/server/user/user.entity';
import * as sinon from 'sinon';
import { LessThanOrEqual } from 'typeorm';

describe('ReIndexCoordinatorService', () => {
  describe('batchIndex', () => {
    it('should retrieve batch of entities using cursor to determine start location', async () => {
      const module = await createMockedTestingModule({
        providers: [OSReIndexCoordinatorService],
      });
      const service = module.get<OSReIndexCoordinatorService>(
        OSReIndexCoordinatorService
      );
      const entityRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      service['connection'].getRepository = jest
        .fn()
        .mockReturnValue(entityRepository);
      const clock = sinon.useFakeTimers(); // Stop clock for date comparison
      await service.batchIndex({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index-alias',
      });
      expect(service['connection'].getRepository).toHaveBeenCalledWith(
        UserEntity
      );
      expect(entityRepository.find).toHaveBeenCalledWith({
        select: ['id', 'createdAt'],
        where: {
          createdAt: LessThanOrEqual(new Date()),
        },
        order: {
          createdAt: 'DESC',
        },
        take: RE_INDEX_BATCH_SIZE,
      });
      clock.restore();
    });

    it('should use date from cursor as start location if provided', async () => {
      const module = await createMockedTestingModule({
        providers: [OSReIndexCoordinatorService],
      });
      const service = module.get<OSReIndexCoordinatorService>(
        OSReIndexCoordinatorService
      );
      const entityRepository = {
        find: jest.fn().mockResolvedValue([]),
      };
      service['connection'].getRepository = jest
        .fn()
        .mockReturnValue(entityRepository);

      await service.batchIndex({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index-alias',
        cursor: {
          createdAt: new Date(100),
        } as any,
      });

      expect(service['connection'].getRepository).toHaveBeenCalledWith(
        UserEntity
      );
      expect(entityRepository.find).toHaveBeenCalledWith({
        select: ['id', 'createdAt'],
        where: {
          createdAt: LessThanOrEqual(new Date(100)),
        },
        order: {
          createdAt: 'DESC',
        },
        take: RE_INDEX_BATCH_SIZE,
      });
    });

    it('should return if there are no remaining entities', async () => {
      const module = await createMockedTestingModule({
        providers: [OSReIndexCoordinatorService],
      });
      const service = module.get<OSReIndexCoordinatorService>(
        OSReIndexCoordinatorService
      );
      const entityRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: '1', // Cursor should be filtered
            createdAt: new Date(100),
          },
        ]),
      };
      service['connection'].getRepository = jest
        .fn()
        .mockReturnValue(entityRepository);
      await service.batchIndex({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index-alias',
        cursor: {
          id: '1',
          createdAt: new Date(100),
        } as any,
      });
      expect(
        service['reIndexStateProducer'].requestReIndex
      ).not.toHaveBeenCalled();
      expect(
        service['reIndexCoordinatorProducer'].reIndex
      ).not.toHaveBeenCalled();
    });

    it('should return if there are no remaining entities', async () => {
      const module = await createMockedTestingModule({
        providers: [OSReIndexCoordinatorService],
      });
      const service = module.get<OSReIndexCoordinatorService>(
        OSReIndexCoordinatorService
      );
      const entityRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: '1', // Cursor should be filtered
            createdAt: new Date(100),
          },
        ]),
      };
      service['connection'].getRepository = jest
        .fn()
        .mockReturnValue(entityRepository);
      await service.batchIndex({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index-alias',
        cursor: {
          id: '1',
          createdAt: new Date(100),
        } as any,
      });
      expect(
        service['reIndexStateProducer'].requestReIndex
      ).not.toHaveBeenCalled();
      expect(
        service['reIndexCoordinatorProducer'].reIndex
      ).not.toHaveBeenCalled();
    });

    it('should create requestReIndex job for each entity in batch except cursor', async () => {
      const module = await createMockedTestingModule({
        providers: [OSReIndexCoordinatorService],
      });
      const service = module.get<OSReIndexCoordinatorService>(
        OSReIndexCoordinatorService
      );
      const entityRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: '1', // Cursor should be filtered
            createdAt: new Date(100),
          },
          {
            id: '2',
            createdAt: new Date(50),
          },
          {
            id: '3',
            createdAt: new Date(25),
          },
        ]),
      };
      service['connection'].getRepository = jest
        .fn()
        .mockReturnValue(entityRepository);
      await service.batchIndex({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index-alias',
        cursor: {
          id: '1',
          createdAt: new Date(100),
        } as any,
      });
      expect(
        service['reIndexStateProducer'].requestReIndex
      ).toHaveBeenCalledWith({
        entityIds: ['2', '3'],
        entityName: 'UserEntity',
        requests: {
          'index-alias': USER_SEARCH_V1_INDEX_NAME,
        },
      });
    });

    it('should create a job for the next batch', async () => {
      const module = await createMockedTestingModule({
        providers: [OSReIndexCoordinatorService],
      });
      const service = module.get<OSReIndexCoordinatorService>(
        OSReIndexCoordinatorService
      );
      const entityRepository = {
        find: jest.fn().mockResolvedValue([
          {
            id: '1', // Cursor should be filtered
            createdAt: new Date(100),
          },
          {
            id: '2',
            createdAt: new Date(50),
          },
        ]),
      };
      service['connection'].getRepository = jest
        .fn()
        .mockReturnValue(entityRepository);
      await service.batchIndex({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index-alias',
        cursor: {
          id: '1',
          createdAt: new Date(100),
        } as any,
      });
      expect(
        service['reIndexCoordinatorProducer'].reIndex
      ).toHaveBeenCalledWith({
        entityName: 'UserEntity',
        indexVersionName: USER_SEARCH_V1_INDEX_NAME,
        indexVersionAlias: 'index-alias',
        cursor: {
          id: '2',
          createdAt: new Date(50),
        },
      });
    });
  });
});
