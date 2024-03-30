import { ChallengeSchema } from '@verdzie/server/challenge/challenge-data-objects/challenge.schema';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';
import { NotFoundException } from '@verdzie/server/exceptions/wildr.exception';
import { ActivityVerb } from '@verdzie/server/generated-graphql';
import { ChallengeParticipantDailyNotificationConfig } from '@verdzie/server/notification-scheduler/notification-config/configs/challenge-participant-daily-notification.config';
import {
  NotificationConfigNotFoundException,
  ScheduledNotificationType,
} from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import {
  EmptyTimepointException,
  ScheduledNotificationBuilderService,
} from '@verdzie/server/notification-scheduler/orchestrator/notification-builder/notification-builder.service';
import {
  createMockRepo,
  createMockedTestingModule,
} from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { err, ok } from 'neverthrow';

describe('ScheduledNotificationBuilderService', () => {
  let service: ScheduledNotificationBuilderService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [ScheduledNotificationBuilderService],
    });
    service = module.get<ScheduledNotificationBuilderService>(
      ScheduledNotificationBuilderService
    );
  });

  describe.only('buildAndEnqueue', () => {
    const getScheduledNotificationConfig = (
      overrides: Partial<ChallengeParticipantDailyNotificationConfig> = {}
    ) => {
      return jest.fn().mockImplementation((type: ScheduledNotificationType) => {
        const config = {
          type: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          parentSchema: ChallengeSchema,
          time: 1,
          getStartAndEnd: jest.fn().mockReturnValue({
            start: new Date(),
            end: new Date(),
          }),
          getNotificationData: jest.fn().mockReturnValue(
            ok({
              verb: ActivityVerb.CHALLENGE_CREATED,
              activityOwnerId: 'activityOwnerId',
              timestampMs: 1,
              challengeId: 'challengeId',
            })
          ),
          getNotificationString: jest.fn().mockReturnValue(
            ok({
              title: 'title',
              body: 'body',
            })
          ),
          ...overrides,
        };
        if (type === ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY) {
          return ok(config);
        } else {
          return err(new NotificationConfigNotFoundException());
        }
      });
    };

    it('should return error if items is empty', async () => {
      const result = await service.buildAndEnqueue({
        parentId: 'parentId',
        items: [],
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(EmptyTimepointException);
    });

    it('should return error if notificationConfig is not found', async () => {
      service['notificationConfigService'].get = jest
        .fn()
        .mockReturnValue(err(new NotificationConfigNotFoundException()));
      const result = await service.buildAndEnqueue({
        parentId: 'parentId',
        items: [
          {
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
            recipientId: 'recipientId',
          },
        ],
      });
      expect(result.isErr()).toBeTruthy();
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        NotificationConfigNotFoundException
      );
    });

    it('should return error if parent is not found', async () => {
      service['notificationConfigService'].get =
        getScheduledNotificationConfig();
      const challengeRepo = createMockRepo({ entities: [] });
      service['connection'].getRepository = jest
        .fn()
        .mockImplementation(schema => {
          if (schema === ChallengeSchema) {
            return challengeRepo;
          }
        });
      const result = await service.buildAndEnqueue({
        parentId: 'parentId',
        items: [
          {
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
            recipientId: 'recipientId',
          },
        ],
      });
      expect(result.isErr()).toBeTruthy();
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundException);
    });

    it('should create send jobs for each item', async () => {
      const users = Array.from({ length: 10 }, () => UserEntityFake());
      const userRepo = createMockRepo({ entities: users });
      const challenges = [ChallengeEntityFake()];
      const challengeRepo = createMockRepo({ entities: challenges });
      service['notificationConfigService'].get =
        getScheduledNotificationConfig();
      service['connection'].getRepository = jest
        .fn()
        .mockImplementation(schema => {
          if (schema === ChallengeSchema) {
            return challengeRepo;
          }
          if (schema === UserEntity) {
            return userRepo;
          }
        });
      service['notificationSenderProducer'].sendNotification = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      const result = await service.buildAndEnqueue({
        parentId: challenges[0].id,
        items: users.slice(0, 5).map(user => ({
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          recipientId: user.id,
        })),
      });
      expect(result.isOk()).toBeTruthy();
      const calls =
        // @ts-ignore
        service['notificationSenderProducer'].sendNotification.mock.calls;
      expect(calls.length).toBe(5);
      for (const call of calls) {
        expect(call[0].notificationStrings).toEqual({
          title: 'title',
          body: 'body',
        });
        expect(call[0].notificationData).toEqual({
          verb: ActivityVerb.CHALLENGE_CREATED,
          activityOwnerId: 'activityOwnerId',
          timestampMs: 1,
          challengeId: 'challengeId',
        });
        expect(call[0].recipientId).toEqual(call[0].recipientId);
      }
    });

    it('should ignore missing recipients', async () => {
      const users = Array.from({ length: 10 }, () => UserEntityFake());
      const userRepo = createMockRepo({ entities: users });
      const challenges = [ChallengeEntityFake()];
      const challengeRepo = createMockRepo({ entities: challenges });
      service['notificationConfigService'].get =
        getScheduledNotificationConfig();
      service['connection'].getRepository = jest
        .fn()
        .mockImplementation(schema => {
          if (schema === ChallengeSchema) {
            return challengeRepo;
          }
          if (schema === UserEntity) {
            return userRepo;
          }
        });
      service['notificationSenderProducer'].sendNotification = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      const result = await service.buildAndEnqueue({
        parentId: challenges[0].id,
        items: users
          .slice(0, 5)
          .map(user => ({
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
            recipientId: user.id,
          }))
          .concat({
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
            recipientId: 'missing',
          }),
      });
      expect(result.isOk()).toBeTruthy();
      const calls =
        // @ts-ignore
        service['notificationSenderProducer'].sendNotification.mock.calls;
      expect(calls.length).toBe(5);
      for (const call of calls) {
        expect(call[0].notificationStrings).toEqual({
          title: 'title',
          body: 'body',
        });
        expect(call[0].notificationData).toEqual({
          verb: ActivityVerb.CHALLENGE_CREATED,
          activityOwnerId: 'activityOwnerId',
          timestampMs: 1,
          challengeId: 'challengeId',
        });
        expect(call[0].recipientId).toEqual(call[0].recipientId);
      }
    });

    it('should ignore missing notification configs', async () => {
      const users = Array.from({ length: 10 }, () => UserEntityFake());
      const userRepo = createMockRepo({ entities: users });
      const challenges = [ChallengeEntityFake()];
      const challengeRepo = createMockRepo({ entities: challenges });
      service['notificationConfigService'].get =
        getScheduledNotificationConfig();
      service['connection'].getRepository = jest
        .fn()
        .mockImplementation(schema => {
          if (schema === ChallengeSchema) {
            return challengeRepo;
          }
          if (schema === UserEntity) {
            return userRepo;
          }
        });
      service['notificationSenderProducer'].sendNotification = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      const items = users.slice(0, 5).map(user => ({
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        recipientId: user.id,
      }));
      // @ts-ignore
      items[1].notificationType = 'missing';
      const result = await service.buildAndEnqueue({
        parentId: challenges[0].id,
        items,
      });
      expect(result.isOk()).toBeTruthy();
      const calls =
        // @ts-ignore
        service['notificationSenderProducer'].sendNotification.mock.calls;
      expect(calls.length).toBe(4);
      for (const call of calls) {
        expect(call[0].notificationStrings).toEqual({
          title: 'title',
          body: 'body',
        });
        expect(call[0].notificationData).toEqual({
          verb: ActivityVerb.CHALLENGE_CREATED,
          activityOwnerId: 'activityOwnerId',
          timestampMs: 1,
          challengeId: 'challengeId',
        });
        expect(call[0].recipientId).toEqual(call[0].recipientId);
      }
    });

    it('should ignore bad notification data', async () => {
      const users = Array.from({ length: 10 }, () => UserEntityFake());
      const userRepo = createMockRepo({ entities: users });
      const challenges = [ChallengeEntityFake()];
      const challengeRepo = createMockRepo({ entities: challenges });
      service['notificationConfigService'].get = getScheduledNotificationConfig(
        {
          getNotificationData: jest.fn().mockResolvedValue(err(new Error())),
        }
      );
      service['connection'].getRepository = jest
        .fn()
        .mockImplementation(schema => {
          if (schema === ChallengeSchema) {
            return challengeRepo;
          }
          if (schema === UserEntity) {
            return userRepo;
          }
        });
      service['notificationSenderProducer'].sendNotification = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      const result = await service.buildAndEnqueue({
        parentId: challenges[0].id,
        items: users.slice(0, 5).map(user => ({
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          recipientId: user.id,
        })),
      });
      expect(result.isOk()).toBeTruthy();
      const calls =
        // @ts-ignore
        service['notificationSenderProducer'].sendNotification.mock.calls;
      expect(calls.length).toBe(0);
      for (const call of calls) {
        expect(call[0].notificationStrings).toEqual({
          title: 'title',
          body: 'body',
        });
        expect(call[0].notificationData).toEqual({
          verb: ActivityVerb.CHALLENGE_CREATED,
          activityOwnerId: 'activityOwnerId',
          timestampMs: 1,
          challengeId: 'challengeId',
        });
        expect(call[0].recipientId).toEqual(call[0].recipientId);
      }
    });

    it('should ignore bad notification string', async () => {
      const users = Array.from({ length: 10 }, () => UserEntityFake());
      const userRepo = createMockRepo({ entities: users });
      const challenges = [ChallengeEntityFake()];
      const challengeRepo = createMockRepo({ entities: challenges });
      service['notificationConfigService'].get = getScheduledNotificationConfig(
        {
          getNotificationString: jest.fn().mockReturnValue(err(new Error())),
        }
      );
      service['connection'].getRepository = jest
        .fn()
        .mockImplementation(schema => {
          if (schema === ChallengeSchema) {
            return challengeRepo;
          }
          if (schema === UserEntity) {
            return userRepo;
          }
        });
      service['notificationSenderProducer'].sendNotification = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      const result = await service.buildAndEnqueue({
        parentId: challenges[0].id,
        items: users.slice(0, 5).map(user => ({
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          recipientId: user.id,
        })),
      });
      expect(result.isOk()).toBeTruthy();
      const calls =
        // @ts-ignore
        service['notificationSenderProducer'].sendNotification.mock.calls;
      expect(calls.length).toBe(0);
      for (const call of calls) {
        expect(call[0].notificationStrings).toEqual({
          title: 'title',
          body: 'body',
        });
        expect(call[0].notificationData).toEqual({
          verb: ActivityVerb.CHALLENGE_CREATED,
          activityOwnerId: 'activityOwnerId',
          timestampMs: 1,
          challengeId: 'challengeId',
        });
        expect(call[0].recipientId).toEqual(call[0].recipientId);
      }
    });

    it('should catch unexpected errors in the process', async () => {
      const users = Array.from({ length: 10 }, () => UserEntityFake());
      const userRepo = createMockRepo({ entities: users });
      const challenges = [ChallengeEntityFake()];
      const challengeRepo = createMockRepo({ entities: challenges });
      service['notificationConfigService'].get =
        getScheduledNotificationConfig();
      service['connection'].getRepository = jest
        .fn()
        .mockImplementation(schema => {
          if (schema === ChallengeSchema) {
            return challengeRepo;
          }
          if (schema === UserEntity) {
            return userRepo;
          }
        });
      service['notificationSenderProducer'].sendNotification = jest
        .fn()
        .mockRejectedValue(new Error());
      const result = await service.buildAndEnqueue({
        parentId: challenges[0].id,
        items: users.slice(0, 5).map(user => ({
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          recipientId: user.id,
        })),
      });
      expect(result.isErr()).toBeTruthy();
      const calls =
        // @ts-ignore
        service['notificationSenderProducer'].sendNotification.mock.calls;
      expect(calls.length).toBe(1);
      for (const call of calls) {
        expect(call[0].notificationStrings).toEqual({
          title: 'title',
          body: 'body',
        });
        expect(call[0].notificationData).toEqual({
          verb: ActivityVerb.CHALLENGE_CREATED,
          activityOwnerId: 'activityOwnerId',
          timestampMs: 1,
          challengeId: 'challengeId',
        });
        expect(call[0].recipientId).toEqual(call[0].recipientId);
      }
    });
  });
});
