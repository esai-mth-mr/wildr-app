import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  PageNotFoundError,
  upsertPageNumberToId,
} from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { QueryFailedError, Repository } from 'typeorm';
import { FeedEntity, FeedEntityType } from './feed.entity';
import { FeedService, PaginateFeedResponse, toFeedId } from './feed.service';
import { FeedEntityFake } from './testing/feed-entity.fake';
import _ from 'lodash';
import { POSTGRES_UNIQUE_VIOLATION_CODE } from '@verdzie/server/typeorm/postgres-driver.constants';

describe('FeedService', () => {
  let module: TestingModule;
  let service: FeedService;
  let repo: jest.Mocked<Repository<FeedEntity>>;

  beforeEach(async () => {
    jest.useFakeTimers();
    repo = {
      findOne: jest.fn(),
      insert: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    } as any;
    module = await createMockedTestingModule({
      providers: [
        FeedService,
        {
          provide: getRepositoryToken(FeedEntity),
          useValue: repo,
        },
      ],
    });
    service = module.get<FeedService>(FeedService);
  });

  describe('findIndex', () => {
    it('should return the index of an entry', async () => {
      service['common'].indexOfEntry = jest.fn().mockResolvedValue({
        index: 1,
      });

      const result = await service.findIndex('entity-id', 'entry-id');

      expect(result).toBe(1);

      expect(service['common'].indexOfEntry).toHaveBeenCalledWith({
        entityId: 'entity-id',
        entryToFind: 'entry-id',
        repo,
      });
    });

    it('should return -1 if entry does not exist', async () => {
      service['common'].indexOfEntry = jest.fn().mockResolvedValue({
        index: -1,
      });

      const result = await service.findIndex('entity-id', 'entry-id');

      expect(result).toBe(-1);
    });

    it('should return -1 and debug log if the feed is not found', async () => {
      service['common'].indexOfEntry = jest
        .fn()
        .mockRejectedValue(new PageNotFoundError());
      service['logger'].debug = jest.fn();

      const result = await service.findIndex('entity-id', 'entry-id');

      expect(result).toBe(-1);
    });

    it('should return -1 and error log if the feed find throws an unexpected error', async () => {
      service['common'].indexOfEntry = jest.fn().mockRejectedValue(new Error());
      service['logger'].error = jest.fn();

      const result = await service.findIndex('entity-id', 'entry-id');

      expect(result).toBe(-1);
    });
  });

  describe('createIfNotExists', () => {
    it('should create feed if it does not exist', async () => {
      repo.findOne = jest.fn().mockResolvedValue(undefined);
      repo.insert = jest.fn().mockResolvedValue(new FeedEntity());

      const result = await service.createIfNotExists('test-id');

      expect(result).toBeInstanceOf(FeedEntity);
      expect(repo.findOne).toHaveBeenCalledWith('test-id', undefined);
      expect(repo.findOne).toHaveBeenCalledTimes(1);
      expect(repo.insert).toHaveBeenCalledTimes(1);
    });

    it('should return feed if it exists', async () => {
      const existingFeed = FeedEntityFake();
      existingFeed.id = 'test-id';
      service.repo.findOne = jest.fn().mockResolvedValue(existingFeed);
      service.repo.insert = jest.fn();

      const result = await service.createIfNotExists('test-id');

      expect(result).toBe(existingFeed);
      expect(repo.findOne).toHaveBeenCalledWith('test-id', undefined);
      expect(repo.findOne).toHaveBeenCalledTimes(1);
      expect(repo.insert).toHaveBeenCalledTimes(0);
    });

    it('should catch and ignore unique constraint error', async () => {
      const newFeed = FeedEntityFake();
      newFeed.id = 'test-id';
      service.repo.findOne = jest.fn().mockResolvedValue(undefined);
      service.repo.insert = jest.fn().mockRejectedValue(
        new QueryFailedError('test', [], {
          code: POSTGRES_UNIQUE_VIOLATION_CODE,
        })
      );
      service.repo.findOneOrFail = jest.fn().mockResolvedValue(newFeed);

      const result = await service.createIfNotExists('test-id');

      expect(result).toBe(newFeed);
      expect(repo.findOne).toHaveBeenCalledWith('test-id', undefined);
      expect(repo.findOne).toHaveBeenCalledTimes(1);
      expect(repo.insert).toHaveBeenCalledTimes(1);
    });

    it('should throw error if not unique constraint error', async () => {
      repo.findOne = jest.fn().mockResolvedValue(undefined);
      repo.insert = jest.fn().mockRejectedValue(new Error('test'));

      await expect(service.createIfNotExists('test-id')).rejects.toThrow(
        'test'
      );

      expect(repo.findOne).toHaveBeenCalledWith('test-id', undefined);
      expect(repo.findOne).toHaveBeenCalledTimes(1);
      expect(repo.insert).toHaveBeenCalledTimes(1);
    });

    it('should use tx repo if passed', async () => {
      const existingFeed = FeedEntityFake();
      existingFeed.id = 'test-id';
      const repo = {
        findOne: jest.fn().mockResolvedValue(existingFeed),
        insert: jest.fn(),
      } as any;

      const result = await service.createIfNotExists('test-id', { repo });

      expect(result).toEqual(existingFeed);
      expect(repo.findOne).toHaveBeenCalledWith('test-id', undefined);
      expect(repo.findOne).toHaveBeenCalledTimes(1);
      expect(repo.insert).not.toHaveBeenCalled();
    });
  });

  describe('findOrCreateWithId', () => {
    it('should return feed if one exists', async () => {
      service.createIfNotExists = jest.fn().mockResolvedValue(new FeedEntity());

      const result = await service.findOrCreateWithId('test-id');

      expect(result).toBeInstanceOf(FeedEntity);
      expect(service.createIfNotExists).toHaveBeenCalledWith(
        'test-id',
        undefined
      );
    });
  });

  describe('findOrCreate', () => {
    it('should return feed if one exists', async () => {
      const feed = FeedEntityFake();
      service.createIfNotExists = jest.fn().mockResolvedValue(feed);

      const result = await service.findOrCreate(
        FeedEntityType.COMMENT,
        'test-id'
      );

      expect(result).toBe(feed);
      expect(service.createIfNotExists).toHaveBeenCalledWith(
        toFeedId(FeedEntityType.COMMENT, 'test-id')
      );
    });

    it('should use the page number if passed', async () => {
      const feed = FeedEntityFake();
      service.createIfNotExists = jest.fn().mockResolvedValue(feed);

      const result = await service.findOrCreate(
        FeedEntityType.COMMENT,
        'test-id',
        1
      );

      expect(result).toBe(feed);
      expect(service.createIfNotExists).toHaveBeenCalledWith(
        upsertPageNumberToId(toFeedId(FeedEntityType.COMMENT, 'test-id'), 1)
      );
    });
  });

  describe('tryUnshiftEntry', () => {
    it('should call unshift entry in tx', async () => {
      service.createIfNotExists = jest.fn();
      const feed = FeedEntityFake({ id: 'test-id' });
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(feed),
        save: jest.fn().mockResolvedValue(feed),
      };
      const txManager = {
        getRepository: jest.fn().mockReturnValue(feedRepo),
      };
      // @ts-ignore
      repo['manager'] = {
        // @ts-ignore
        transaction: async (fn: any) => {
          return await fn(txManager);
        },
      };

      const result = await service.tryUnshiftEntry(feed.id, 'entry-id');

      const clone = _.clone(feed);
      clone.tryUnshiftEntry('entry-id');

      expect(result).toEqual(clone);
      expect(service.createIfNotExists).toHaveBeenCalledWith(feed.id);
      expect(feedRepo.findOne).toHaveBeenCalledWith(feed.id, {
        lock: { mode: 'pessimistic_write' },
      });
      expect(feedRepo.findOne).toHaveBeenCalledTimes(1);
      expect(feedRepo.save).toHaveBeenCalledWith(feed);
    });

    it(`should use existing feed's id if passed an entity`, async () => {
      service.createIfNotExists = jest.fn();
      const feed = FeedEntityFake({ id: 'test-id' });
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(feed),
        save: jest.fn().mockResolvedValue(feed),
      };
      const txManager = {
        getRepository: jest.fn().mockReturnValue(feedRepo),
      };
      // @ts-ignore
      repo['manager'] = {
        // @ts-ignore
        transaction: async (fn: any) => {
          return await fn(txManager);
        },
      };

      const result = await service.tryUnshiftEntry(feed, 'entry-id');

      const clone = _.clone(feed);
      clone.tryUnshiftEntry('entry-id');

      expect(result).toEqual(clone);
      expect(service.createIfNotExists).toHaveBeenCalledWith(feed.id);
      expect(feedRepo.findOne).toHaveBeenCalledWith(feed.id, {
        lock: { mode: 'pessimistic_write' },
      });
      expect(feedRepo.findOne).toHaveBeenCalledTimes(1);
      expect(feedRepo.save).toHaveBeenCalledWith(feed);
    });
  });

  describe('tryRemoveEntry', () => {
    it('should call remove entry in tx', async () => {
      const feed = FeedEntityFake({ id: 'test-id' });
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(feed),
        save: jest.fn().mockResolvedValue(feed),
      };
      const txManager = {
        getRepository: jest.fn().mockReturnValue(feedRepo),
      };
      // @ts-ignore
      repo['manager'] = {
        // @ts-ignore
        transaction: async (fn: any) => {
          return await fn(txManager);
        },
      };

      const result = await service.tryRemoveEntry(feed.id, 'entry-id');

      const clone = _.clone(feed);
      clone.tryRemoveEntry('entry-id');

      expect(result).toEqual(clone);
      expect(feedRepo.findOne).toHaveBeenCalledWith(feed.id, {
        lock: { mode: 'pessimistic_write' },
      });
      expect(feedRepo.findOne).toHaveBeenCalledTimes(1);
      expect(feedRepo.save).toHaveBeenCalledWith(feed);
    });

    it(`should use existing feed's id if passed an entity`, async () => {
      const feed = FeedEntityFake({ id: 'test-id' });
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(feed),
        save: jest.fn().mockResolvedValue(feed),
      };
      const txManager = {
        getRepository: jest.fn().mockReturnValue(feedRepo),
      };
      // @ts-ignore
      repo['manager'] = {
        // @ts-ignore
        transaction: async (fn: any) => {
          return await fn(txManager);
        },
      };

      const result = await service.tryRemoveEntry(feed, 'entry-id');

      const clone = _.clone(feed);
      clone.tryRemoveEntry('entry-id');

      expect(result).toEqual(clone);
      expect(feedRepo.findOne).toHaveBeenCalledWith(feed.id, {
        lock: { mode: 'pessimistic_write' },
      });
      expect(feedRepo.findOne).toHaveBeenCalledTimes(1);
      expect(feedRepo.save).toHaveBeenCalledWith(feed);
    });
  });

  describe(FeedService.prototype.paginateReverseChronFeed.name, () => {
    it('should return page of ids', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        take: 2,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: ['1', '2'],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '2',
          count: 2,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return a page of ids with less than take', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        take: 4,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: [...feed.page.ids],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '3',
          count: 3,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return page of ids after', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        after: '1',
        take: 2,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: ['2', '3'],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: '2',
          endCursor: '3',
          count: 2,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return take number of ids after', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3', '4'];
      const paginationInput = {
        after: '1',
        take: 2,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: ['2', '3'],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: true,
          startCursor: '2',
          endCursor: '3',
          count: 2,
          totalCount: 4,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return take number of ids includingAndAfter', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        includingAndAfter: '1',
        take: 2,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: ['1', '2'],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '2',
          count: 2,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return a page of ids with less than take with after', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        after: '1',
        take: 4,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: ['2', '3'],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: '2',
          endCursor: '3',
          count: 2,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return a page of ids with less than take includingAndAfter', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        includingAndAfter: '1',
        take: 4,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: [...feed.page.ids],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '3',
          count: 3,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return a page of ids with includingAndAfter', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        includingAndAfter: '1',
        take: 2,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: ['1', '2'],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '2',
          count: 2,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return an empty page if after is missing', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        after: '4',
        take: 2,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: true,
          count: 0,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });

    it('should handle an empty page', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = [];
      const paginationInput = {
        take: 2,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          count: 0,
          totalCount: 0,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return page of ids before', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        before: '3',
        take: 2,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: ['1', '2'],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: '1',
          endCursor: '2',
          count: 2,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return a page of ids with includingAndBefore', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        includingAndBefore: '3',
        take: 2,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: ['2', '3'],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: '2',
          endCursor: '3',
          count: 2,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return take number of ids before', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        before: '3',
        take: 1,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: ['2'],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: true,
          startCursor: '2',
          endCursor: '2',
          count: 1,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return take number of ids includingAndBefore', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['0', '1', '2', '3'];
      const paginationInput = {
        includingAndBefore: '3',
        take: 2,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: ['2', '3'],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: '2',
          endCursor: '3',
          count: 2,
          totalCount: 4,
        },
      };
      expect(result).toEqual(response);
    });

    it('should return an empty page if before is not found', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        before: '0',
        take: 2,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: [],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          count: 0,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });

    it('should handle an empty page before', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = [];
      const paginationInput = {
        take: 2,
        before: '3',
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          count: 0,
          totalCount: 0,
        },
      };
      expect(result).toEqual(response);
    });

    it('should take all ids if take less then count with includingAndBefore', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['1', '2', '3'];
      const paginationInput = {
        includingAndBefore: '3',
        take: 4,
      };
      const result = service.paginateReverseChronFeed({
        feed,
        paginationInput,
      });
      const response: PaginateFeedResponse<string> = {
        items: [...feed.page.ids],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '3',
          count: 3,
          totalCount: 3,
        },
      };
      expect(result).toEqual(response);
    });
  });
});
