import { getQueueToken } from '@nestjs/bull';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import {
  TIMEPOINT_ARCHIVER_BATCH_JOB_CREATION_JOB_NAME,
  TIMEPOINT_ARCHIVER_BATCH_JOB_NAME,
  TIMEPOINT_ARCHIVER_OFFSET_JOB_CREATION_JOB_NAME,
  TIMEPOINT_ARCHIVER_QUEUE_NAME,
  TimepointArchiverProducer,
} from '@verdzie/server/worker/timepoint-archiver/timepoint-archiver.producer';

describe('TimepointArchiverProducer', () => {
  let producer: TimepointArchiverProducer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        TimepointArchiverProducer,
        {
          provide: getQueueToken(TIMEPOINT_ARCHIVER_QUEUE_NAME),
          useValue: {
            add: jest.fn(),
            on: jest.fn(),
          },
        },
      ],
    });
    producer = module.get(TimepointArchiverProducer);
  });

  describe('createTimepointArchiverOffsetJobs', () => {
    it('should produce a job', async () => {
      await producer.createTimepointArchiverOffsetJobs();
      expect(producer['queue'].add).toHaveBeenCalledWith(
        TIMEPOINT_ARCHIVER_OFFSET_JOB_CREATION_JOB_NAME,
        {},
        {}
      );
    });
  });

  describe('createTimepointArchiverJobs', () => {
    it('should produce a job', async () => {
      await producer.createTimepointArchiverJobs({ offset: 0 });
      expect(producer['queue'].add).toHaveBeenCalledWith(
        TIMEPOINT_ARCHIVER_BATCH_JOB_CREATION_JOB_NAME,
        { offset: 0 },
        {}
      );
    });
  });

  describe('createArchiveTimepointsJob', () => {
    it('should produce a job', async () => {
      await producer.createArchiveTimepointsJob({ timepointIds: [] });
      expect(producer['queue'].add).toHaveBeenCalledWith(
        TIMEPOINT_ARCHIVER_BATCH_JOB_NAME,
        { timepointIds: [] },
        {}
      );
    });
  });
});
