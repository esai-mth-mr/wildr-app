import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import {
  BadRequestException,
  BadRequestExceptionCodes,
  DebugData,
  InternalServerErrorException,
  NotFoundException,
  NotFoundExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';
import {
  TimepointEntity,
  TimepointState,
  toTimepointNotificationTuple,
} from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.entity';
import {
  NotificationConfigService,
  ScheduledNotificationType,
} from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { Result, err, ok } from 'neverthrow';
import {
  EntityManager,
  FindOneOptions,
  QueryFailedError,
  QueryRunner,
  Repository,
} from 'typeorm';
import { Logger } from 'winston';
import { createHash } from 'crypto';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  BadTimezoneOffsetException,
  UserNotFoundException,
} from '@verdzie/server/user/user.service';
import { ID_SEPARATOR } from '@verdzie/server/common/generateId';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { POSTGRES_UNIQUE_VIOLATION_CODE } from '@verdzie/server/typeorm/postgres-driver.constants';
import { WildrMethodLatencyHistogram } from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import { InjectRepository } from '@nestjs/typeorm';
import { TimepointSchema } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.schema';
import { UserSchema } from '@verdzie/server/user/user.schema';
import { isValidTimezoneOffset } from '@verdzie/server/interceptors/user-timezone-update.interceptor';
import { getTimezoneOffsetString } from '@verdzie/server/notification-scheduler/notification-scheduler.common';

export function getRecipientShardKey({
  recipientId,
  shardingFactor,
}: {
  recipientId: string;
  shardingFactor: number;
}): number {
  const hash = createHash('md5').update(recipientId).digest('hex');
  return parseInt(hash, 16) % shardingFactor;
}

export function toTimepointId({
  hour,
  parentId,
  shardKey,
}: {
  hour: number;
  parentId: string;
  shardKey: number;
}): string {
  return hour + ID_SEPARATOR + parentId + ID_SEPARATOR + shardKey;
}

@Injectable()
export class TimepointService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(TimepointSchema)
    private timepointRepo: Repository<TimepointEntity>,
    @InjectRepository(UserSchema)
    private userRepo: Repository<UserEntity>,
    private notificationConfigService: NotificationConfigService
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  @WildrMethodLatencyHistogram()
  async scheduleNotification({
    parentId,
    recipientId,
    notificationType,
  }: {
    parentId: string;
    recipientId: string;
    notificationType: ScheduledNotificationType;
  }): Promise<
    Result<
      undefined,
      | TimepointNotFoundException
      | TimepointNotificationAlreadyAddedException
      | UserNotFoundException
      | BadTimezoneOffsetException
      | InternalServerErrorException
    >
  > {
    let queryRunner: QueryRunner | undefined;
    try {
      const recipient = await this.userRepo.findOne(recipientId);
      if (!recipient) {
        return err(
          new UserNotFoundException({
            recipientId,
            methodName: 'scheduleNotification',
          })
        );
      }
      const configResult = this.notificationConfigService.get(notificationType);
      if (configResult.isErr()) {
        return err(configResult.error);
      }
      if (!isValidTimezoneOffset(recipient.localizationData?.timezoneOffset))
        return err(
          new BadTimezoneOffsetException({
            recipientId,
            methodName: 'scheduleNotification',
          })
        );
      const hour = DateTime.now()
        .setZone(
          getTimezoneOffsetString(recipient.localizationData!.timezoneOffset!)
        )
        .set({
          hour: configResult.value?.hour,
          minute: 0,
          second: 0,
          millisecond: 0,
        })
        .toUTC().hour;
      const startEndResult = await configResult.value.getStartAndEnd({
        parentId,
      });
      if (startEndResult.isErr()) {
        return err(startEndResult.error);
      }
      const headTimepointResult = await this.findOrCreate({
        timepointId: toTimepointId({
          hour,
          parentId,
          shardKey: 0,
        }),
        startDate: startEndResult.value.start,
        expirationDate: startEndResult.value.end,
      });
      if (headTimepointResult.isErr()) {
        return err(headTimepointResult.error);
      }
      queryRunner = this.timepointRepo.manager.connection.createQueryRunner();
      await queryRunner.startTransaction();
      const addNotificationTimepointResult = await this.addNotification({
        timepointId: toTimepointId({
          hour,
          parentId,
          shardKey: getRecipientShardKey({
            recipientId,
            shardingFactor: headTimepointResult.value.shardingFactor,
          }),
        }),
        notificationType,
        recipientId,
        manager: queryRunner.manager,
      });
      await queryRunner.manager.increment(
        TimepointEntity,
        { id: headTimepointResult.value.id },
        'totalNotifications',
        1
      );
      if (addNotificationTimepointResult.isErr()) {
        await queryRunner.rollbackTransaction();
        return err(addNotificationTimepointResult.error);
      }
      await queryRunner.commitTransaction();
      return ok(undefined);
    } catch (error) {
      await queryRunner?.rollbackTransaction().catch(error => {
        this.logger.warn(
          '[scheduleNotification] Failed to rollback transaction',
          error
        );
      });
      return err(
        new InternalServerErrorException(
          '[scheduleNotification] ' + error,
          {
            parentId,
            recipientId,
            notificationType,
            methodName: 'scheduleNotification',
          },
          error
        )
      );
    } finally {
      await queryRunner?.release();
    }
  }

  async addNotification({
    timepointId,
    notificationType,
    recipientId,
    manager,
  }: {
    timepointId: string;
    notificationType: ScheduledNotificationType;
    recipientId: string;
    manager: EntityManager;
  }): Promise<
    Result<
      TimepointEntity,
      | TimepointNotFoundException
      | TimepointNotificationAlreadyAddedException
      | InternalServerErrorException
    >
  > {
    try {
      const configResult = this.notificationConfigService.get(notificationType);
      if (configResult.isErr()) {
        return err(configResult.error);
      }
      const startEndResult = await configResult.value.getStartAndEnd({
        parentId: timepointId.split(ID_SEPARATOR)[1],
      });
      if (startEndResult.isErr()) {
        return err(startEndResult.error);
      }
      const timepointResult = await this.findOrCreate({
        timepointId,
        manager,
        startDate: startEndResult.value.start,
        expirationDate: startEndResult.value.end,
      });
      if (timepointResult.isErr()) {
        return err(timepointResult.error);
      }
      const newNotificationTuple = toTimepointNotificationTuple({
        notificationType,
        recipientId,
      });
      if (timepointResult.value.notificationTuples) {
        const existingNotificationTuple =
          timepointResult.value.notificationTuples.find(
            tuple => tuple === newNotificationTuple
          );
        if (existingNotificationTuple) {
          return err(
            new TimepointNotificationAlreadyAddedException({
              timepointId,
              notificationType,
              recipientId,
              methodName: 'addNotificationToTimepoint',
            })
          );
        }
      } else {
        timepointResult.value.notificationTuples = [];
      }
      timepointResult.value.notificationTuples.push(newNotificationTuple);
      await manager.update(TimepointEntity, timepointId, {
        notificationTuples: timepointResult.value.notificationTuples,
      });
      return ok(timepointResult.value);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[addNotificationToTimepoint] ' + error,
          {
            timepointId,
            notificationType,
            recipientId,
            methodName: 'addNotificationToTimepoint',
          },
          error
        )
      );
    }
  }

  async findOrCreate({
    timepointId,
    startDate,
    expirationDate,
    manager,
    findOptions,
  }: {
    timepointId: string;
    startDate: Date;
    expirationDate?: Date;
    manager?: EntityManager;
    findOptions?: FindOneOptions<TimepointEntity>;
  }): Promise<
    Result<
      TimepointEntity,
      TimepointNotFoundException | InternalServerErrorException
    >
  > {
    const repo = manager?.getRepository(TimepointEntity) ?? this.timepointRepo;
    try {
      const existingFeed = await repo.findOne(timepointId, findOptions);
      if (existingFeed) {
        return ok(existingFeed);
      }
      const timepoint = new TimepointEntity({
        id: timepointId,
        processMetadata: {
          startDate,
          expirationDate,
        },
        state: TimepointState.ACTIVE,
      });
      await repo.insert(timepoint);
      return ok(timepoint);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError.code === POSTGRES_UNIQUE_VIOLATION_CODE
      ) {
        const timepoint = await repo.findOne(timepointId, findOptions);
        if (!timepoint) {
          return err(
            new TimepointNotFoundException({
              timepointId,
              methodName: 'findOrCreateTimepointWithId',
            })
          );
        }
        return ok(timepoint);
      }
      return err(
        new InternalServerErrorException(
          '[findOrCreateTimepointWithId] ' + error,
          {
            timepointId,
            methodName: 'findOrCreateTimepointWithId',
          },
          error
        )
      );
    }
  }

  async removeNotificationFromTimepoint({
    timepointId,
    notificationType,
    recipientId,
    manager,
  }: {
    timepointId: string;
    notificationType: ScheduledNotificationType;
    recipientId: string;
    manager: EntityManager;
  }): Promise<
    Result<
      TimepointEntity,
      | TimepointNotFoundException
      | TimepointNotificationNotScheduledException
      | InternalServerErrorException
    >
  > {
    try {
      const timepointRepo = manager.getRepository(TimepointEntity);
      const timepoint = await timepointRepo.findOne(timepointId);
      if (!timepoint) {
        return err(
          new TimepointNotFoundException({
            timepointId,
            notificationType,
            recipientId,
            methodName: 'removeNotificationFromTimepoint',
          })
        );
      }
      const newNotificationTuple = toTimepointNotificationTuple({
        notificationType,
        recipientId,
      });
      if (!timepoint.notificationTuples) {
        return err(
          new TimepointNotificationNotScheduledException({
            timepointId,
            notificationType,
            recipientId,
            methodName: 'removeNotificationFromTimepoint',
          })
        );
      }
      const existingNotificationIndex = timepoint.notificationTuples.findIndex(
        tuple => tuple === newNotificationTuple
      );
      if (existingNotificationIndex === -1) {
        return err(
          new TimepointNotificationNotScheduledException({
            timepointId,
            notificationType,
            recipientId,
            methodName: 'removeNotificationFromTimepoint',
          })
        );
      }
      timepoint.notificationTuples.splice(existingNotificationIndex, 1);
      await timepointRepo.update(timepointId, {
        notificationTuples: timepoint.notificationTuples,
      });
      return ok(timepoint);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[removeNotificationFromTimepoint] ' + error,
          {
            timepointId,
            notificationType,
            recipientId,
            methodName: 'removeNotificationFromTimepoint',
          },
          error
        )
      );
    }
  }

  @WildrMethodLatencyHistogram()
  async cancelNotification({
    parentId,
    recipientId,
    notificationType,
  }: {
    parentId: string;
    recipientId: string;
    notificationType: ScheduledNotificationType;
  }): Promise<
    Result<
      undefined,
      | TimepointNotFoundException
      | TimepointNotificationNotScheduledException
      | BadTimezoneOffsetException
      | InternalServerErrorException
    >
  > {
    let queryRunner: QueryRunner | undefined;
    try {
      const recipient = await this.userRepo.findOne(recipientId);
      if (!recipient) {
        return err(
          new UserNotFoundException({
            recipientId,
            methodName: 'scheduleNotification',
          })
        );
      }
      const configResult = this.notificationConfigService.get(notificationType);
      if (configResult.isErr()) {
        return err(configResult.error);
      }
      if (!isValidTimezoneOffset(recipient.localizationData?.timezoneOffset))
        return err(
          new BadTimezoneOffsetException({
            recipientId,
            methodName: 'cancelNotification',
          })
        );
      const hour = DateTime.now()
        .setZone(
          getTimezoneOffsetString(recipient.localizationData!.timezoneOffset!)
        )
        .set({
          hour: configResult.value.hour,
          minute: 0,
          second: 0,
          millisecond: 0,
        })
        .toUTC().hour;
      const headTimepoint = await this.timepointRepo.findOne(
        toTimepointId({
          hour,
          parentId,
          shardKey: 0,
        })
      );
      if (!headTimepoint) {
        return err(
          new TimepointNotFoundException({
            message: 'Head timepoint not found',
            recipientId,
            parentId,
            methodName: 'cancelNotification',
          })
        );
      }
      queryRunner = this.timepointRepo.manager.connection.createQueryRunner();
      await queryRunner.startTransaction();
      const removeNotificationFromTimepointResult =
        await this.removeNotificationFromTimepoint({
          timepointId: toTimepointId({
            hour,
            parentId,
            shardKey: getRecipientShardKey({
              recipientId,
              shardingFactor: headTimepoint.shardingFactor,
            }),
          }),
          notificationType,
          recipientId,
          manager: queryRunner.manager,
        });
      if (removeNotificationFromTimepointResult.isErr()) {
        await queryRunner.rollbackTransaction();
        return err(removeNotificationFromTimepointResult.error);
      }
      await queryRunner.manager.decrement(
        TimepointEntity,
        { id: headTimepoint.id },
        'totalNotifications',
        1
      );
      await queryRunner.commitTransaction();
      return ok(undefined);
    } catch (error) {
      await queryRunner?.rollbackTransaction().catch(error => {
        this.logger.warn(
          '[cancelNotification] Failed to rollback transaction',
          error
        );
      });
      return err(
        new InternalServerErrorException(
          '[cancelNotification] ' + error,
          {
            parentId,
            recipientId,
            notificationType,
            methodName: 'cancelNotification',
          },
          error
        )
      );
    } finally {
      await queryRunner?.release();
    }
  }
}

export class TimepointNotFoundException extends NotFoundException {
  constructor(debugData: DebugData<NotFoundExceptionCodes> = {}) {
    super(debugData.message || 'Timepoint not found', {
      ...debugData,
      exceptionCode: NotFoundExceptionCodes.TIMEPOINT_NOT_FOUND,
    });
  }
}

export class TimepointNotificationNotScheduledException extends BadRequestException {
  constructor(debugData: DebugData<BadRequestExceptionCodes> = {}) {
    super('Timepoint notification has not been scheduled', {
      ...debugData,
      exceptionCode:
        BadRequestExceptionCodes.TIMEPOINT_NOTIFICATION_NOT_SCHEDULED,
    });
  }
}

export class TimepointNotificationAlreadyAddedException extends BadRequestException {
  constructor(debugData: DebugData<BadRequestExceptionCodes> = {}) {
    super('Timepoint notification already added', {
      ...debugData,
      exceptionCode:
        BadRequestExceptionCodes.TIMEPOINT_NOTIFICATION_ALREADY_ADDED,
    });
  }
}
