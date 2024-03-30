import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { TimepointArchiverConsumer } from '@verdzie/server/worker/timepoint-archiver/timepoint-archiver.consumer';
import { err, ok } from 'neverthrow';

describe('TimepointArchiverConsumer', () => {
  let consumer: TimepointArchiverConsumer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [TimepointArchiverConsumer],
    });
    consumer = module.get(TimepointArchiverConsumer);
  });

  describe('processOffsetJobCreation', () => {
    it('should create offset jobs', async () => {
      consumer['timepointArchiverService'].createTimepointOffsetJobs = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      await consumer.processOffsetJobCreation();
      expect(
        consumer['timepointArchiverService'].createTimepointOffsetJobs
      ).toHaveBeenCalled();
    });

    it('should throw error if service returns an error', async () => {
      consumer['timepointArchiverService'].createTimepointOffsetJobs = jest
        .fn()
        .mockResolvedValue(err(new Error('test error')));
      try {
        await consumer.processOffsetJobCreation();
        throw new Error('should have thrown');
      } catch (error) {
        expect(error).toEqual(new Error('test error'));
      }
    });
  });

  describe('processBatchJobCreation', () => {
    it('should create batch jobs', async () => {
      consumer['timepointArchiverService'].createTimepointBatchJobs = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      await consumer.processBatchJobCreation({
        data: {
          offset: 0,
        },
      } as any);
      expect(
        consumer['timepointArchiverService'].createTimepointBatchJobs
      ).toHaveBeenCalledWith({
        offset: 0,
      });
    });

    it('should throw error if service returns an error', async () => {
      consumer['timepointArchiverService'].createTimepointBatchJobs = jest
        .fn()
        .mockResolvedValue(err(new Error('test error')));
      try {
        await consumer.processBatchJobCreation({
          data: {
            offset: 0,
          },
        } as any);
        throw new Error('should have thrown');
      } catch (error) {
        expect(error).toEqual(new Error('test error'));
      }
    });
  });

  describe('processBatchJob', () => {
    it('should create batch jobs', async () => {
      consumer['timepointArchiverService'].archiveTimepoints = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      await consumer.processBatchJob({
        data: {
          timepointIds: ['1', '2'],
        },
      } as any);
      expect(
        consumer['timepointArchiverService'].archiveTimepoints
      ).toHaveBeenCalledWith({
        timepointIds: ['1', '2'],
      });
    });

    it('should throw error if service returns an error', async () => {
      consumer['timepointArchiverService'].archiveTimepoints = jest
        .fn()
        .mockResolvedValue(err(new Error('test error')));
      try {
        await consumer.processBatchJob({
          data: {
            timepointIds: ['1', '2'],
          },
        } as any);
        throw new Error('should have thrown');
      } catch (error) {
        expect(error).toEqual(new Error('test error'));
      }
    });
  });
});
