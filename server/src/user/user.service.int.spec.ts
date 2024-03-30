import { ActivityStreamService } from '@verdzie/server/activity-stream/activity.stream.service';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { SignUpWithPhoneNumberInput } from '@verdzie/server/graphql';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import { Connection, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DecodedIdToken } from 'firebase-admin/auth';
import { ActivityStreamEntity } from '@verdzie/server/activity-stream/activity.stream.entity';
import { LinkData, LinkSourceType } from '@verdzie/server/generated-graphql';
import { nanoid } from 'nanoid';
import { InviteListRecordingProducer } from '@verdzie/server/worker/invite-list-recording/invite-list-recording.producer';

describe(UserService.name, () => {
  let db: Connection;
  let userRepo: Repository<UserEntity>;
  let feedRepo: Repository<FeedEntity>;
  let activityStreamRepo: Repository<ActivityStreamEntity>;

  beforeAll(async () => {
    db = await getTestConnection();
    await db.synchronize(true);
    userRepo = db.getRepository(UserEntity);
    feedRepo = db.getRepository(FeedEntity);
    activityStreamRepo = db.getRepository(ActivityStreamEntity);
  });

  const cleanDb = async () => {
    await userRepo.delete({});
    await feedRepo.delete({});
    await activityStreamRepo.delete({});
  };

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
    await db.close();
  });

  describe(UserService.prototype.createUser.name, () => {
    const getSignupWithPhoneNumberInput = (
      overrides: Partial<SignUpWithPhoneNumberInput> = {}
    ): SignUpWithPhoneNumberInput => {
      return {
        handle: 'test',
        name: 'test test',
        phoneNumber: '+1234567890',
        fcmToken: nanoid(512),
        ...overrides,
      };
    };

    const getIdToken = (
      overrides: Partial<DecodedIdToken> = {}
    ): DecodedIdToken => {
      return {
        uid: '+1234567890',
        sub: '+1234567890',
        phone_number: '+1234567890',
        aud: 'test',
        auth_time: new Date().getTime(),
        exp: new Date().getTime() + 1000,
        iat: new Date().getTime() - 1000,
        iss: 'test',
        firebase: {
          identities: {
            phone: ['phone'],
          },
          sign_in_provider: 'phone',
        },
        ...overrides,
      };
    };

    const getModuleWithFeedServiceAndActivityService = async () => {
      return await createMockedTestingModule({
        providers: [
          UserService,
          FeedService,
          ActivityStreamService,
          {
            provide: getRepositoryToken(FeedEntity),
            useValue: feedRepo,
          },
          {
            provide: getRepositoryToken(UserEntity),
            useValue: userRepo,
          },
          {
            provide: getRepositoryToken(ActivityStreamEntity),
            useValue: activityStreamRepo,
          },
        ],
      });
    };

    it('should create a user with phone number', async () => {
      const phone = '+1234567890';
      const input = getSignupWithPhoneNumberInput({ phoneNumber: phone });
      const idToken = getIdToken({
        uid: phone,
        sub: phone,
        phone_number: phone,
      });
      const module = await getModuleWithFeedServiceAndActivityService();
      const userService = module.get(UserService);
      const user = await userService.createUser({ input, idToken });
      expect(user).toBeDefined();
      const createdUser = await userRepo.findOneOrFail({ id: user?.id });
      expect(createdUser).toBeDefined();
      expect(createdUser.phoneNumber).toBe(phone);
      expect(createdUser.handle).toBe(input.handle);
      expect(createdUser.name).toBe(input.name);
    });

    it('should record the users referrer', async () => {
      const phone = '+1234567890';
      const linkData = {
        refererId: nanoid(16),
        pseudoUserId: 'test-pseudo-user-id',
        linkId: 'test-link-id',
        sourceId: 'test-source-id',
        sourceType: LinkSourceType.USER,
      };
      const input = getSignupWithPhoneNumberInput({
        phoneNumber: phone,
        linkData,
      });
      const idToken = getIdToken({
        uid: phone,
        sub: phone,
        phone_number: phone,
      });
      const module = await getModuleWithFeedServiceAndActivityService();
      const userService = module.get(UserService);
      const user = await userService.createUser({ input, idToken });
      expect(user).toBeDefined();
      const createdUser = await userRepo.findOneOrFail({ id: user?.id });
      expect(createdUser).toBeDefined();
      expect(createdUser.phoneNumber).toBe(phone);
      expect(createdUser.handle).toBe(input.handle);
      expect(createdUser.name).toBe(input.name);
      expect(createdUser.refererId).toBe(linkData.refererId);
    });

    it('should record the user link data', async () => {
      const phone = '+1234567890';
      const linkData: LinkData = {
        refererId: nanoid(16),
        pseudoUserId: 'test-pseudo-user-id',
        linkId: 'test-link-id',
        sourceId: 'test-source-id',
        sourceType: LinkSourceType.USER,
        otherParams: [{ key: 'test-key', value: 'test-value' }],
      };
      const input = getSignupWithPhoneNumberInput({
        phoneNumber: phone,
        linkData,
      });
      const idToken = getIdToken({
        uid: phone,
        sub: phone,
        phone_number: phone,
      });
      const module = await getModuleWithFeedServiceAndActivityService();
      const userService = module.get(UserService);
      const user = await userService.createUser({ input, idToken });
      expect(user).toBeDefined();
      const createdUser = await userRepo.findOneOrFail({ id: user?.id });
      expect(createdUser).toBeDefined();
      expect(createdUser.signupData).toEqual({
        ...linkData,
        sourceType: 0,
        otherParams: {
          'test-key': 'test-value',
        },
      });
    });

    it('should create job to record invite list', async () => {
      const phone = '+1234567890';
      const linkData: LinkData = {
        refererId: nanoid(16),
        pseudoUserId: 'test-pseudo-user-id',
        linkId: 'test-link-id',
        sourceId: 'test-source-id',
        sourceType: LinkSourceType.USER,
      };
      const input = getSignupWithPhoneNumberInput({
        phoneNumber: phone,
        linkData,
      });
      const idToken = getIdToken({
        uid: phone,
        sub: phone,
        phone_number: phone,
      });
      const module = await getModuleWithFeedServiceAndActivityService();
      const userService = module.get(UserService);
      const user = await userService.createUser({ input, idToken });
      expect(
        module.get(InviteListRecordingProducer).createInviteListRecordingJob
      ).toBeCalledWith({
        referrerId: linkData.refererId,
        inviteeId: user?.id,
      });
    });
  });
});
