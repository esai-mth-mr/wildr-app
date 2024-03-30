import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import {
  createMockQueryRunner,
  createMockedTestingModule,
} from '@verdzie/server/testing/base.module';
import { Connection, Repository } from 'typeorm';
import { PostgresQueryFailedException } from '@verdzie/server/typeorm/postgres-exceptions';

describe(FeedService.name, () => {
  let conn: Connection;
  let feedRepo: Repository<FeedEntity>;

  beforeAll(async () => {
    conn = await getTestConnection();
    feedRepo = conn.getRepository(FeedEntity);
  });

  const cleanDb = async () => {
    await feedRepo.delete({});
  };

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
    await conn.close();
  });

  describe(FeedService.prototype.createManyIfNotExists.name, () => {
    const getServiceWithFeedRepo = async () => {
      const module = await createMockedTestingModule({
        providers: [
          FeedService,
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: feedRepo,
          },
        ],
      });
      return module.get(FeedService);
    };

    it('should create many feeds if they do not exist', async () => {
      const service = await getServiceWithFeedRepo();
      const feedIds = ['feed1', 'feed2'];
      const result = await service.createManyIfNotExists({ feedIds });
      expect(result.isOk()).toEqual(true);
      const feeds = await feedRepo.find();
      expect(feeds).toHaveLength(2);
      expect(feeds[0].id).toEqual(feedIds[0]);
      expect(feeds[1].id).toEqual(feedIds[1]);
    });

    it('should not create feeds if they exist', async () => {
      const service = await getServiceWithFeedRepo();
      const feedIds = ['feed1', 'feed2'];
      await feedRepo.insert(feedIds.map(id => FeedEntityFake({ id })));
      const result = await service.createManyIfNotExists({ feedIds });
      expect(result.isOk()).toEqual(true);
      const feeds = await feedRepo.find();
      expect(feeds).toHaveLength(2);
      expect(feeds[0].id).toEqual(feedIds[0]);
      expect(feeds[1].id).toEqual(feedIds[1]);
    });

    it('should not update feeds if they exist', async () => {
      const feed = FeedEntityFake();
      feed.page.ids = ['entry1', 'entry2'];
      feed._count = 2;
      await feedRepo.insert(feed);
      const service = await getServiceWithFeedRepo();
      const feedIds = [feed.id];
      const result = await service.createManyIfNotExists({ feedIds });
      expect(result.isOk()).toEqual(true);
      const feeds = await feedRepo.find();
      expect(feeds).toHaveLength(1);
      expect(feeds[0]).toEqual(feed);
    });

    it('should handle errors from feed creation', async () => {
      const feedRepo = {
        insert: jest.fn().mockRejectedValue(new Error('error')),
      };
      const service = await createMockedTestingModule({
        providers: [
          FeedService,
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: feedRepo,
          },
        ],
      }).then(module => module.get(FeedService));
      const feedIds = ['feed1', 'feed2'];
      const result = await service.createManyIfNotExists({ feedIds });
      expect(result.isErr()).toEqual(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresQueryFailedException
      );
    });
  });

  describe(FeedService.prototype.unshiftToSinglePageFeedInTxn.name, () => {
    const getServiceWithFeedRepo = async () => {
      const module = await createMockedTestingModule({
        providers: [
          FeedService,
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: feedRepo,
          },
        ],
      });
      return module.get(FeedService);
    };

    it('should add an element to an existing feed', async () => {
      const service = await getServiceWithFeedRepo();
      const feed = FeedEntityFake();
      feed.page.ids = [];
      await feedRepo.insert(feed);
      const entry = 'entry';
      const result = await service.unshiftToSinglePageFeedInTxn({
        feedId: feed.id,
        entry,
      });
      expect(result.isOk()).toEqual(true);
      const updatedFeed = await feedRepo.findOneOrFail(feed.id);
      expect(updatedFeed).toEqual({
        ...feed,
        page: {
          ...feed.page,
          ids: [entry],
        },
        _count: 1,
      });
    });

    it('should add an element to an existing feed with existing entries', async () => {
      const service = await getServiceWithFeedRepo();
      const feed = FeedEntityFake();
      feed.page.ids = ['entry1', 'entry2'];
      feed._count = 2;
      await feedRepo.insert(feed);
      const entry = 'entry';
      const result = await service.unshiftToSinglePageFeedInTxn({
        feedId: feed.id,
        entry,
      });
      expect(result.isOk()).toEqual(true);
      const updatedFeed = await feedRepo.findOneOrFail(feed.id);
      expect(updatedFeed).toEqual({
        ...feed,
        page: {
          ...feed.page,
          ids: [entry, 'entry1', 'entry2'],
        },
        _count: 3,
      });
    });

    it('should create a new feed if it does not exist', async () => {
      const service = await getServiceWithFeedRepo();
      const entry = 'entry';
      const feedId = 'feedId';
      const result = await service.unshiftToSinglePageFeedInTxn({
        feedId,
        entry,
      });
      expect(result.isOk()).toEqual(true);
      const updatedFeed = await feedRepo.findOneOrFail(feedId);
      expect(updatedFeed.page.ids).toEqual([entry]);
      expect(updatedFeed._count).toEqual(1);
    });

    it('should handle errors from feed creation', async () => {
      const feedRepo = {
        findOne: jest.fn().mockRejectedValue(new Error('error')),
      };
      const service = await createMockedTestingModule({
        providers: [
          FeedService,
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: feedRepo,
          },
        ],
      }).then(module => module.get(FeedService));
      const entry = 'entry';
      const feedId = 'feedId';
      const result = await service.unshiftToSinglePageFeedInTxn({
        feedId,
        entry,
      });
      expect(result.isErr()).toEqual(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresQueryFailedException
      );
    });

    it('should handle and retry errors from feed update', async () => {
      const feed = FeedEntityFake();
      const txFeedRepo = {
        findOne: jest.fn().mockResolvedValue(feed),
        update: jest
          .fn()
          .mockRejectedValueOnce(new Error('error'))
          .mockResolvedValueOnce({}),
      };
      const queryRunner = createMockQueryRunner({
        repositories: {
          FeedEntity: txFeedRepo,
        },
      });
      const feedRepo = {
        findOne: jest.fn().mockResolvedValue(feed),
        manager: {
          connection: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
          },
        },
      };
      const service = await createMockedTestingModule({
        providers: [
          FeedService,
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: feedRepo,
          },
        ],
      }).then(module => module.get(FeedService));
      const entry = 'entry';
      const feedId = 'feedId';
      const result = await service.unshiftToSinglePageFeedInTxn({
        feedId,
        entry,
      });
      expect(result.isErr()).toEqual(false);
      expect(txFeedRepo.update).toHaveBeenCalledTimes(2);
    });
  });
});
