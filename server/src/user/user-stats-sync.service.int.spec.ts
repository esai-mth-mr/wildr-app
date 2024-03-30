import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityFake } from '@verdzie/server/feed/testing/feed-entity.fake';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { PostgresTransactionFailedException } from '@verdzie/server/typeorm/postgres-exceptions';
import { UserListEntityFake } from '@verdzie/server/user-list/testing/userList.entity.fake';
import { UserListEntity } from '@verdzie/server/user-list/userList.entity';
import { innerCircleListId } from '@verdzie/server/user-list/userList.helpers';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserStatsService } from '@verdzie/server/user/user-stats.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserStatsSyncService } from '@verdzie/server/user/user-stats-sync.service';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { Connection, Repository } from 'typeorm';

describe(UserStatsSyncService, () => {
  let service: UserStatsSyncService;
  let conn: Connection;
  let userRepo: Repository<UserEntity>;
  let feedRepo: Repository<FeedEntity>;
  let listRepo: Repository<UserListEntity>;

  const cleanDb = async () => {
    await userRepo.delete({});
    await feedRepo.delete({});
    await listRepo.delete({});
  };

  beforeAll(async () => {
    conn = await getTestConnection();
    await conn.synchronize(true);
    userRepo = conn.getRepository(UserEntity);
    feedRepo = conn.getRepository(FeedEntity);
    listRepo = conn.getRepository(UserListEntity);
  });

  beforeEach(() => cleanDb);

  afterAll(async () => {
    await cleanDb();
    await conn.close();
  });

  describe(UserStatsSyncService.prototype.syncUserStats, () => {
    const getModule = async () => {
      const module = await createMockedTestingModule({
        providers: [
          UserStatsSyncService,
          UserStatsService,
          { provide: getRepositoryToken(UserEntity), useValue: userRepo },
          { provide: getRepositoryToken(FeedEntity), useValue: feedRepo },
          { provide: getRepositoryToken(UserListEntity), useValue: listRepo },
        ],
      });
      return module;
    };

    it('should set stats for feeds', async () => {
      const user1 = UserEntityFake();
      user1.setStats({
        followerCount: 0,
        followingCount: 30,
        postCount: 3,
      });
      const user2 = UserEntityFake();
      const module = await getModule();
      service = module.get(UserStatsSyncService);
      const user1FollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, user1.id),
        ids: [user2.id],
      });
      const user1FollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, user1.id),
        ids: [user2.id],
      });
      const user1AllPostsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS, user1.id),
        ids: ['post1'],
      });
      await feedRepo.insert([
        user1FollowingFeed,
        user1FollowerFeed,
        user1AllPostsFeed,
      ]);
      await userRepo.insert([user1, user2]);
      await service.syncUserStats({ userId: user1.id });
      const updatedUser1 = await userRepo.findOne(user1.id);
      expect(updatedUser1?.getStats()).toEqual({
        followerCount: 1,
        followingCount: 1,
        postCount: 1,
        innerCircleCount: 0,
      });
    });

    it('should not set all posts stat if missing', async () => {
      const user1 = UserEntityFake();
      user1.setStats({
        followerCount: 0,
        followingCount: 30,
        postCount: 3,
      });
      const user2 = UserEntityFake();
      const module = await getModule();
      service = module.get(UserStatsSyncService);
      const user1FollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, user1.id),
        ids: [user2.id],
      });
      const user1FollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, user1.id),
        ids: [user2.id],
      });
      await feedRepo.insert([user1FollowingFeed, user1FollowerFeed]);
      await userRepo.insert([user1, user2]);
      await service.syncUserStats({ userId: user1.id });
      const updatedUser1 = await userRepo.findOne(user1.id);
      expect(updatedUser1?.getStats()).toEqual({
        followerCount: 1,
        followingCount: 1,
        postCount: 3,
        innerCircleCount: 0,
      });
    });

    it('should not set stat for following feed if missing', async () => {
      const user1 = UserEntityFake();
      user1.setStats({
        followerCount: 0,
        followingCount: 30,
        postCount: 3,
      });
      const user2 = UserEntityFake();
      const module = await getModule();
      service = module.get(UserStatsSyncService);
      const user1FollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, user1.id),
        ids: [user2.id],
      });
      const user1AllPostsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS, user1.id),
        ids: ['post1'],
      });
      await feedRepo.insert([user1FollowerFeed, user1AllPostsFeed]);
      await userRepo.insert([user1, user2]);
      await service.syncUserStats({ userId: user1.id });
      const updatedUser1 = await userRepo.findOne(user1.id);
      expect(updatedUser1?.getStats()).toEqual({
        followerCount: 1,
        followingCount: 30,
        postCount: 1,
        innerCircleCount: 0,
      });
    });

    it('should not set stat for follower feed if missing', async () => {
      const user1 = UserEntityFake();
      user1.setStats({
        followerCount: 0,
        followingCount: 30,
        postCount: 3,
      });
      const user2 = UserEntityFake();
      const module = await getModule();
      service = module.get(UserStatsSyncService);
      const user1FollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, user1.id),
        ids: [user2.id],
      });
      const user1AllPostsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS, user1.id),
        ids: ['post1'],
      });
      await feedRepo.insert([user1FollowingFeed, user1AllPostsFeed]);
      await userRepo.insert([user1, user2]);
      await service.syncUserStats({ userId: user1.id });
      const updatedUser1 = await userRepo.findOne(user1.id);
      expect(updatedUser1?.getStats()).toEqual({
        followerCount: 0,
        followingCount: 1,
        postCount: 1,
        innerCircleCount: 0,
      });
    });

    it('should set inner circle stats for found inner circle lists', async () => {
      const user1 = UserEntityFake();
      user1.setStats({
        followerCount: 0,
        followingCount: 30,
        postCount: 3,
        innerCircleCount: 0,
      });
      const user2 = UserEntityFake();
      const module = await getModule();
      service = module.get(UserStatsSyncService);
      const user1InnerCircleList = new UserListEntity({
        ids: [user2.id],
        id: innerCircleListId(user1.id, 1),
      });
      await listRepo.insert(user1InnerCircleList);
      await userRepo.insert([user1, user2]);
      await service.syncUserStats({ userId: user1.id });
      const updatedUser1 = await userRepo.findOne(user1.id);
      expect(updatedUser1?.getStats()).toEqual({
        followerCount: 0,
        followingCount: 30,
        postCount: 3,
        innerCircleCount: 1,
      });
    });

    it('should handle errors from find', async () => {
      const user = UserEntityFake();
      const queryRunner = {
        connect: jest.fn().mockResolvedValue({}),
        startTransaction: jest.fn().mockResolvedValue({}),
        manager: {
          findOne: jest.fn().mockImplementation(entity => {
            if (entity === FeedEntity) {
              return Promise.reject(new Error('test error'));
            }
            return Promise.resolve(UserListEntityFake());
          }),
        },
        release: jest.fn().mockResolvedValue({}),
      };
      const manager = {
        connection: {
          createQueryRunner: jest.fn().mockReturnValue(queryRunner),
        },
      };
      const module = await createMockedTestingModule({
        providers: [
          UserStatsSyncService,
          {
            provide: getRepositoryToken(UserEntity),
            useValue: {
              manager,
            },
          },
          { provide: getRepositoryToken(FeedEntity), useValue: feedRepo },
          { provide: getRepositoryToken(UserListEntity), useValue: listRepo },
        ],
      });
      service = module.get(UserStatsSyncService);
      const result = await service.syncUserStats({ userId: user.id });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresTransactionFailedException
      );
    });

    it('should handle errors when finding user list', async () => {
      const user = UserEntityFake();
      const queryRunner = {
        connect: jest.fn().mockResolvedValue({}),
        startTransaction: jest.fn().mockResolvedValue({}),
        manager: {
          findOne: jest.fn().mockImplementation(entity => {
            if (entity === UserListEntity) {
              return Promise.reject(new Error('test error'));
            }
            return FeedEntityFake();
          }),
        },
        release: jest.fn().mockResolvedValue({}),
      };
      const manager = {
        connection: {
          createQueryRunner: jest.fn().mockReturnValue(queryRunner),
        },
      };
      const module = await createMockedTestingModule({
        providers: [
          UserStatsSyncService,
          {
            provide: getRepositoryToken(UserEntity),
            useValue: {
              manager,
            },
          },
          { provide: getRepositoryToken(FeedEntity), useValue: feedRepo },
          { provide: getRepositoryToken(UserListEntity), useValue: listRepo },
        ],
      });
      service = module.get(UserStatsSyncService);
      const result = await service.syncUserStats({ userId: user.id });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresTransactionFailedException
      );
    });

    it('should handle errors when settings stats', async () => {
      const user = UserEntityFake();
      const user2 = UserEntityFake();
      const userFollowingFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWING, user.id),
        ids: [user2.id],
      });
      const userFollowerFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.FOLLOWER, user.id),
        ids: [user2.id],
      });
      const userAllPostsFeed = FeedEntityFake({
        id: toFeedId(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS, user.id),
        ids: ['post1'],
      });
      await feedRepo.insert([
        userFollowingFeed,
        userFollowerFeed,
        userAllPostsFeed,
      ]);
      const module = await createMockedTestingModule({
        providers: [
          UserStatsSyncService,
          {
            provide: UserStatsService,
            useValue: {
              jsonSetStatsInTxn: jest
                .fn()
                .mockRejectedValue(new Error('test error')),
            },
          },
          { provide: getRepositoryToken(UserEntity), useValue: userRepo },
          { provide: getRepositoryToken(FeedEntity), useValue: feedRepo },
          { provide: getRepositoryToken(UserListEntity), useValue: listRepo },
        ],
      });
      service = module.get(UserStatsSyncService);
      const result = await service.syncUserStats({ userId: user.id });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresTransactionFailedException
      );
    });
  });
});
