import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ID_SEPARATOR } from '@verdzie/server/common/generateId';
import {
  BadRequestException,
  BadRequestExceptionCodes,
  DebugData,
  InternalServerErrorException,
} from '@verdzie/server/exceptions/wildr.exception';
import {
  fromTimepointNotificationTuple,
  TimepointEntity,
  TimepointState,
} from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.entity';
import { TimepointSchema } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.schema';
import { TimepointNotFoundException } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.service';
import { WildrMethodLatencyHistogram } from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import { ScheduledNotificationBuilderProducer } from '@verdzie/server/worker/scheduled-notification-builder/scheduled-notification-builder.producer';
import { TimepointRecipientDistributionProducer } from '@verdzie/server/worker/timepoint-recipient-distribution/timepoint-recipient-distribution.producer';
import { chunk } from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { err, ok, Result } from 'neverthrow';
import { Like, QueryRunner, Repository } from 'typeorm';
import { Logger } from 'winston';
import { SHARDING_FACTOR } from '@verdzie/server/notification-scheduler/notification-config/configs/notification-config.common';

const TIMEPOINT_OFFSET_JOB_SIZE = 1000;
const TIMEPOINT_BATCH_JOB_SIZE = 100;
const NOTIFICATION_BUILDER_JOB_SIZE = 25;
const ONE_HOUR_MILLISECONDS = 60 * 60 * 1000;

@Injectable()
export class TimepointRecipientDistributionService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(TimepointSchema)
    private timepointRepo: Repository<TimepointEntity>,
    private timepointRecipientDistributionProducer: TimepointRecipientDistributionProducer,
    private notificationBuilderProducer: ScheduledNotificationBuilderProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @WildrMethodLatencyHistogram()
  async createAllUsersJobs({
    notificationContentId,
    notificationType,
  }: {
    notificationContentId: string;
    notificationType: string;
  }): Promise<Result<boolean, InternalServerErrorException>> {
    try {
      const allUsersIds = Array.from(
        { length: SHARDING_FACTOR },
        (_, i) => `U_${i}`
      );
      this.logger.info(
        '[createAllUsersJobs] Created array with all users from timepoint_entity',
        { allUsersIds: allUsersIds.length }
      );

      const allUsersBatches = Array.from(
        { length: Math.ceil(allUsersIds.length / TIMEPOINT_BATCH_JOB_SIZE) },
        (_, i) =>
          allUsersIds.slice(
            i * TIMEPOINT_BATCH_JOB_SIZE,
            (i + 1) * TIMEPOINT_BATCH_JOB_SIZE
          )
      );
      this.logger.info('[createAllUsersJobs] Created array with batches', {
        allUsersBatches: allUsersBatches.length,
      });

      const tasks: Promise<void>[] = allUsersBatches.map(timepointIds =>
        this.timepointRecipientDistributionProducer.processTimepointBatch({
          notificationContentId,
          timepointIds,
        })
      );
      this.logger.info('[createAllUsersJobs] Creating timepoint batch jobs', {
        taskCount: tasks.length,
      });
      await Promise.all(tasks);

      return ok(true);
    } catch (error) {
      this.logger.error('[createAllUsersJobs] Error occurred', { error });
      return err(
        new InternalServerErrorException(
          '[createAllUsersJobs] ' + error,
          {},
          error
        )
      );
    }
  }

  @WildrMethodLatencyHistogram()
  async createTimepointOffsetJobs(): Promise<
    Result<boolean, InternalServerErrorException>
  > {
    try {
      const hour = new Date().getUTCHours();
      const timepointCount = await this.timepointRepo.count({
        where: {
          id: Like(`${hour}${ID_SEPARATOR}%`),
        },
      });
      this.logger.info(
        '[createTimepointOffsetJobs] Found timepoints for hour ',
        { timepointCount, hour }
      );
      const tasks: Promise<void>[] = [];
      for (
        let offset = 0;
        offset < timepointCount;
        offset += TIMEPOINT_OFFSET_JOB_SIZE
      ) {
        tasks.push(
          this.timepointRecipientDistributionProducer.createTimepointBatchJobs({
            hour,
            offset,
          })
        );
      }
      this.logger.info(
        '[createTimepointOffsetJobs] creating timepoint batch jobs',
        { tasks: tasks.length }
      );
      await Promise.all(tasks);
      return ok(true);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[createTimepointOffsetJobs] ' + error,
          {},
          error
        )
      );
    }
  }

  @WildrMethodLatencyHistogram()
  async createTimepointBatchJobs({
    hour,
    offset,
  }: {
    hour: number;
    offset: number;
  }) {
    try {
      const timepoints = await this.timepointRepo.find({
        where: {
          id: Like(`${hour}${ID_SEPARATOR}%`),
        },
        select: ['id'],
        skip: offset,
        take: TIMEPOINT_OFFSET_JOB_SIZE,
        order: {
          id: 'ASC',
        },
      });
      this.logger.info(
        '[createTimepointBatchJobs] Found timepoints for distribution',
        { hour, offset, batchSize: timepoints.length }
      );
      const timepointBatches: string[][] = chunk(
        timepoints.map(t => t.id),
        TIMEPOINT_BATCH_JOB_SIZE
      );
      const tasks: Promise<void>[] = [];
      for (const timepointIds of timepointBatches) {
        tasks.push(
          this.timepointRecipientDistributionProducer.processTimepointBatch({
            timepointIds,
          })
        );
      }
      this.logger.info(
        '[createTimepointBatchJobs] creating timepoint batch jobs',
        { taskCount: tasks.length }
      );
      await Promise.all(tasks);
      return ok(true);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[createTimepointBatchJobs] ' + error,
          {},
          error
        )
      );
    }
  }

  @WildrMethodLatencyHistogram()
  async createTimepointJobs({
    timepointIds,
  }: {
    timepointIds: string[];
  }): Promise<Result<undefined, InternalServerErrorException>> {
    const context = { timepointIds, methodName: 'createTimepointJobs' };
    try {
      this.logger.info('[createTimepointJobs] creating timepoint jobs', {
        ...context,
        timepointCount: timepointIds.length,
      });
      for (const timepointId of timepointIds) {
        await this.timepointRecipientDistributionProducer.createNotificationBuilderJobs(
          {
            timepointId,
          }
        );
      }
      return ok(undefined);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[createTimepointJobs] ' + error,
          context,
          error
        )
      );
    }
  }

  @WildrMethodLatencyHistogram()
  async createNotificationBuilderJobs({
    timepointId,
  }: {
    timepointId: string;
  }): Promise<
    Result<
      undefined,
      | TimepointNotFoundException
      | TimepointAlreadyProcessedException
      | TimepointNotReadyException
      | TimepointExpiredException
      | InternalServerErrorException
    >
  > {
    let queryRunner: QueryRunner | undefined;
    const context = {
      timepointId,
      methodName: 'createNotificationBuilderJobs',
    };
    try {
      queryRunner = this.timepointRepo.manager.connection.createQueryRunner();
      await queryRunner.startTransaction();
      const timepointRepo = queryRunner.manager.getRepository(TimepointEntity);
      const timepoint = await timepointRepo.findOne(timepointId, {
        // Lock to prevent parallel processing of the same timepoint
        lock: { mode: 'pessimistic_write' },
      });
      if (!timepoint) {
        await queryRunner.rollbackTransaction();
        return err(new TimepointNotFoundException(context));
      }
      if (
        timepoint.processMetadata.expirationDate &&
        timepoint.processMetadata.expirationDate < new Date()
      ) {
        if (timepoint.state === TimepointState.ACTIVE) {
          await timepointRepo.update(timepointId, {
            state: TimepointState.TO_BE_ARCHIVED,
          });
          await queryRunner.commitTransaction();
          return err(new TimepointExpiredException(context));
        }
        await queryRunner.rollbackTransaction();
        return err(new TimepointExpiredException(context));
      }
      if (timepoint.processMetadata.startDate > new Date()) {
        await queryRunner.rollbackTransaction();
        return err(new TimepointNotReadyException(context));
      }
      if (
        timepoint.processMetadata.lastProcessedAt &&
        timepoint.processMetadata.lastProcessedAt >
          new Date(Date.now() - ONE_HOUR_MILLISECONDS)
      ) {
        await queryRunner.rollbackTransaction();
        return err(new TimepointAlreadyProcessedException(context));
      }
      if (timepoint.notificationTuples?.length === 0) {
        await queryRunner.rollbackTransaction();
        this.logger.info(
          '[createNotificationBuilderJobs] No notifications',
          context
        );
        return ok(undefined);
      }
      const notificationTupleBatches = chunk(
        timepoint.notificationTuples,
        NOTIFICATION_BUILDER_JOB_SIZE
      );
      for (const notificationTupleBatch of notificationTupleBatches) {
        await this.notificationBuilderProducer.createJob({
          parentId: timepoint.id.split(ID_SEPARATOR)[1],
          items: notificationTupleBatch.map(fromTimepointNotificationTuple),
        });
      }
      await timepointRepo.update(timepointId, {
        processMetadata: {
          ...timepoint.processMetadata,
          lastProcessedAt: new Date(),
        },
      });
      await queryRunner.commitTransaction();
      return ok(undefined);
    } catch (error) {
      await queryRunner?.rollbackTransaction().catch(error => {
        this.logger.error(
          '[parseTimepointNotifications] Failed to rollback transaction',
          { error, ...context }
        );
      });
      return err(
        new InternalServerErrorException(
          '[parseTimepoint] ' + error,
          context,
          error
        )
      );
    } finally {
      await queryRunner?.release().catch(error => {
        this.logger.error(
          '[parseTimepointNotifications] Failed to release query runner',
          { error, ...context }
        );
      });
    }
  }
}

export class TimepointAlreadyProcessedException extends BadRequestException {
  constructor(debugData: DebugData<BadRequestExceptionCodes> = {}) {
    super('Timepoint already processed', {
      ...debugData,
      exceptionCode: BadRequestExceptionCodes.TIMEPOINT_ALREADY_PROCESSED,
    });
  }
}

export class TimepointNotReadyException extends BadRequestException {
  constructor(debugData: DebugData<BadRequestExceptionCodes> = {}) {
    super('Timepoint not ready', {
      ...debugData,
      exceptionCode: BadRequestExceptionCodes.TIMEPOINT_NOT_READY,
    });
  }
}

export class TimepointExpiredException extends BadRequestException {
  constructor(debugData: DebugData<BadRequestExceptionCodes> = {}) {
    super('Timepoint expired', {
      ...debugData,
      exceptionCode: BadRequestExceptionCodes.TIMEPOINT_EXPIRED,
    });
  }
}
