import { getConnectionToken, getRepositoryToken } from '@nestjs/typeorm';
import {
  BannerEntity,
  BannerState,
} from '@verdzie/server/banner/banner.entity';
import {
  BannerNotFoundException,
  BannerService,
} from '@verdzie/server/banner/banner.service';
import {
  BannerDataFake,
  BannerEntityFake,
  BannerSettingsFake,
} from '@verdzie/server/banner/testing/banner.entity.fake';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import {
  createMockConnection,
  createMockQueryRunner,
  createMockedTestingModule,
} from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { Connection, Repository } from 'typeorm';
import { entityUndefToNull } from '@verdzie/test/utils/entity-undef-to-null';
import {
  PostgresQueryFailedException,
  PostgresUpdateFailedException,
} from '@verdzie/server/typeorm/postgres-exceptions';
import { UserBannerData, UserEntity } from '@verdzie/server/user/user.entity';
import { UserNotFoundException } from '@verdzie/server/user/user.service';

describe(BannerService.name, () => {
  let conn: Connection;
  let bannerRepo: Repository<BannerEntity>;
  let userRepo: Repository<UserEntity>;

  beforeAll(async () => {
    conn = await getTestConnection();
    bannerRepo = conn.getRepository(BannerEntity);
    userRepo = conn.getRepository(UserEntity);
  });

  const cleanDb = async () => {
    await bannerRepo.delete({});
    await userRepo.delete({});
  };

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await conn.close();
  });

  const getBannerServiceWithDeps = async () => {
    const module = await createMockedTestingModule({
      providers: [
        BannerService,
        {
          provide: getConnectionToken(),
          useValue: conn,
        },
        {
          provide: getRepositoryToken(BannerEntity),
          useValue: bannerRepo,
        },
      ],
    });
    const bannerService = module.get<BannerService>(BannerService);
    return bannerService;
  };

  describe(BannerService.prototype.getApplicableBannersForUser, () => {
    it('should always return a banner if the user is in the banner acl and testing is enabled', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const user = UserEntityFake();
      const banners = [
        BannerEntityFake({
          data: BannerDataFake({
            settings: BannerSettingsFake({
              acl: [user.id],
            }),
          }),
          state: BannerState.TESTING,
          startDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // in the future
          endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // in the past
        }),
      ];
      await bannerRepo.insert(banners);
      const result = await bannerService.getApplicableBannersForUser({
        user,
      });
      expect(result._unsafeUnwrap()).toEqual([entityUndefToNull(banners[0])]);
    });

    it('should return enabled banners to users', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const user = UserEntityFake();
      const banners = [
        BannerEntityFake(),
        BannerEntityFake({
          state: BannerState.DISABLED,
        }),
      ];
      await bannerRepo.insert(banners);
      const result = await bannerService.getApplicableBannersForUser({
        user,
      });
      expect(result._unsafeUnwrap()).toEqual([entityUndefToNull(banners[0])]);
    });

    it('should not return disabled banners to users', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const user = UserEntityFake();
      const banners = [
        BannerEntityFake({
          state: BannerState.DISABLED,
        }),
        BannerEntityFake(),
      ];
      await bannerRepo.insert(banners);
      const result = await bannerService.getApplicableBannersForUser({
        user,
      });
      expect(result._unsafeUnwrap()).toEqual([entityUndefToNull(banners[1])]);
    });

    it('should not return testing banners to general users', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const user = UserEntityFake();
      const banners = [
        BannerEntityFake({
          state: BannerState.TESTING,
        }),
        BannerEntityFake(),
      ];
      await bannerRepo.insert(banners);
      const result = await bannerService.getApplicableBannersForUser({
        user,
      });
      expect(result._unsafeUnwrap()).toEqual([entityUndefToNull(banners[1])]);
    });

    it('should not return archived banners to users', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const user = UserEntityFake();
      const banners = [
        BannerEntityFake({
          state: BannerState.ARCHIVED,
        }),
        BannerEntityFake(),
      ];
      await bannerRepo.insert(banners);
      const result = await bannerService.getApplicableBannersForUser({
        user,
      });
      expect(result._unsafeUnwrap()).toEqual([entityUndefToNull(banners[1])]);
    });

    it('should not return banners that have not started yet', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const user = UserEntityFake();
      const banners = [
        BannerEntityFake(),
        BannerEntityFake({
          startDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        }),
      ];
      await bannerRepo.insert(banners);
      const result = await bannerService.getApplicableBannersForUser({
        user,
      });
      expect(result._unsafeUnwrap()).toEqual([entityUndefToNull(banners[0])]);
    });

    it('should not return banners that have ended', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const user = UserEntityFake();
      const banners = [
        BannerEntityFake(),
        BannerEntityFake({
          endDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
        }),
      ];
      await bannerRepo.insert(banners);
      const result = await bannerService.getApplicableBannersForUser({
        user,
      });
      expect(result._unsafeUnwrap()).toEqual([entityUndefToNull(banners[0])]);
    });

    it('should not return banners that have been skipped skip count times', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const banners = [
        BannerEntityFake({
          data: BannerDataFake({
            settings: BannerSettingsFake({
              skipCount: 1,
            }),
          }),
        }),
        BannerEntityFake(),
      ];
      const user = UserEntityFake({
        bannerData: {
          bannerInteractions: {
            [banners[0].id]: {
              skipCount: 1,
              lastSkippedAt: new Date().toISOString(),
            },
          },
        },
      });
      await bannerRepo.insert(banners);
      const result = await bannerService.getApplicableBannersForUser({
        user,
      });
      expect(result._unsafeUnwrap()).toEqual([entityUndefToNull(banners[1])]);
    });

    it('should not return banners that have been skipped within the skip refresh interval', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const banners = [
        BannerEntityFake({
          data: BannerDataFake({
            settings: BannerSettingsFake({
              skipRefreshIntervalMilliseconds: 1000 * 60 * 60 * 24,
            }),
          }),
        }),
        BannerEntityFake(),
      ];
      const user = UserEntityFake({
        bannerData: {
          bannerInteractions: {
            [banners[0].id]: {
              skipCount: 0,
              lastSkippedAt: new Date().toISOString(),
            },
          },
        },
      });
      await bannerRepo.insert(banners);
      const result = await bannerService.getApplicableBannersForUser({
        user,
      });
      expect(result._unsafeUnwrap()).toHaveLength(1);
      expect(result._unsafeUnwrap()).toEqual([entityUndefToNull(banners[1])]);
    });

    it('should return banners that have been skipped outside the skip refresh interval', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const banners = [
        BannerEntityFake({
          data: BannerDataFake({
            settings: BannerSettingsFake({
              skipRefreshIntervalMilliseconds: 1000 * 60 * 60 * 24,
            }),
          }),
        }),
        BannerEntityFake(),
      ];
      const user = UserEntityFake({
        bannerData: {
          bannerInteractions: {
            [banners[0].id]: {
              skipCount: 0,
              lastSkippedAt: new Date(
                Date.now() - 1000 * 60 * 60 * 25
              ).toISOString(),
            },
          },
        },
      });
      await bannerRepo.insert(banners);
      const result = await bannerService.getApplicableBannersForUser({
        user,
      });
      expect(result._unsafeUnwrap()).toHaveLength(2);
      expect(result._unsafeUnwrap()).toEqual([
        entityUndefToNull(banners[0]),
        entityUndefToNull(banners[1]),
      ]);
    });

    it('should not return completed banners', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const banners = [BannerEntityFake(), BannerEntityFake()];
      const user = UserEntityFake({
        bannerData: {
          bannerInteractions: {
            [banners[0].id]: {
              skipCount: 0,
              lastSkippedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
            },
          },
        },
      });
      await bannerRepo.insert(banners);
      const result = await bannerService.getApplicableBannersForUser({
        user,
      });
      expect(result._unsafeUnwrap()).toHaveLength(1);
      expect(result._unsafeUnwrap()).toEqual([entityUndefToNull(banners[1])]);
    });

    it('should return an error if the banner find fails', async () => {
      const module = await createMockedTestingModule({
        providers: [
          BannerService,
          {
            provide: getConnectionToken(),
            useValue: conn,
          },
          {
            provide: getRepositoryToken(BannerEntity),
            useValue: {
              find: async () => {
                throw new Error('test');
              },
            },
          },
        ],
      });
      const bannerService = module.get<BannerService>(BannerService);
      const user = UserEntityFake();
      const result = await bannerService.getApplicableBannersForUser({
        user,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresQueryFailedException
      );
    });
  });

  describe(BannerService.prototype.skipBannerForUser, () => {
    it('should mark a new banner as skipped for user', async () => {
      const banner = BannerEntityFake();
      const user = UserEntityFake();
      await bannerRepo.insert(banner);
      await userRepo.insert(user);
      const bannerService = await getBannerServiceWithDeps();
      await bannerService.skipBannerForUser({
        currentUser: user,
        bannerId: banner.id,
      });
      const updatedUser = await userRepo.findOneOrFail(user.id);
      const expectedBannerData: UserBannerData = {
        bannerInteractions: {
          [banner.id]: {
            skipCount: 1,
            lastSkippedAt: expect.any(String),
          },
        },
      };
      expect(updatedUser.bannerData).toEqual(expectedBannerData);
    });

    it('should increment the skip count for a banner that has already been skipped', async () => {
      const banner = BannerEntityFake();
      const user = UserEntityFake({
        bannerData: {
          bannerInteractions: {
            [banner.id]: {
              skipCount: 1,
              lastSkippedAt: new Date().toISOString(),
            },
          },
        },
      });
      await bannerRepo.insert(banner);
      await userRepo.insert(user);
      const bannerService = await getBannerServiceWithDeps();
      await bannerService.skipBannerForUser({
        currentUser: user,
        bannerId: banner.id,
      });
      const updatedUser = await userRepo.findOneOrFail(user.id);
      const expectedBannerData: UserBannerData = {
        bannerInteractions: {
          [banner.id]: {
            skipCount: 2,
            lastSkippedAt: expect.any(String),
          },
        },
      };
      expect(updatedUser.bannerData).toEqual(expectedBannerData);
    });

    it('should return an error if the banner does not exist', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const user = UserEntityFake();
      const result = await bannerService.skipBannerForUser({
        currentUser: user,
        bannerId: 'test',
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(BannerNotFoundException);
    });

    it('should return an error if the user does not exist', async () => {
      const bannerService = await getBannerServiceWithDeps();
      const banner = BannerEntityFake();
      await bannerRepo.insert(banner);
      const result = await bannerService.skipBannerForUser({
        currentUser: UserEntityFake(),
        bannerId: banner.id,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(UserNotFoundException);
    });

    it('should return an error if the banner find fails', async () => {
      const module = await createMockedTestingModule({
        providers: [
          BannerService,
          {
            provide: getConnectionToken(),
            useValue: conn,
          },
          {
            provide: getRepositoryToken(BannerEntity),
            useValue: {
              findOne: async () => {
                throw new Error('test');
              },
            },
          },
        ],
      });
      const bannerService = module.get<BannerService>(BannerService);
      const user = UserEntityFake();
      const result = await bannerService.skipBannerForUser({
        currentUser: user,
        bannerId: 'test',
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresQueryFailedException
      );
    });

    it('should return an error if the user find fails', async () => {
      const userRepo = {
        findOne: jest.fn().mockRejectedValue(new Error('test')),
      };
      const queryRunner = createMockQueryRunner({
        repositories: {
          UserEntity: userRepo,
        },
      });
      const conn = createMockConnection({
        repositories: {
          UserEntity: userRepo,
        },
      });
      conn.createQueryRunner = jest.fn().mockReturnValue(queryRunner);
      const module = await createMockedTestingModule({
        providers: [
          BannerService,
          {
            provide: getConnectionToken(),
            useValue: conn,
          },
          {
            provide: getRepositoryToken(BannerEntity),
            useValue: bannerRepo,
          },
        ],
      });
      const bannerService = module.get<BannerService>(BannerService);
      // @ts-expect-error
      bannerService['skipRetryCount'] = 1;
      const banner = BannerEntityFake();
      await bannerRepo.insert(banner);
      const result = await bannerService.skipBannerForUser({
        currentUser: UserEntityFake(),
        bannerId: banner.id,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresQueryFailedException
      );
      // check txn retry is working
      expect(userRepo.findOne).toHaveBeenCalledTimes(2);
    });

    it('should return an error if the user update fails', async () => {
      const userRepo = {
        findOne: jest.fn().mockResolvedValue(UserEntityFake()),
        update: jest.fn().mockRejectedValue(new Error('test')),
      };
      const queryRunner = createMockQueryRunner({
        repositories: {
          UserEntity: userRepo,
        },
      });
      const conn = createMockConnection({});
      conn.createQueryRunner = jest.fn().mockReturnValue(queryRunner);
      const module = await createMockedTestingModule({
        providers: [
          BannerService,
          {
            provide: getConnectionToken(),
            useValue: conn,
          },
          {
            provide: getRepositoryToken(BannerEntity),
            useValue: bannerRepo,
          },
        ],
      });
      const bannerService = module.get<BannerService>(BannerService);
      // @ts-expect-error
      bannerService['skipRetryCount'] = 1;
      const banner = BannerEntityFake();
      await bannerRepo.insert(banner);
      const result = await bannerService.skipBannerForUser({
        currentUser: UserEntityFake(),
        bannerId: banner.id,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresUpdateFailedException
      );
      // check txn retry is working
      expect(userRepo.update).toHaveBeenCalledTimes(2);
    });
  });
});
