//@ts-nocheck
import { getRepositoryToken } from '@nestjs/typeorm';
import { ID_SEPARATOR } from '@verdzie/server/common/generateId';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { TimepointEntityFake } from '@verdzie/server/notification-scheduler/composer/timepoint/testing/timepoint-entity.fake';
import {
  TimepointEntity,
  TimepointState,
  fromTimepointNotificationTuple,
  toTimepointNotificationTuple,
} from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.entity';
import { TimepointSchema } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.schema';
import { TimepointNotFoundException } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.service';
import { ScheduledNotificationType } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import {
  TimepointAlreadyProcessedException,
  TimepointExpiredException,
  TimepointNotReadyException,
  TimepointRecipientDistributionService,
} from '@verdzie/server/notification-scheduler/orchestrator/timepoint-recipient-distribution/timepoint-recipient-distribution.service';
import {
  createMockRepo,
  createMockedTestingModule,
} from '@verdzie/server/testing/base.module';
import { sub } from 'date-fns';
import { useFakeTimers } from 'sinon';
import { Like } from 'typeorm';
import { SHARDING_FACTOR } from '@verdzie/server/notification-scheduler/notification-config/configs/notification-config.common';

describe('TimepointRecipientDistributionService', () => {
  let service: TimepointRecipientDistributionService;
  let clock: sinon.SinonFakeTimers;

  beforeAll(() => {
    clock = useFakeTimers();
  });

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        TimepointRecipientDistributionService,
        {
          provide: getRepositoryToken(TimepointSchema),
          useValue: {},
        },
      ],
    });
    service = module.get(TimepointRecipientDistributionService);
  });

  afterAll(() => {
    clock.restore();
  });

  describe('createAllUsersJobs', () => {
    it('should call processTimepointBatch the correct number of times', async () => {
      const notificationContentId = 'someContentId';
      const notificationType = 'someNotificationType';
      const TIMEPOINT_BATCH_JOB_SIZE = 100;

      const mockProcessTimepointBatch = jest.fn();
      service.timepointRecipientDistributionProducer = {
        processTimepointBatch: mockProcessTimepointBatch,
      };

      await service.createAllUsersJobs({
        notificationContentId,
        notificationType,
      });

      const expectedCallCount = Math.ceil(
        SHARDING_FACTOR / TIMEPOINT_BATCH_JOB_SIZE
      );
      expect(mockProcessTimepointBatch.mock.calls.length).toBe(
        expectedCallCount
      );
    });

    it('should handle errors correctly', async () => {
      const notificationContentId = 'someContentId';
      const notificationType = 'someNotificationType';
      const mockError = new Error('Test Error');

      const mockProcessTimepointBatch = jest.fn().mockRejectedValue(mockError);
      service.timepointRecipientDistributionProducer = {
        processTimepointBatch: mockProcessTimepointBatch,
      };

      const result = await service.createAllUsersJobs({
        notificationContentId,
        notificationType,
      });

      expect(result).toHaveProperty('error');
      expect(result.error).toBeInstanceOf(InternalServerErrorException);
      expect(result.error.message).toContain('Test Error');
    });
  });

  describe('createTimepointOffsetJobs', () => {
    it('should create offset jobs for all timepoints', async () => {
      const timepointCount = 3020;
      const currentHour = new Date().getUTCHours();
      service['timepointRepo'].count = jest
        .fn()
        .mockResolvedValue(timepointCount);
      service[
        'timepointRecipientDistributionProducer'
      ].createTimepointBatchJobs = jest.fn();
      await service.createTimepointOffsetJobs();
      expect(
        service['timepointRecipientDistributionProducer']
          .createTimepointBatchJobs
      ).toHaveBeenCalledTimes(4);
      const calls =
        service[
          'timepointRecipientDistributionProducer'
          // @ts-ignore
        ].createTimepointBatchJobs.mock.calls;
      expect(calls[0][0]).toEqual({ hour: currentHour, offset: 0 });
      expect(calls[1][0]).toEqual({ hour: currentHour, offset: 1000 });
      expect(calls[2][0]).toEqual({ hour: currentHour, offset: 2000 });
      expect(calls[3][0]).toEqual({ hour: currentHour, offset: 3000 });
      expect(service['timepointRepo'].count).toHaveBeenCalledWith({
        where: {
          id: Like(`${currentHour}${ID_SEPARATOR}%`),
        },
      });
    });

    it('should catch errors', async () => {
      service['timepointRepo'].count = jest.fn().mockRejectedValue('error');
      const result = await service.createTimepointOffsetJobs();
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(Error);
    });
  });

  describe('createTimepointBatchJobs', () => {
    it('should create a batch job from a given offset', async () => {
      const timepointIds = Array.from({ length: 280 }, (_, i) => i.toString());
      const hour = 1;
      service['timepointRepo'].find = jest
        .fn()
        .mockResolvedValue(timepointIds.map(id => ({ id })));
      service['timepointRecipientDistributionProducer'].processTimepointBatch =
        jest.fn();

      const result = await service.createTimepointBatchJobs({
        hour,
        offset: 1000,
      });

      expect(result.isOk()).toBe(true);

      expect(
        service['timepointRecipientDistributionProducer'].processTimepointBatch
      ).toHaveBeenCalledTimes(3);
      const calls =
        service['timepointRecipientDistributionProducer'].processTimepointBatch
          .mock.calls;

      expect(calls[0][0]).toEqual({ timepointIds: timepointIds.slice(0, 100) });
      expect(calls[1][0]).toEqual({
        timepointIds: timepointIds.slice(100, 200),
      });
      expect(calls[2][0]).toEqual({ timepointIds: timepointIds.slice(200) });

      expect(service['timepointRepo'].find).toHaveBeenCalledWith({
        where: { id: Like(`${hour}${ID_SEPARATOR}%`) },
        order: { id: 'ASC' },
        select: ['id'],
        skip: 1000,
        take: 1000,
      });
    });

    it('should catch errors', async () => {
      service['timepointRepo'].find = jest
        .fn()
        .mockRejectedValue(new Error('error'));

      const result = await service.createTimepointBatchJobs({
        hour: 1,
        offset: 1000,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(Error);
    });
  });

  describe('createTimepointJobs', () => {
    it('should create a parse job for each timepoint', async () => {
      const timepointIds = Array.from({ length: 20 }, (_, i) => i.toString());
      await service.createTimepointJobs({ timepointIds });
      expect(
        service['timepointRecipientDistributionProducer']
          .createNotificationBuilderJobs
      ).toHaveBeenCalledTimes(20);
      const calls =
        service[
          'timepointRecipientDistributionProducer'
          // @ts-ignore
        ].createNotificationBuilderJobs.mock.calls;
      expect(calls[0][0]).toEqual({ timepointId: '0' });
      expect(calls[1][0]).toEqual({ timepointId: '1' });
      expect(calls[2][0]).toEqual({ timepointId: '2' });
    });

    it('should catch errors', async () => {
      service[
        'timepointRecipientDistributionProducer'
      ].createNotificationBuilderJobs = jest.fn().mockRejectedValue('error');
      const result = await service.createTimepointJobs({
        timepointIds: ['1'],
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InternalServerErrorException
      );
    });
  });

  describe('createNotificationBuilderJobs', () => {
    const getMockTimepointRepoWithQueryRunner = (
      timepoints: TimepointEntity[]
    ) => {
      const queryRunner = {
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        manager: {
          getRepository: jest.fn().mockImplementation(() => timepointRepo),
        },
        release: jest.fn().mockRejectedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      };
      const manager = {
        connection: {
          createQueryRunner: jest.fn().mockImplementation(() => queryRunner),
        },
      };
      const timepointRepo = createMockRepo({ entities: timepoints }) as any;
      timepointRepo.manager = manager;
      return { timepointRepo, queryRunner };
    };

    it('should return an error if the timepoint is not found', async () => {
      service['timepointRepo'] = getMockTimepointRepoWithQueryRunner([])
        .timepointRepo as any;
      const result = await service.createNotificationBuilderJobs({
        timepointId: 'id',
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TimepointNotFoundException
      );
    });

    it('should return an error if the timepoint is expired', async () => {
      const timepoint = TimepointEntityFake({
        state: TimepointState.TO_BE_ARCHIVED,
        processMetadata: {
          startDate: new Date(),
          lastProcessedAt: sub(new Date(), { days: 1 }),
          expirationDate: new Date(Date.now() - 10),
        },
      });
      service['timepointRepo'] = getMockTimepointRepoWithQueryRunner([
        timepoint,
      ]).timepointRepo as any;
      const result = await service.createNotificationBuilderJobs({
        timepointId: timepoint.id,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TimepointExpiredException
      );
    });

    it('should update timepoint and return error if the timepoint is expired and state is active', async () => {
      const timepoint = TimepointEntityFake({
        state: TimepointState.ACTIVE,
        processMetadata: {
          startDate: new Date(),
          lastProcessedAt: sub(new Date(), { days: 1 }),
          expirationDate: new Date(Date.now() - 10),
        },
      });
      const { timepointRepo, queryRunner } =
        getMockTimepointRepoWithQueryRunner([timepoint]);
      service['timepointRepo'] = timepointRepo as any;
      const result = await service.createNotificationBuilderJobs({
        timepointId: timepoint.id,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TimepointExpiredException
      );
      const updatedTimepoint = await service['timepointRepo'].findOne(
        timepoint.id
      );
      expect(updatedTimepoint?.state).toEqual(TimepointState.TO_BE_ARCHIVED);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should return an error if the timepoint is not ready to be processed', async () => {
      const timepoint = TimepointEntityFake({
        processMetadata: {
          startDate: new Date(Date.now() + 2000),
          lastProcessedAt: sub(new Date(), { days: 1 }),
          expirationDate: new Date(Date.now() + 3000),
        },
      });
      service['timepointRepo'] = getMockTimepointRepoWithQueryRunner([
        timepoint,
      ]).timepointRepo as any;
      const result = await service.createNotificationBuilderJobs({
        timepointId: timepoint.id,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TimepointNotReadyException
      );
    });

    it('should return an error if the timepoint has recently been processed', async () => {
      const timepoint = TimepointEntityFake({
        processMetadata: {
          startDate: new Date(Date.now() - 2000),
          lastProcessedAt: new Date(Date.now() - 1000),
          expirationDate: new Date(Date.now() + 3000),
        },
      });
      service['timepointRepo'] = getMockTimepointRepoWithQueryRunner([
        timepoint,
      ]).timepointRepo as any;
      const result = await service.createNotificationBuilderJobs({
        timepointId: timepoint.id,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        TimepointAlreadyProcessedException
      );
    });

    it('should return if no notifications are found', async () => {
      const timepoint = TimepointEntityFake({
        processMetadata: {
          startDate: new Date(Date.now() - 2000),
          lastProcessedAt: sub(new Date(), { days: 1 }),
          expirationDate: new Date(Date.now() + 3000),
        },
        notificationTuples: [],
      });
      service['timepointRepo'] = getMockTimepointRepoWithQueryRunner([
        timepoint,
      ]).timepointRepo as any;
      const result = await service.createNotificationBuilderJobs({
        timepointId: timepoint.id,
      });
      expect(result.isOk()).toBe(true);
      expect(
        service['notificationBuilderProducer'].createJob
      ).not.toHaveBeenCalled();
    });

    it('should create jobs for batches of notifications', async () => {
      const notificationTuples = Array.from({ length: 55 }).map(() =>
        toTimepointNotificationTuple({
          recipientId: 'recipientId',
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        })
      );
      const timepoint = TimepointEntityFake({
        processMetadata: {
          startDate: new Date(Date.now() - 2000),
          lastProcessedAt: sub(new Date(), { days: 1 }),
          expirationDate: new Date(Date.now() + 3000),
        },
        notificationTuples,
      });
      const { timepointRepo, queryRunner } =
        getMockTimepointRepoWithQueryRunner([timepoint]);
      service['timepointRepo'] = timepointRepo as any;
      service['notificationBuilderProducer'].createJob;
      const result = await service.createNotificationBuilderJobs({
        timepointId: timepoint.id,
      });
      expect(result.isOk()).toBe(true);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      // @ts-ignore
      const calls = service['notificationBuilderProducer'].createJob.mock.calls;
      expect(calls.length).toEqual(3);
      const parentId = timepoint.id.split('#')[1];
      expect(calls[0][0]).toEqual({
        parentId,
        items: notificationTuples
          .slice(0, 25)
          .map(fromTimepointNotificationTuple),
      });
      expect(calls[1][0]).toEqual({
        parentId,
        items: notificationTuples
          .slice(25, 50)
          .map(fromTimepointNotificationTuple),
      });
      expect(calls[2][0]).toEqual({
        parentId,
        items: notificationTuples.slice(50).map(fromTimepointNotificationTuple),
      });
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it(`should update the notification tuples lastProcessedAt`, async () => {
      const notificationTuples = Array.from({ length: 10 }).map(() =>
        toTimepointNotificationTuple({
          recipientId: 'recipientId',
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        })
      );
      const timepoint = TimepointEntityFake({
        processMetadata: {
          startDate: new Date(Date.now() - 2000),
          lastProcessedAt: sub(new Date(), { days: 1 }),
          expirationDate: new Date(Date.now() + 3000),
        },
        notificationTuples,
      });
      const { timepointRepo, queryRunner } =
        getMockTimepointRepoWithQueryRunner([timepoint]);
      service['timepointRepo'] = timepointRepo as any;
      service['notificationBuilderProducer'].createJob;
      const result = await service.createNotificationBuilderJobs({
        timepointId: timepoint.id,
      });
      expect(result.isOk()).toBe(true);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      const update = timepointRepo.update.mock.calls[0];
      expect(update[0]).toEqual(timepoint.id);
      expect(update[1]).toEqual({
        processMetadata: {
          ...timepoint.processMetadata,
          lastProcessedAt: expect.any(Date),
        },
      });
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should catch job creation errors', async () => {
      const timepoint = TimepointEntityFake({
        processMetadata: {
          startDate: new Date(Date.now() - 2000),
          lastProcessedAt: sub(new Date(), { days: 1 }),
          expirationDate: new Date(Date.now() + 3000),
        },
        notificationTuples: Array.from({ length: 10 }).map(() =>
          toTimepointNotificationTuple({
            recipientId: 'recipientId',
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          })
        ),
      });
      const { timepointRepo, queryRunner } =
        getMockTimepointRepoWithQueryRunner([timepoint]);
      service['timepointRepo'] = timepointRepo as any;
      service['notificationBuilderProducer'].createJob = jest
        .fn()
        .mockRejectedValue(new Error());
      const result = await service.createNotificationBuilderJobs({
        timepointId: timepoint.id,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InternalServerErrorException
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
