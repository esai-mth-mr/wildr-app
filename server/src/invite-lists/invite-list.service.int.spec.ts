import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import {
  FeedPageInfo,
  FeedService,
  toFeedId,
} from '@verdzie/server/feed/feed.service';
import {
  FeedEntityFake,
  FeedPageFake,
} from '@verdzie/server/feed/testing/feed-entity.fake';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { Connection, Repository } from 'typeorm';
import { PostgresQueryFailedException } from '@verdzie/server/typeorm/postgres-exceptions';
import { InviteListService } from '@verdzie/server/invite-lists/invite-list.service';
import { err } from 'neverthrow';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { EntitiesWithPagesCommon } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';

describe(InviteListService.name, () => {
  let conn: Connection;
  let feedRepo: Repository<FeedEntity>;
  let userRepo: Repository<UserEntity>;

  beforeAll(async () => {
    conn = await getTestConnection();
    feedRepo = conn.getRepository(FeedEntity);
    userRepo = conn.getRepository(UserEntity);
  });

  const cleanDb = async () => {
    await feedRepo.delete({});
    await userRepo.delete({});
  };

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
    await conn.close();
  });

  describe(InviteListService.prototype.recordInvite.name, () => {
    const getServiceWithFeedRepo = async () => {
      const module = await createMockedTestingModule({
        providers: [
          InviteListService,
          FeedService,
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: feedRepo,
          },
        ],
      });
      return module.get(InviteListService);
    };

    const getEmptyReferredFeed = (referrerId: string) => {
      const feed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REFERRED_USERS, referrerId),
      });
      feed.page.ids = [];
      feed._count = 0;
      return feed;
    };

    it('should record an invite for the referrer', async () => {
      const service = await getServiceWithFeedRepo();
      const referrerId = 'referrerId';
      const invitedId = 'invitedId';
      const referredFeed = getEmptyReferredFeed(referrerId);
      await feedRepo.insert(referredFeed);
      const result = await service.recordInvite({
        referrerId,
        invitedId,
      });
      expect(result.isOk()).toEqual(true);
      const updatedFeed = await feedRepo.findOneOrFail(referredFeed.id);
      expect(updatedFeed).toEqual({
        ...referredFeed,
        page: {
          ...referredFeed.page,
          ids: [invitedId],
        },
        _count: 1,
      });
    });

    it('should create the referred feed if it does not exist', async () => {
      const service = await getServiceWithFeedRepo();
      const referrerId = 'referrerId';
      const invitedId = 'invitedId';
      const result = await service.recordInvite({
        referrerId,
        invitedId,
      });
      expect(result.isOk()).toEqual(true);
      const updatedFeed = await feedRepo.findOneOrFail(
        toFeedId(FeedEntityType.REFERRED_USERS, referrerId)
      );
      expect(updatedFeed.page.ids).toEqual([invitedId]);
      expect(updatedFeed._count).toEqual(1);
    });

    it('should return an error if the transaction fails', async () => {
      const feedService = {
        unshiftToSinglePageFeedInTxn: jest
          .fn()
          .mockResolvedValue(err(new PostgresQueryFailedException())),
      };
      const service = await createMockedTestingModule({
        providers: [
          InviteListService,
          {
            provide: FeedService,
            useValue: feedService,
          },
        ],
      }).then(module => module.get(InviteListService));
      const referrerId = 'referrerId';
      const invitedId = 'invitedId';
      const result = await service.recordInvite({
        referrerId,
        invitedId,
      });
      expect(result.isErr()).toEqual(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresQueryFailedException
      );
    });
  });

  describe(InviteListService.prototype.paginateInvites.name, () => {
    const getServiceWithServices = async () => {
      const module = await createMockedTestingModule({
        providers: [
          InviteListService,
          {
            provide: getRepositoryToken(UserEntity),
            useValue: userRepo,
          },
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: feedRepo,
          },
          FeedService,
          UserService,
          EntitiesWithPagesCommon,
        ],
      });
      return module.get(InviteListService);
    };

    it('should paginate through invited users', async () => {
      const service = await getServiceWithServices();
      const currentUser = UserEntityFake();
      const referredUser = UserEntityFake({
        refererId: currentUser.id,
      });
      await userRepo.insert(referredUser);
      const referredFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REFERRED_USERS, currentUser.id),
        page: FeedPageFake({
          ids: [referredUser.id],
        }),
      });
      await feedRepo.insert(referredFeed);
      const result = await service.paginateInvites({
        currentUser,
        paginationInput: {
          take: 1,
        },
      });
      expect(result.isOk()).toEqual(true);
      const { items, pageInfo } = result._unsafeUnwrap();
      expect(items.length).toEqual(1);
      expect(items[0].id).toEqual(referredUser.id);
      const expectedPageInfo: FeedPageInfo = {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: referredUser.id,
        endCursor: referredUser.id,
        count: 1,
        totalCount: 1,
      };
      expect(pageInfo).toEqual(expectedPageInfo);
    });

    it('should paginate through to the next page', async () => {
      const service = await getServiceWithServices();
      const currentUser = UserEntityFake();
      const referredUsers = Array.from({ length: 10 }).map(() =>
        UserEntityFake({
          refererId: currentUser.id,
        })
      );
      await userRepo.insert(referredUsers);
      const referredFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REFERRED_USERS, currentUser.id),
        page: FeedPageFake({
          ids: referredUsers.map(user => user.id),
        }),
      });
      await feedRepo.insert(referredFeed);
      const after = referredUsers[4].id;
      const result = await service.paginateInvites({
        currentUser,
        paginationInput: {
          take: 3,
          after,
        },
      });
      expect(result.isOk()).toEqual(true);
      const { items, pageInfo } = result._unsafeUnwrap();
      expect(items.length).toEqual(3);
      const expectedIds = referredUsers.slice(5, 8).map(user => user.id);
      const receivedIds = items.map(user => user.id);
      expect(receivedIds).toEqual(expectedIds);
      const expectedPageInfo: FeedPageInfo = {
        hasNextPage: true,
        hasPreviousPage: true,
        startCursor: referredUsers[5].id,
        endCursor: referredUsers[7].id,
        count: 3,
        totalCount: 10,
      };
      expect(pageInfo).toEqual(expectedPageInfo);
    });

    it('should paginate through the last page', async () => {
      const service = await getServiceWithServices();
      const currentUser = UserEntityFake();
      const referredUsers = Array.from({ length: 10 }).map(() =>
        UserEntityFake({
          refererId: currentUser.id,
        })
      );
      await userRepo.insert(referredUsers);
      const referredFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.REFERRED_USERS, currentUser.id),
        page: FeedPageFake({
          ids: referredUsers.map(user => user.id),
        }),
      });
      await feedRepo.insert(referredFeed);
      const includingAndAfter = referredUsers[7].id;
      const result = await service.paginateInvites({
        currentUser,
        paginationInput: {
          take: 4,
          includingAndAfter,
        },
      });
      expect(result.isOk()).toEqual(true);
      const { items, pageInfo } = result._unsafeUnwrap();
      expect(items.length).toEqual(3);
      expect(items[0].id).toEqual(referredUsers[7].id);
      expect(items[1].id).toEqual(referredUsers[8].id);
      expect(items[2].id).toEqual(referredUsers[9].id);
      const expectedPageInfo: FeedPageInfo = {
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: referredUsers[7].id,
        endCursor: referredUsers[9].id,
        count: 3,
        totalCount: 10,
      };
      expect(pageInfo).toEqual(expectedPageInfo);
    });
  });
});
