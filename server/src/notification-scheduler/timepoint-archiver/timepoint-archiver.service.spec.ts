import { faker } from '@faker-js/faker';
import { getQueueToken } from '@nestjs/bull';
import { ID_SEPARATOR, generateId } from '@verdzie/server/common/generateId';
import { TimepointEntityFake } from '@verdzie/server/notification-scheduler/composer/timepoint/testing/timepoint-entity.fake';
import { TimepointEntity } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.entity';
import {
  TimepointArchiveEntity,
  buildTimepointArchiveFromTimepoint,
} from '@verdzie/server/notification-scheduler/timepoint-archiver/timepoint-archive.entity.bi';
import {
  NoTimepointsProvidedException,
  TimepointArchiverService,
} from '@verdzie/server/notification-scheduler/timepoint-archiver/timepoint-archiver.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { TIMEPOINT_ARCHIVER_QUEUE_NAME } from '@verdzie/server/worker/timepoint-archiver/timepoint-archiver.producer';

describe('TimepointArchiverService', () => {
  let service: TimepointArchiverService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        TimepointArchiverService,
        {
          provide: getQueueToken(TIMEPOINT_ARCHIVER_QUEUE_NAME),
          useValue: {
            add: jest.fn().mockResolvedValue(undefined),
            on: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });
    service = module.get(TimepointArchiverService);
  });

  describe('archiveTimepoints', () => {
    const createQueryRunnerWithRepo = (timepointsRepo: any) => {
      return {
        startTransaction: jest.fn().mockResolvedValue(undefined),
        manager: {
          getRepository: jest.fn().mockImplementation(entity => {
            if (entity === TimepointEntity) {
              return timepointsRepo;
            }
          }),
        },
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
      };
    };

    it('should return an error if no timepoints are provided', async () => {
      const result = await service.archiveTimepoints({
        timepointIds: [],
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        NoTimepointsProvidedException
      );
    });

    it('should add the specified timepoints to the archive', async () => {
      const originalTimepoints: TimepointEntity[] = Array.from(
        { length: 5 },
        (_, i) =>
          TimepointEntityFake({
            id:
              faker.date.future().getHours() +
              ID_SEPARATOR +
              generateId() +
              ID_SEPARATOR +
              i,
          })
      );
      let timepoints = [...originalTimepoints];
      const timepointsRepo = {
        findByIds: jest.fn().mockImplementation(async ids => {
          return timepoints.filter(t => ids.includes(t.id));
        }),
        delete: jest.fn().mockImplementation(async ids => {
          timepoints = timepoints.filter(t => !ids.includes(t.id));
        }),
      } as any;
      const queryRunner = createQueryRunnerWithRepo(timepointsRepo);
      service['wildrConnection'] = {
        createQueryRunner: () => queryRunner,
      } as any;
      const archivedTimepoints: TimepointArchiveEntity[] = [];
      const timepointArchiveRepo = {
        findByIds: jest.fn().mockImplementation(async ids => {
          return archivedTimepoints.filter(t => ids.includes(t.id));
        }),
        insert: jest.fn().mockImplementation(async timepoints => {
          archivedTimepoints.push(...timepoints);
        }),
      } as any;
      service['biConnection'] = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === TimepointArchiveEntity) {
            return timepointArchiveRepo;
          }
        }),
      } as any;
      const specifiedTimepointIds = originalTimepoints
        .slice(0, 3)
        .map(t => t.id);
      const result = await service.archiveTimepoints({
        timepointIds: specifiedTimepointIds,
      });
      expect(result.isOk()).toBe(true);
      expect(archivedTimepoints).toHaveLength(3);
      expect(archivedTimepoints).toEqual(
        originalTimepoints
          .filter(t => specifiedTimepointIds.includes(t.id))
          .map(t => buildTimepointArchiveFromTimepoint(t))
      );
    });

    it('should delete the archived timepoints', async () => {
      const originalTimepoints: TimepointEntity[] = Array.from(
        { length: 5 },
        (_, i) =>
          TimepointEntityFake({
            id:
              faker.date.future().getHours() +
              ID_SEPARATOR +
              generateId() +
              ID_SEPARATOR +
              i,
          })
      );
      let timepoints = [...originalTimepoints];
      const timepointsRepo = {
        findByIds: jest.fn().mockImplementation(async ids => {
          return timepoints.filter(t => ids.includes(t.id));
        }),
        delete: jest.fn().mockImplementation(async ids => {
          timepoints = timepoints.filter(t => !ids.includes(t.id));
        }),
      } as any;
      const queryRunner = createQueryRunnerWithRepo(timepointsRepo);
      service['wildrConnection'] = {
        createQueryRunner: () => queryRunner,
      } as any;
      const archivedTimepoints: TimepointArchiveEntity[] = [];
      const timepointArchiveRepo = {
        findByIds: jest.fn().mockImplementation(async ids => {
          return archivedTimepoints.filter(t => ids.includes(t.id));
        }),
        insert: jest.fn().mockImplementation(async timepoints => {
          archivedTimepoints.push(...timepoints);
        }),
      } as any;
      service['biConnection'] = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === TimepointArchiveEntity) {
            return timepointArchiveRepo;
          }
        }),
      } as any;
      const specifiedTimepointIds = originalTimepoints
        .slice(0, 3)
        .map(t => t.id);
      const result = await service.archiveTimepoints({
        timepointIds: specifiedTimepointIds,
      });
      expect(result.isOk()).toBe(true);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(timepoints).toHaveLength(2);
      expect(timepoints).toEqual(
        originalTimepoints.filter(t => !specifiedTimepointIds.includes(t.id))
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should not try to delete missing timepoints', async () => {
      const originalTimepoints: TimepointEntity[] = Array.from(
        { length: 5 },
        (_, i) =>
          TimepointEntityFake({
            id:
              faker.date.future().getHours() +
              ID_SEPARATOR +
              generateId() +
              ID_SEPARATOR +
              i,
          })
      );
      const timepoints = [...originalTimepoints];
      const archivedTimepoints: TimepointArchiveEntity[] = [];
      const timepointArchiveRepo = {
        findByIds: jest.fn().mockImplementation(async ids => {
          return archivedTimepoints.filter(t => ids.includes(t.id));
        }),
        insert: jest.fn().mockImplementation(async timepoints => {
          archivedTimepoints.push(...timepoints);
        }),
      } as any;
      const timepointsRepo = {
        findByIds: jest.fn().mockImplementation(async ids => {
          return timepoints.filter(t => ids.includes(t.id));
        }),
        delete: jest.fn().mockImplementation(async ids => {
          for (const id of ids) {
            const index = timepoints.findIndex(t => t.id === id);
            if (index !== -1) {
              timepoints.splice(index, 1);
            } else {
              throw new Error('Timepoint not found');
            }
          }
        }),
      } as any;
      const queryRunner = createQueryRunnerWithRepo(timepointsRepo);
      service['wildrConnection'] = {
        createQueryRunner: () => queryRunner,
      } as any;
      service['biConnection'] = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === TimepointArchiveEntity) {
            return timepointArchiveRepo;
          }
        }),
      } as any;
      const specifiedTimepointIds = originalTimepoints
        .slice(0, 3)
        .map(t => t.id);
      specifiedTimepointIds.push('missing');
      const result = await service.archiveTimepoints({
        timepointIds: specifiedTimepointIds,
      });
      expect(result.isOk()).toBe(true);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(archivedTimepoints).toHaveLength(3);
      expect(archivedTimepoints).toEqual(
        originalTimepoints
          .filter(t => specifiedTimepointIds.includes(t.id))
          .map(t => buildTimepointArchiveFromTimepoint(t))
      );
      expect(timepoints).toHaveLength(2);
      expect(timepoints).toEqual(
        originalTimepoints.filter(t => !specifiedTimepointIds.includes(t.id))
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should delete but not archive timepoints that have already be archived', async () => {
      const originalTimepoints: TimepointEntity[] = Array.from(
        { length: 5 },
        (_, i) =>
          TimepointEntityFake({
            id:
              faker.date.future().getHours() +
              ID_SEPARATOR +
              generateId() +
              ID_SEPARATOR +
              i,
          })
      );
      let timepoints = [...originalTimepoints];
      const archivedTimepoints: TimepointArchiveEntity[] = originalTimepoints
        .slice(0, 2)
        .map(t => buildTimepointArchiveFromTimepoint(t));
      const timepointArchiveRepo = {
        findByIds: jest.fn().mockImplementation(async ids => {
          return archivedTimepoints.filter(t => ids.includes(t.id));
        }),
        insert: jest.fn().mockImplementation(async timepoints => {
          archivedTimepoints.push(...timepoints);
        }),
      } as any;
      const timepointsRepo = {
        findByIds: jest.fn().mockImplementation(async ids => {
          return timepoints.filter(t => ids.includes(t.id));
        }),
        delete: jest.fn().mockImplementation(async ids => {
          timepoints = timepoints.filter(t => !ids.includes(t.id));
        }),
      } as any;
      const queryRunner = createQueryRunnerWithRepo(timepointsRepo);
      service['wildrConnection'] = {
        createQueryRunner: () => queryRunner,
      } as any;
      service['biConnection'] = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === TimepointArchiveEntity) {
            return timepointArchiveRepo;
          }
        }),
      } as any;
      const specifiedTimepointIds = originalTimepoints
        .slice(0, 3)
        .map(t => t.id);
      const result = await service.archiveTimepoints({
        timepointIds: specifiedTimepointIds,
      });
      expect(result.isOk()).toBe(true);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(archivedTimepoints).toHaveLength(3);
      expect(archivedTimepoints).toEqual(
        originalTimepoints
          .filter(t => specifiedTimepointIds.includes(t.id))
          .map(t => buildTimepointArchiveFromTimepoint(t))
      );
      expect(timepoints).toHaveLength(2);
      expect(timepoints).toEqual(
        originalTimepoints.filter(t => !specifiedTimepointIds.includes(t.id))
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should return an error if the transaction fails', async () => {
      const originalTimepoints: TimepointEntity[] = Array.from(
        { length: 5 },
        (_, i) =>
          TimepointEntityFake({
            id:
              faker.date.future().getHours() +
              ID_SEPARATOR +
              generateId() +
              ID_SEPARATOR +
              i,
          })
      );
      let timepoints = [...originalTimepoints];
      const timepointsRepo = {
        findByIds: jest.fn().mockImplementation(async ids => {
          return timepoints.filter(t => ids.includes(t.id));
        }),
        delete: jest.fn().mockImplementation(async ids => {
          timepoints = timepoints.filter(t => !ids.includes(t.id));
        }),
      } as any;
      const queryRunner = createQueryRunnerWithRepo(timepointsRepo);
      queryRunner.commitTransaction.mockRejectedValue(new Error());
      service['wildrConnection'] = {
        createQueryRunner: () => queryRunner,
      } as any;
      const archivedTimepoints: TimepointArchiveEntity[] = [];
      const timepointArchiveRepo = {
        findByIds: jest.fn().mockImplementation(async ids => {
          return archivedTimepoints.filter(t => ids.includes(t.id));
        }),
        insert: jest.fn().mockImplementation(async timepoints => {
          archivedTimepoints.push(...timepoints);
        }),
      } as any;
      service['biConnection'] = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === TimepointArchiveEntity) {
            return timepointArchiveRepo;
          }
        }),
      } as any;
      const specifiedTimepointIds = originalTimepoints
        .slice(0, 3)
        .map(t => t.id);
      const result = await service.archiveTimepoints({
        timepointIds: specifiedTimepointIds,
      });
      expect(result.isErr()).toBe(true);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('createTimepointOffsetJobs', () => {
    it('should create a job for each timepoint', async () => {
      const timepointRepo = {
        count: jest.fn().mockResolvedValue(2200),
      };
      service['wildrConnection'].getRepository = jest
        .fn()
        .mockImplementation(entity => {
          if (entity === TimepointEntity) {
            return timepointRepo;
          }
        });
      service['timepointArchiverProducer'].createTimepointArchiverJobs = jest
        .fn()
        .mockResolvedValue(undefined);
      const result = await service.createTimepointOffsetJobs();
      expect(result.isOk()).toBe(true);
      expect(
        service['timepointArchiverProducer'].createTimepointArchiverJobs
      ).toHaveBeenCalledTimes(3);
      const calls =
        // @ts-ignore
        service['timepointArchiverProducer'].createTimepointArchiverJobs.mock
          .calls;
      expect(calls[0][0]).toEqual({ offset: 0 });
      expect(calls[1][0]).toEqual({ offset: 1000 });
      expect(calls[2][0]).toEqual({ offset: 2000 });
    });

    it('should handle job creation failures', async () => {
      const timepointRepo = {
        count: jest.fn().mockResolvedValue(2200),
      };
      service['wildrConnection'].getRepository = jest
        .fn()
        .mockImplementation(entity => {
          if (entity === TimepointEntity) {
            return timepointRepo;
          }
        });
      service['timepointArchiverProducer'].createTimepointArchiverJobs = jest
        .fn()
        .mockRejectedValue(new Error());
      const result = await service.createTimepointOffsetJobs();
      expect(result.isErr()).toBe(true);
    });
  });

  describe('createTimepointBatchJobs', () => {
    it('should create jobs for batches of timepoints', async () => {
      const timepoints = Array.from({ length: 350 }, (_, i) => {
        return TimepointEntityFake({
          id:
            faker.date.future().getHours() +
            ID_SEPARATOR +
            generateId() +
            ID_SEPARATOR +
            i,
        });
      });
      const timepointRepo = {
        find: jest.fn().mockResolvedValue(timepoints),
      };
      service['wildrConnection'].getRepository = jest
        .fn()
        .mockImplementation(entity => {
          if (entity === TimepointEntity) {
            return timepointRepo;
          }
        });
      service['timepointArchiverProducer'].createArchiveTimepointsJob = jest
        .fn()
        .mockResolvedValue(undefined);
      const result = await service.createTimepointBatchJobs({ offset: 0 });
      expect(result.isOk()).toBe(true);
      const calls =
        // @ts-ignore
        service['timepointArchiverProducer'].createArchiveTimepointsJob.mock
          .calls;
      expect(calls).toHaveLength(4);
      expect(calls[0][0]).toEqual({
        timepointIds: timepoints.slice(0, 100).map(t => t.id),
      });
      expect(calls[1][0]).toEqual({
        timepointIds: timepoints.slice(100, 200).map(t => t.id),
      });
      expect(calls[2][0]).toEqual({
        timepointIds: timepoints.slice(200, 300).map(t => t.id),
      });
      expect(calls[3][0]).toEqual({
        timepointIds: timepoints.slice(300).map(t => t.id),
      });
    });

    it('should handle job creation failures', async () => {
      const timepoints = Array.from({ length: 350 }, (_, i) => {
        return TimepointEntityFake({
          id:
            faker.date.future().getHours() +
            ID_SEPARATOR +
            generateId() +
            ID_SEPARATOR +
            i,
        });
      });
      const timepointRepo = {
        find: jest.fn().mockResolvedValue(timepoints),
      };
      service['wildrConnection'].getRepository = jest
        .fn()
        .mockImplementation(entity => {
          if (entity === TimepointEntity) {
            return timepointRepo;
          }
        });
      service['timepointArchiverProducer'].createArchiveTimepointsJob = jest
        .fn()
        .mockRejectedValue(new Error());
      const result = await service.createTimepointBatchJobs({ offset: 0 });
      expect(result.isErr()).toBe(true);
    });
  });
});
