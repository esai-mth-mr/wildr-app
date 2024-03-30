import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { TimepointEntityFake } from '@verdzie/server/notification-scheduler/composer/timepoint/testing/timepoint-entity.fake';
import {
  TimepointEntity,
  toTimepointNotificationTuple,
} from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.entity';
import { TimepointSchema } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.schema';
import {
  TimepointNotFoundException,
  TimepointNotificationAlreadyAddedException,
  TimepointNotificationNotScheduledException,
  TimepointService,
  getRecipientShardKey,
  toTimepointId,
} from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.service';
import {
  NotificationConfigNotFoundException,
  ScheduledNotificationType,
} from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import {
  createMockQueryRunner,
  createMockRepo,
  createMockedTestingModule,
} from '@verdzie/server/testing/base.module';
import { POSTGRES_UNIQUE_VIOLATION_CODE } from '@verdzie/server/typeorm/postgres-driver.constants';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserSchema } from '@verdzie/server/user/user.schema';
import {
  BadTimezoneOffsetException,
  UserNotFoundException,
} from '@verdzie/server/user/user.service';
import { err, ok } from 'neverthrow';
import { QueryFailedError } from 'typeorm';

describe('TimepointService', () => {
  let service: TimepointService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        TimepointService,
        {
          provide: getRepositoryToken(TimepointSchema),
          useValue: {},
        },
        {
          provide: getRepositoryToken(UserSchema),
          useValue: {},
        },
      ],
    });
    service = module.get(TimepointService);
  });

  const getTimepointsWithHeadAndRecipientShards = (recipient: UserEntity) => {
    return [
      TimepointEntityFake({
        id: '1#parentId#0',
        shardingFactor: 10,
      }),
      TimepointEntityFake({
        id: `1#parentId#${getRecipientShardKey({
          recipientId: recipient.id,
          shardingFactor: 10,
        })}`,
      }),
    ];
  };

  describe('scheduleNotification', () => {
    it('should return an error if the user is not found', async () => {
      const users: UserEntity[] = [];
      service['userRepo'] = createMockRepo({ entities: users }) as any;
      const result = await service.scheduleNotification({
        parentId: 'parentId',
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(UserNotFoundException);
    });

    it('should return an error if the the notification config is not found', async () => {
      const users = [
        UserEntityFake({
          id: 'recipientId',
          localizationData: { timezoneOffset: '+00:00' },
        }),
      ];
      service['userRepo'] = createMockRepo({ entities: users }) as any;
      service['notificationConfigService'] = {
        notificationTypes: [],
        get: jest
          .fn()
          .mockImplementation(() =>
            err(new NotificationConfigNotFoundException())
          ),
      } as any;
      const result = await service.scheduleNotification({
        parentId: 'parentId',
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        NotificationConfigNotFoundException
      );
    });

    it('should add the notification tuple to the correct shard', async () => {
      const users = [
        UserEntityFake({
          id: 'recipientId',
          localizationData: {
            timezoneOffset: '-04:00',
          },
        }),
      ];
      service['userRepo'] = createMockRepo({ entities: users }) as any;
      service['notificationConfigService'] = {
        notificationTypes: [
          ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        ],
        get: jest.fn().mockImplementation(() =>
          ok({
            hour: 1,
            getStartAndEnd: jest.fn().mockResolvedValue(
              ok({
                start: new Date(),
                end: new Date(),
              })
            ),
          })
        ),
      } as any;
      const timepoints = getTimepointsWithHeadAndRecipientShards(users[0]);
      const managerUpdate = jest.fn();
      const queryRunner = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        manager: {
          increment: jest.fn(),
          update: managerUpdate,
          getRepository: jest.fn().mockImplementation(() => timepointRepo),
        },
        release: jest.fn(),
        rollbackTransaction: jest.fn(),
      };
      const manager = {
        connection: {
          createQueryRunner: jest.fn().mockImplementation(() => queryRunner),
        },
      };
      const timepointRepo = createMockRepo({ entities: timepoints }) as any;
      timepointRepo.manager = manager;
      service['timepointRepo'] = timepointRepo as any;
      const result = await service.scheduleNotification({
        parentId: 'parentId',
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(managerUpdate).toHaveBeenCalledWith(
        TimepointEntity,
        `5#parentId#${getRecipientShardKey({
          recipientId: 'recipientId',
          shardingFactor: 10,
        })}`,
        {
          notificationTuples: [
            toTimepointNotificationTuple({
              recipientId: 'recipientId',
              notificationType:
                ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
            }),
          ],
        }
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should increment the total notification count', async () => {
      const users = [
        UserEntityFake({
          id: 'recipientId',
          localizationData: {
            timezoneOffset: '+08:00',
          },
        }),
      ];
      service['userRepo'] = createMockRepo({ entities: users }) as any;
      service['notificationConfigService'] = {
        notificationTypes: [
          ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        ],
        get: jest.fn().mockImplementation(() =>
          ok({
            hour: 16,
            getStartAndEnd: jest.fn().mockResolvedValue(
              ok({
                start: new Date(),
                end: new Date(),
              })
            ),
          })
        ),
      } as any;
      const timepoints = getTimepointsWithHeadAndRecipientShards(users[0]);
      const managerIncrement = jest.fn();
      const queryRunner = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        manager: {
          increment: managerIncrement,
          update: jest.fn(),
          getRepository: jest.fn().mockImplementation(() => timepointRepo),
        },
        release: jest.fn(),
        rollbackTransaction: jest.fn(),
      };
      const manager = {
        connection: {
          createQueryRunner: jest.fn().mockImplementation(() => queryRunner),
        },
      };
      const timepointRepo = createMockRepo({ entities: timepoints }) as any;
      timepointRepo.manager = manager;
      service['timepointRepo'] = timepointRepo as any;
      const result = await service.scheduleNotification({
        parentId: 'parentId',
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(managerIncrement).toHaveBeenCalledWith(
        TimepointEntity,
        { id: `8#parentId#0` },
        'totalNotifications',
        1
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle unknown errors', async () => {
      const users = [
        UserEntityFake({
          id: 'recipientId',
        }),
      ];
      service['userRepo'] = createMockRepo({ entities: users }) as any;
      service['notificationConfigService'] = {
        notificationTypes: [
          ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        ],
        get: jest.fn().mockImplementation(() =>
          ok({
            hour: 1,
            getStartAndEnd: jest.fn().mockResolvedValue(
              ok({
                start: new Date(),
                end: new Date(),
              })
            ),
          })
        ),
      } as any;
      const timepoints = getTimepointsWithHeadAndRecipientShards(users[0]);
      const managerIncrement = jest.fn();
      const queryRunner = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        manager: {
          increment: managerIncrement,
          update: jest.fn().mockRejectedValue(new Error()),
          getRepository: jest.fn().mockImplementation(() => timepointRepo),
        },
        release: jest.fn(),
        rollbackTransaction: jest.fn(),
      };
      const manager = {
        connection: {
          createQueryRunner: jest.fn().mockImplementation(() => queryRunner),
        },
      };
      const timepointRepo = createMockRepo({ entities: timepoints }) as any;
      timepointRepo.manager = manager;
      timepointRepo.update = jest.fn().mockRejectedValue(new Error());
      service['timepointRepo'] = timepointRepo as any;
      const result = await service.scheduleNotification({
        parentId: 'parentId',
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InternalServerErrorException
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('addNotification', () => {
    it('should return an error if the notification has already been added', async () => {
      const timepoint = TimepointEntityFake({
        notificationTuples: [
          toTimepointNotificationTuple({
            recipientId: 'recipientId',
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          }),
        ],
      });
      const timepoints = [timepoint];
      const timepointRepo = createMockRepo({ entities: timepoints }) as any;
      const manager = {
        getRepository: jest.fn().mockImplementation(() => timepointRepo),
      };
      timepointRepo.manager = manager;
      service['timepointRepo'] = timepointRepo as any;
      service['notificationConfigService'] = {
        notificationTypes: [
          ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        ],
        get: jest.fn().mockImplementation(() =>
          ok({
            hour: 1,
            getStartAndEnd: jest.fn().mockResolvedValue(
              ok({
                start: new Date(),
                end: new Date(),
              })
            ),
          })
        ),
      } as any;
      const result = await service.addNotification({
        timepointId: timepoint.id,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        recipientId: 'recipientId',
        manager: manager as any,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TimepointNotificationAlreadyAddedException
      );
    });

    it('should update the timepoint with the new notification tuple', async () => {
      const timepoint = TimepointEntityFake();
      const timepoints = [timepoint];
      const timepointRepo = createMockRepo({ entities: timepoints }) as any;
      const manager = {
        getRepository: jest.fn().mockImplementation(() => timepointRepo),
        update: jest.fn(),
      };
      timepointRepo.manager = manager;
      service['timepointRepo'] = timepointRepo as any;
      service['notificationConfigService'] = {
        notificationTypes: [
          ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        ],
        get: jest.fn().mockImplementation(() =>
          ok({
            hour: 1,
            getStartAndEnd: jest.fn().mockResolvedValue(
              ok({
                start: new Date(),
                end: new Date(),
              })
            ),
          })
        ),
      } as any;
      const result = await service.addNotification({
        timepointId: timepoint.id,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        recipientId: 'recipientId',
        manager: manager as any,
      });
      expect(result._unsafeUnwrap().notificationTuples).toEqual([
        toTimepointNotificationTuple({
          recipientId: 'recipientId',
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        }),
      ]);
      expect(manager.update).toHaveBeenCalledWith(
        TimepointEntity,
        timepoint.id,
        {
          notificationTuples: [
            toTimepointNotificationTuple({
              recipientId: 'recipientId',
              notificationType:
                ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
            }),
          ],
        }
      );
    });

    it('should catch other errors', async () => {
      const timepoint = TimepointEntityFake();
      const timepoints = [timepoint];
      const timepointRepo = createMockRepo({ entities: timepoints }) as any;
      const manager = {
        getRepository: jest.fn().mockImplementation(() => timepointRepo),
        update: jest.fn().mockRejectedValue(new Error()),
      };
      timepointRepo.manager = manager;
      service['timepointRepo'] = timepointRepo as any;
      service['notificationConfigService'] = {
        notificationTypes: [
          ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        ],
        get: jest.fn().mockImplementation(() =>
          ok({
            hour: 1,
            getStartAndEnd: jest.fn().mockResolvedValue(
              ok({
                start: new Date(),
                end: new Date(),
              })
            ),
          })
        ),
      } as any;
      const result = await service.addNotification({
        timepointId: 'id',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        recipientId: 'recipientId',
        manager: manager as any,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InternalServerErrorException
      );
    });
  });

  describe('findOrCreate', () => {
    it('should return an existing timepoint', async () => {
      const timepoint = TimepointEntityFake();
      const timepoints = [timepoint];
      const timepointRepo = createMockRepo({ entities: timepoints }) as any;
      const manager = {
        getRepository: jest.fn().mockImplementation(() => timepointRepo),
      };
      const result = await service.findOrCreate({
        timepointId: timepoint.id,
        manager: manager as any,
        startDate: new Date(),
        expirationDate: new Date(),
      });
      expect(result._unsafeUnwrap()).toBe(timepoint);
    });

    it('should use the injected repo if one is not provided', async () => {
      const timepoint = TimepointEntityFake();
      const timepoints = [timepoint];
      const timepointRepo = createMockRepo({ entities: timepoints }) as any;
      service['timepointRepo'] = timepointRepo as any;
      const result = await service.findOrCreate({
        timepointId: timepoint.id,
        startDate: new Date(),
        expirationDate: new Date(),
      });
      expect(result._unsafeUnwrap()).toBe(timepoint);
    });

    it('should create a new timepoint with a given id', async () => {
      const timepointRepo = {
        findOne: jest.fn().mockImplementation(async () => undefined),
        insert: jest.fn().mockImplementation(async (t: any) => t),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(() => timepointRepo),
      };
      const result = await service.findOrCreate({
        timepointId: 'id',
        manager: manager as any,
        startDate: new Date(),
        expirationDate: new Date(),
      });
      expect(result._unsafeUnwrap().id).toEqual('id');
    });

    it('should find the conflicting timepoint if one is created in the meantime', async () => {
      const timepoint = TimepointEntityFake();
      const timepointRecords = [timepoint];
      let callCount = 0;
      const timepointRepo = {
        findOne: jest.fn().mockImplementation(async (id: string) => {
          if (!callCount) {
            callCount++;
            throw new QueryFailedError('', [], {
              code: POSTGRES_UNIQUE_VIOLATION_CODE,
            });
          }
          return timepointRecords.find(t => t.id === id);
        }),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(() => timepointRepo),
      };
      const result = await service.findOrCreate({
        timepointId: timepoint.id,
        manager: manager as any,
        startDate: new Date(),
        expirationDate: new Date(),
      });
      expect(result._unsafeUnwrap()).toBe(timepoint);
    });

    it('should catch other errors', async () => {
      const timepointRepo = {
        findOne: jest.fn().mockImplementation(async () => {
          throw new Error();
        }),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(() => timepointRepo),
      };
      const result = await service.findOrCreate({
        timepointId: 'id',
        manager: manager as any,
        startDate: new Date(),
        expirationDate: new Date(),
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InternalServerErrorException
      );
    });
  });

  describe('removeNotificationFromTimepoint', () => {
    it('should return an error if the timepoint is not found', async () => {
      const timepointRepo = {
        findOne: jest.fn().mockImplementation(async () => undefined),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(() => timepointRepo),
      };
      const result = await service.removeNotificationFromTimepoint({
        timepointId: 'id',
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        manager: manager as any,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TimepointNotFoundException
      );
    });

    it('should return an error if the notification is not found', async () => {
      const timepoint = TimepointEntityFake();
      const timepoints = [timepoint];
      const timepointRepo = createMockRepo({ entities: timepoints }) as any;
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === TimepointEntity) {
            return timepointRepo;
          }
        }),
      };
      const result = await service.removeNotificationFromTimepoint({
        timepointId: timepoint.id,
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        manager: manager as any,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TimepointNotificationNotScheduledException
      );
    });

    it('should remove the notification from the timepoint', async () => {
      const timepoint = TimepointEntityFake({
        id: toTimepointId({
          hour: 1,
          parentId: 'parentId',
          shardKey: getRecipientShardKey({
            recipientId: 'recipientId',
            shardingFactor: 10,
          }),
        }),
        notificationTuples: [
          toTimepointNotificationTuple({
            recipientId: 'recipientId',
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          }),
        ],
      });
      const headTimepoint = TimepointEntityFake({
        id: toTimepointId({
          hour: 1,
          parentId: 'parentId',
          shardKey: 0,
        }),
      });
      const timepoints = [timepoint, headTimepoint];
      const timepointRepo = createMockRepo({ entities: timepoints }) as any;
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === TimepointEntity) {
            return timepointRepo;
          }
        }),
      };
      const result = await service.removeNotificationFromTimepoint({
        timepointId: timepoint.id,
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        manager: manager as any,
      });
      const resultingTimepoint = result._unsafeUnwrap();
      expect(resultingTimepoint.notificationTuples).toEqual([]);
      expect(timepointRepo.update).toHaveBeenCalledWith(timepoint.id, {
        notificationTuples: [],
      });
    });

    it('should catch other errors', async () => {
      const timepoint = TimepointEntityFake({
        id: toTimepointId({
          hour: 1,
          parentId: 'parentId',
          shardKey: getRecipientShardKey({
            recipientId: 'recipientId',
            shardingFactor: 10,
          }),
        }),
        notificationTuples: [
          toTimepointNotificationTuple({
            recipientId: 'recipientId',
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          }),
        ],
      });
      const headTimepoint = TimepointEntityFake({
        id: toTimepointId({
          hour: 1,
          parentId: 'parentId',
          shardKey: 0,
        }),
      });
      const timepoints = [timepoint, headTimepoint];
      const timepointRepo = {
        findOne: jest
          .fn()
          .mockImplementation(async () =>
            timepoints.find(t => t.id === timepoint.id)
          ),
        update: jest.fn().mockRejectedValue(new Error()),
      };
      const manager = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === TimepointEntity) {
            return timepointRepo;
          }
        }),
      };
      const result = await service.removeNotificationFromTimepoint({
        timepointId: timepoint.id,
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        manager: manager as any,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InternalServerErrorException
      );
    });
  });

  describe('cancelNotification', () => {
    it('should return an error if the user is not found', async () => {
      const users: UserEntity[] = [];
      service['userRepo'] = createMockRepo({ entities: users }) as any;
      const result = await service.cancelNotification({
        parentId: 'parentId',
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(UserNotFoundException);
    });

    it('should return an error if the notification config is not found', async () => {
      const recipient = UserEntityFake({
        localizationData: {
          timezoneOffset: '+00:00',
        },
      });
      const users: UserEntity[] = [recipient];
      service['userRepo'] = createMockRepo({ entities: users }) as any;
      service['notificationConfigService'] = {
        get: jest
          .fn()
          .mockImplementation(() =>
            err(new NotificationConfigNotFoundException())
          ),
      } as any;
      const result = await service.cancelNotification({
        parentId: 'parentId',
        recipientId: recipient.id,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        NotificationConfigNotFoundException
      );
    });

    it('should return an error if invalid timezone offset', async () => {
      const recipient = UserEntityFake({
        localizationData: {
          timezoneOffset: '-0:00',
        },
      });
      const users: UserEntity[] = [recipient];
      service['userRepo'] = createMockRepo({ entities: users }) as any;
      service['notificationConfigService'] = {
        get: jest.fn().mockImplementation(() =>
          ok({
            hour: 1,
          })
        ),
      } as any;
      const result = await service.cancelNotification({
        parentId: 'parentId',
        recipientId: recipient.id,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        BadTimezoneOffsetException
      );
    });

    it('should return an error if the head timepoint is not found', async () => {
      const recipient = UserEntityFake({
        localizationData: {
          timezoneOffset: '+00:00',
        },
      });
      const users: UserEntity[] = [recipient];
      service['userRepo'] = createMockRepo({ entities: users }) as any;
      service['notificationConfigService'] = {
        get: jest.fn().mockImplementation(() =>
          ok({
            hour: 1,
          })
        ),
      } as any;
      service['timepointRepo'] = createMockRepo({}) as any;
      const result = await service.cancelNotification({
        parentId: 'parentId',
        recipientId: recipient.id,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TimepointNotFoundException
      );
    });

    it('should remove the notification from the timepoint', async () => {
      const recipient = UserEntityFake({
        localizationData: {
          timezoneOffset: '+00:00',
        },
      });
      const users: UserEntity[] = [recipient];
      service['userRepo'] = createMockRepo({ entities: users }) as any;
      service['notificationConfigService'] = {
        notificationTypes: [],
        get: jest.fn().mockImplementation(() =>
          ok({
            hour: 1,
          })
        ),
      } as any;
      const timepoint = TimepointEntityFake({
        id: toTimepointId({
          hour: 1,
          parentId: 'parentId',
          shardKey: getRecipientShardKey({
            recipientId: recipient.id,
            shardingFactor: 10,
          }),
        }),
        notificationTuples: [
          toTimepointNotificationTuple({
            recipientId: recipient.id,
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          }),
        ],
      });
      const headTimepoint = TimepointEntityFake({
        id: toTimepointId({
          hour: 1,
          parentId: 'parentId',
          shardKey: 0,
        }),
      });
      const timepointRepo = createMockRepo({
        entities: [timepoint, headTimepoint],
      }) as any;
      const queryRunner = createMockQueryRunner({
        repositories: { TimepointEntity: timepointRepo },
      });
      timepointRepo.manager = {
        connection: {
          createQueryRunner: jest.fn().mockImplementation(() => queryRunner),
        },
      };
      service['timepointRepo'] = timepointRepo as any;
      const result = await service.cancelNotification({
        parentId: 'parentId',
        recipientId: recipient.id,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(timepointRepo.update).toHaveBeenCalledWith(timepoint.id, {
        notificationTuples: [],
      });
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should decrement the total notification count on the head timepoint', async () => {
      const recipient = UserEntityFake({
        localizationData: { timezoneOffset: '+00:00' },
      });
      const users: UserEntity[] = [recipient];
      service['userRepo'] = createMockRepo({ entities: users }) as any;
      service['notificationConfigService'] = {
        get: jest.fn().mockImplementation(() =>
          ok({
            hour: 1,
          })
        ),
      } as any;
      const timepoint = TimepointEntityFake({
        id: toTimepointId({
          hour: 1,
          parentId: 'parentId',
          shardKey: getRecipientShardKey({
            recipientId: recipient.id,
            shardingFactor: 10,
          }),
        }),
        notificationTuples: [
          toTimepointNotificationTuple({
            recipientId: recipient.id,
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          }),
        ],
      });
      const headTimepoint = TimepointEntityFake({
        id: toTimepointId({
          hour: 1,
          parentId: 'parentId',
          shardKey: 0,
        }),
      });
      const timepointRepo = createMockRepo({
        entities: [timepoint, headTimepoint],
      }) as any;
      const queryRunner = createMockQueryRunner({
        repositories: { TimepointEntity: timepointRepo },
      });
      timepointRepo.manager = {
        connection: {
          createQueryRunner: jest.fn().mockImplementation(() => queryRunner),
        },
      };
      service['timepointRepo'] = timepointRepo as any;
      const result = await service.cancelNotification({
        parentId: 'parentId',
        recipientId: recipient.id,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.decrement).toHaveBeenCalledWith(
        TimepointEntity,
        { id: headTimepoint.id },
        'totalNotifications',
        1
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction if an error occurs during removal', async () => {
      const recipient = UserEntityFake({
        localizationData: { timezoneOffset: '+00:00' },
      });
      const users: UserEntity[] = [recipient];
      service['userRepo'] = {
        findOne: jest
          .fn()
          .mockImplementation(async (id: string) =>
            users.find(u => u.id === id)
          ),
      } as any;
      service['notificationConfigService'] = {
        get: jest.fn().mockImplementation(() =>
          ok({
            hour: 1,
          })
        ),
      } as any;
      const timepoint = TimepointEntityFake({
        id: toTimepointId({
          hour: 1,
          parentId: 'parentId',
          shardKey: getRecipientShardKey({
            recipientId: recipient.id,
            shardingFactor: 10,
          }),
        }),
        notificationTuples: [
          toTimepointNotificationTuple({
            recipientId: recipient.id,
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          }),
        ],
      });
      const headTimepoint = TimepointEntityFake({
        id: toTimepointId({
          hour: 1,
          parentId: 'parentId',
          shardKey: 0,
        }),
      });
      const timepointRepo = createMockRepo({
        entities: [timepoint, headTimepoint],
      });
      const queryRunner = createMockQueryRunner({
        repositories: { TimepointEntity: timepointRepo },
      });
      timepointRepo.manager = {
        connection: {
          createQueryRunner: jest.fn().mockImplementation(() => queryRunner),
        },
      };
      timepointRepo.update = jest.fn().mockRejectedValue(new Error());
      service['timepointRepo'] = timepointRepo as any;
      const result = await service.cancelNotification({
        parentId: 'parentId',
        recipientId: recipient.id,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InternalServerErrorException
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(timepointRepo.update).toHaveBeenCalled();
      expect(queryRunner.manager.decrement).toHaveBeenCalledTimes(0);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction if an error occurs during decrement', async () => {
      const recipient = UserEntityFake({
        localizationData: { timezoneOffset: '+00:00' },
      });
      const users: UserEntity[] = [recipient];
      service['userRepo'] = createMockRepo({ entities: users }) as any;
      service['notificationConfigService'] = {
        get: jest.fn().mockImplementation(() =>
          ok({
            hour: 1,
          })
        ),
      } as any;
      const timepoint = TimepointEntityFake({
        id: toTimepointId({
          hour: 1,
          parentId: 'parentId',
          shardKey: getRecipientShardKey({
            recipientId: recipient.id,
            shardingFactor: 10,
          }),
        }),
        notificationTuples: [
          toTimepointNotificationTuple({
            recipientId: recipient.id,
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          }),
        ],
      });
      const headTimepoint = TimepointEntityFake({
        id: toTimepointId({
          hour: 1,
          parentId: 'parentId',
          shardKey: 0,
        }),
      });
      const timepointRepo = createMockRepo({
        entities: [timepoint, headTimepoint],
      }) as any;
      const queryRunner = createMockQueryRunner({
        repositories: { TimepointEntity: timepointRepo },
      });
      queryRunner.manager.decrement = jest.fn().mockRejectedValue(new Error());
      timepointRepo.manager = {
        connection: {
          createQueryRunner: jest.fn().mockImplementation(() => queryRunner),
        },
      };
      service['timepointRepo'] = timepointRepo as any;
      const result = await service.cancelNotification({
        parentId: 'parentId',
        recipientId: recipient.id,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InternalServerErrorException
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(timepointRepo.update).toHaveBeenCalled();
      expect(queryRunner.manager.decrement).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
