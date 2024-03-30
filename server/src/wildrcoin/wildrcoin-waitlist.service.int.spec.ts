import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import {
  AlreadyJoinedWildrcoinWaitlistException,
  UserEntity,
  UserWildrcoinData,
} from '@verdzie/server/user/user.entity';
import {
  WaitlistEntity,
  WaitlistType,
} from '@verdzie/server/waitlist/waitlist.entity';
import { WildrcoinWaitlistService } from '@verdzie/server/wildrcoin/wildrcoin-waitlist.service';
import { Connection, Repository } from 'typeorm';
import {
  createMockQueryRunner,
  createMockedTestingModule,
} from '@verdzie/server/testing/base.module';
import { getConnectionToken, getRepositoryToken } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';
import { UserNotFoundException } from '@verdzie/server/user/user.service';
import {
  PostgresQueryFailedException,
  PostgresUpdateFailedException,
  PostgresUpsertFailedException,
} from '@verdzie/server/typeorm/postgres-exceptions';

describe(WildrcoinWaitlistService, () => {
  let conn: Connection;
  let userRepo: Repository<UserEntity>;
  let waitlistRepo: Repository<WaitlistEntity>;
  let module: TestingModule;
  let service: WildrcoinWaitlistService;

  beforeAll(async () => {
    conn = await getTestConnection();
    await conn.synchronize(true);
    userRepo = conn.getRepository(UserEntity);
    waitlistRepo = conn.getRepository(WaitlistEntity);
  });

  const cleanDb = async () => {
    await userRepo.delete({});
    await waitlistRepo.delete({});
  };

  beforeEach(async () => {
    module = await createMockedTestingModule({
      providers: [
        WildrcoinWaitlistService,
        {
          provide: getConnectionToken(),
          useValue: conn,
        },
        {
          provide: getRepositoryToken(WaitlistEntity),
          useValue: waitlistRepo,
        },
      ],
    });
    service = module.get(WildrcoinWaitlistService);
    // @ts-expect-error
    service['transactionRetryCount'] = 0;
    await cleanDb();
  });

  afterEach(async () => {
    await module.close();
  });

  afterAll(async () => {
    await cleanDb();
    await conn.close();
  });

  describe(WildrcoinWaitlistService.prototype.addUser, () => {
    it('should add the existing user to the waitlist', async () => {
      const user = UserEntityFake();
      await userRepo.insert(user);
      const service = module.get(WildrcoinWaitlistService);
      const result = await service.addUser({ currentUser: user });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      const updatedUser = await userRepo.findOneOrFail(user.id);
      const expectedWildrcoinData: UserWildrcoinData = {
        waitlistParticipationEvents: [
          {
            __typename: 'WildrcoinWaitlistJoinEvent',
            createdAt: expect.any(String),
          },
        ],
      };
      expect(updatedUser.wildrcoinData).toEqual(expectedWildrcoinData);
    });

    it('should return an error if the user does not exist', async () => {
      const user = UserEntityFake();
      const result = await service.addUser({ currentUser: user });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(UserNotFoundException);
    });

    it('should append the waitlist participation event to the existing user', async () => {
      const user = UserEntityFake();
      const leaveDate = new Date();
      user.wildrcoinData = {
        waitlistParticipationEvents: [
          {
            // @ts-expect-error
            __typename: 'WildrcoinWaitlistLeaveEvent',
            createdAt: leaveDate.toISOString(),
          },
        ],
      };
      await userRepo.insert(user);
      const result = await service.addUser({ currentUser: user });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      const updatedUser = await userRepo.findOneOrFail(user.id);
      const expectedWildrcoinData: UserWildrcoinData = {
        waitlistParticipationEvents: [
          {
            // @ts-expect-error
            __typename: 'WildrcoinWaitlistLeaveEvent',
            createdAt: leaveDate.toISOString(),
          },
          {
            __typename: 'WildrcoinWaitlistJoinEvent',
            createdAt: expect.any(String),
          },
        ],
      };
      expect(updatedUser.wildrcoinData).toEqual(expectedWildrcoinData);
    });

    it('should mark wildrcoin waitlist banners as completed', async () => {
      const user = UserEntityFake();
      user.bannerData = {
        bannerInteractions: {
          // id defined in test.env
          ['banner-id']: {
            skipCount: 0,
            lastSkippedAt: new Date().toISOString(),
          },
        },
      };
      await userRepo.insert(user);
      const result = await service.addUser({ currentUser: user });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      const updatedUser = await userRepo.findOneOrFail(user.id);
      expect(updatedUser.bannerData?.bannerInteractions['banner-id']).toEqual({
        skipCount: 0,
        lastSkippedAt: expect.any(String),
        completedAt: expect.any(String),
      });
    });

    it('should return an error if the user has already joined the waitlist', async () => {
      const user = UserEntityFake();
      user.wildrcoinData = {
        waitlistParticipationEvents: [
          {
            __typename: 'WildrcoinWaitlistJoinEvent',
            createdAt: new Date().toISOString(),
          },
        ],
      };
      await userRepo.insert(user);
      const result = await service.addUser({ currentUser: user });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        AlreadyJoinedWildrcoinWaitlistException
      );
    });

    it('should return an error if the find user query fails', async () => {
      const user = UserEntityFake();
      const userRepo = {
        findOne: jest.fn(() => Promise.reject(new Error('error'))),
      };
      const queryRunner = createMockQueryRunner({
        repositories: {
          UserEntity: userRepo,
        },
      });
      const conn = {
        createQueryRunner: jest.fn(() => queryRunner),
      };
      const module = await createMockedTestingModule({
        providers: [
          WildrcoinWaitlistService,
          {
            provide: getConnectionToken(),
            useValue: conn,
          },
          {
            provide: getRepositoryToken(WaitlistEntity),
            useValue: waitlistRepo,
          },
        ],
      });
      const service = module.get(WildrcoinWaitlistService);
      // @ts-expect-error
      service['transactionRetryCount'] = 1;
      const result = await service.addUser({ currentUser: user });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresQueryFailedException
      );
      expect(userRepo.findOne).toHaveBeenCalledTimes(2);
    });

    it('should return an error if the update query fails', async () => {
      const userRepo = {
        findOne: jest.fn(() => Promise.resolve(UserEntityFake())),
        update: jest.fn(() => Promise.reject(new Error('error'))),
      };
      const queryRunner = createMockQueryRunner({
        repositories: {
          UserEntity: userRepo,
        },
      });
      const conn = {
        createQueryRunner: jest.fn(() => queryRunner),
      };
      const module = await createMockedTestingModule({
        providers: [
          WildrcoinWaitlistService,
          {
            provide: getConnectionToken(),
            useValue: conn,
          },
          {
            provide: getRepositoryToken(WaitlistEntity),
            useValue: waitlistRepo,
          },
        ],
      });
      const service = module.get(WildrcoinWaitlistService);
      // @ts-expect-error
      service['transactionRetryCount'] = 1;
      const result = await service.addUser({ currentUser: UserEntityFake() });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresUpdateFailedException
      );
      expect(userRepo.update).toHaveBeenCalledTimes(2);
    });
  });

  describe(WildrcoinWaitlistService.prototype.addEmail, () => {
    it('should add an email to the waitlist', async () => {
      const email = 'email@email.com';
      const result = await service.addEmail({ email });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      const waitlist = await waitlistRepo.findOneOrFail({
        email,
        waitlistType: WaitlistType.WILDRCOIN,
      });
      expect(waitlist).toBeDefined();
    });

    it('should not create a duplicate waitlist entry if one already exists', async () => {
      const email = 'email@email.com';
      const result = await service.addEmail({ email });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      const result2 = await service.addEmail({ email });
      expect(result2.isOk()).toBe(true);
      expect(result2._unsafeUnwrap()).toBe(true);
      const waitlists = await waitlistRepo.find({
        email,
        waitlistType: WaitlistType.WILDRCOIN,
      });
      expect(waitlists).toHaveLength(1);
    });

    it('should handle an error from the upsert', async () => {
      const email = 'email';
      const waitlistRepo = module.get(getRepositoryToken(WaitlistEntity));
      jest
        .spyOn(waitlistRepo, 'upsert')
        .mockImplementationOnce(() => Promise.reject(new Error('error')));
      const result = await service.addEmail({ email });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        PostgresUpsertFailedException
      );
    });
  });
});
