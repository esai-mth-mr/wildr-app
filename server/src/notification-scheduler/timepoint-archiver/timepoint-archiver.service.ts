import { Injectable, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import {
  BadRequestException,
  BadRequestExceptionCodes,
  DebugData,
  InternalServerErrorException,
} from '@verdzie/server/exceptions/wildr.exception';
import {
  TimepointEntity,
  TimepointState,
} from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.entity';
import {
  TimepointArchiveEntity,
  buildTimepointArchiveFromTimepoint,
} from '@verdzie/server/notification-scheduler/timepoint-archiver/timepoint-archive.entity.bi';
import { BI_CONNECTION_NAME } from '@verdzie/server/typeorm/typeormconfig-bi';
import { TimepointArchiverProducer } from '@verdzie/server/worker/timepoint-archiver/timepoint-archiver.producer';
import { chunk } from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Connection, QueryRunner } from 'typeorm';
import { Logger } from 'winston';

const TIMEPOINT_OFFSET_JOB_SIZE = 1000;
const TIMEPOINT_BATCH_JOB_SIZE = 100;

@Injectable()
export class TimepointArchiverService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectConnection(BI_CONNECTION_NAME)
    private biConnection: Connection,
    @InjectConnection()
    private wildrConnection: Connection,
    private timepointArchiverProducer: TimepointArchiverProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async archiveTimepoints({
    timepointIds,
  }: {
    timepointIds: string[];
  }): Promise<
    Result<
      undefined,
      NoTimepointsProvidedException | InternalServerErrorException
    >
  > {
    let queryRunner: QueryRunner | undefined;
    try {
      if (!timepointIds.length) {
        return err(
          new NoTimepointsProvidedException({
            timepointIds,
          })
        );
      }
      queryRunner = this.wildrConnection.createQueryRunner();
      await queryRunner.startTransaction();
      const timepointsRepo = queryRunner.manager.getRepository(TimepointEntity);
      const timepointArchiveRepo = this.biConnection.getRepository(
        TimepointArchiveEntity
      );
      const [foundTimepoints, archivedTimepoints] = await Promise.all([
        timepointsRepo.findByIds(timepointIds),
        timepointArchiveRepo.findByIds(timepointIds),
      ]);
      const conflictFreeTimepoints = foundTimepoints.filter(
        t => !archivedTimepoints.find(at => at.id === t.id)
      );
      if (timepointIds.length !== foundTimepoints.length) {
        this.logger.warn('[archiveTimepoints] missing timepoints', {
          requestedIds: timepointIds,
          foundTimepointIds: foundTimepoints.map(t => t.id),
        });
      }
      if (conflictFreeTimepoints.length !== foundTimepoints.length) {
        this.logger.warn('[archiveTimepoints] conflicting timepoints', {
          timepointIds,
          foundTimepointIds: foundTimepoints.map(t => t.id),
          conflictFreeTimepointIds: conflictFreeTimepoints.map(t => t.id),
        });
      }
      const timepointArchives = conflictFreeTimepoints.map(t =>
        buildTimepointArchiveFromTimepoint(t)
      );
      await timepointArchiveRepo.insert(timepointArchives);
      await timepointsRepo.delete(foundTimepoints.map(t => t.id));
      await queryRunner.commitTransaction();
      return ok(undefined);
    } catch (error) {
      await queryRunner?.rollbackTransaction().catch(error => {
        this.logger.error(
          '[archiveTimepoints] failed to rollback transaction ' + error,
          {
            timepointIds,
            error,
          }
        );
      });
      return err(
        new InternalServerErrorException('[archiveTimepoints] ' + error, {
          timepointIds,
        })
      );
    } finally {
      await queryRunner?.release().catch(error => {
        this.logger.error(
          '[archiveTimepoints] failed to release queryRunner ' + error,
          {
            timepointIds,
            error,
          }
        );
      });
    }
  }

  async createTimepointOffsetJobs(): Promise<
    Result<boolean, InternalServerErrorException>
  > {
    try {
      const timepointRepo = this.wildrConnection.getRepository(TimepointEntity);
      const totalTimepointsFound = await timepointRepo.count({
        where: {
          state: TimepointState.TO_BE_ARCHIVED,
        },
      });
      this.logger.info(
        '[createTimepointOffsetJobs] found timepoint to archive',
        { totalTimepointsFound }
      );
      const tasks: Promise<void>[] = [];
      for (
        let offset = 0;
        offset < totalTimepointsFound;
        offset += TIMEPOINT_OFFSET_JOB_SIZE
      ) {
        tasks.push(
          this.timepointArchiverProducer.createTimepointArchiverJobs({
            offset,
          })
        );
      }
      this.logger.info(
        '[createTimepointOffsetJobs] creating timepoint batch jobs',
        { batchSize: tasks.length }
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

  async createTimepointBatchJobs({ offset }: { offset: number }) {
    try {
      const timepointRepo = this.wildrConnection.getRepository(TimepointEntity);
      const timepoints = await timepointRepo.find({
        where: {
          state: TimepointState.TO_BE_ARCHIVED,
        },
        select: ['id'],
        skip: offset,
        take: TIMEPOINT_OFFSET_JOB_SIZE,
        order: {
          id: 'ASC',
        },
      });
      this.logger.info('[createTimepointBatchJobs] Found timepoints', {
        offset,
        totalTimepointsFound: timepoints.length,
      });
      const timepointBatches: string[][] = chunk(
        timepoints.map(t => t.id),
        TIMEPOINT_BATCH_JOB_SIZE
      );
      const tasks: Promise<void>[] = [];
      for (const timepointIds of timepointBatches) {
        tasks.push(
          this.timepointArchiverProducer.createArchiveTimepointsJob({
            timepointIds,
          })
        );
      }
      this.logger.info(
        '[createTimepointBatchJobs] creating timepoint batch jobs',
        { batchSize: tasks.length, offset }
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
}

export class NoTimepointsProvidedException extends BadRequestException {
  constructor(debugData: DebugData<BadRequestExceptionCodes>) {
    super('No timepoints were provided', {
      ...debugData,
    });
  }
}
