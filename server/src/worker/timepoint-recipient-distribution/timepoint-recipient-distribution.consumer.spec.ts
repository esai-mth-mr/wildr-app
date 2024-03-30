import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { TimepointNotFoundException } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.service';
import {
  TimepointAlreadyProcessedException,
  TimepointExpiredException,
  TimepointNotReadyException,
} from '@verdzie/server/notification-scheduler/orchestrator/timepoint-recipient-distribution/timepoint-recipient-distribution.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { TimepointRecipientDistributionConsumer } from '@verdzie/server/worker/timepoint-recipient-distribution/timepoint-recipient-distribution.consumer';
import { err, ok } from 'neverthrow';

describe('TimepointRecipientDistributionConsumer', () => {
  let consumer: TimepointRecipientDistributionConsumer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [TimepointRecipientDistributionConsumer],
    });
    consumer = module.get(TimepointRecipientDistributionConsumer);
  });

  describe('createTimepointOffsetJobs', () => {
    it('should create timepoint offset jobs', async () => {
      consumer['timepointDistributionService'].createTimepointOffsetJobs = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      await consumer.createTimepointOffsetJobs();
      expect(
        consumer['timepointDistributionService'].createTimepointOffsetJobs
      ).toHaveBeenCalled();
    });

    it('should throw error if timepoint offset jobs creation fails', async () => {
      consumer['timepointDistributionService'].createTimepointOffsetJobs = jest
        .fn()
        .mockResolvedValue(err('test'));
      try {
        await consumer.createTimepointOffsetJobs();
        throw new Error('Should not reach here');
      } catch (e) {
        expect(e).toEqual('test');
      }
    });
  });

  describe('createTimepointBatchJobs', () => {
    it('should create timepoint batch jobs', async () => {
      consumer['timepointDistributionService'].createTimepointBatchJobs = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      await consumer.createTimepointBatchJobs(
        JobFake({
          data: {
            hour: 1,
            offset: 1,
          },
        }) as any
      );
      expect(
        consumer['timepointDistributionService'].createTimepointBatchJobs
      ).toHaveBeenCalledWith({
        hour: 1,
        offset: 1,
      });
    });

    it('should throw error if timepoint batch jobs creation fails', async () => {
      consumer['timepointDistributionService'].createTimepointBatchJobs = jest
        .fn()
        .mockResolvedValue(err('test'));
      try {
        await consumer.createTimepointBatchJobs(
          JobFake({
            data: {
              hour: 1,
              offset: 1,
            },
          }) as any
        );
        throw new Error('Should not reach here');
      } catch (e) {
        expect(e).toEqual('test');
      }
    });
  });

  describe('processTimepointBatch', () => {
    it('should create timepoint jobs', async () => {
      consumer['timepointDistributionService'].createTimepointJobs = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      await consumer.processTimepointBatch(
        JobFake({ data: { timepointIds: ['1'] } }) as any
      );
      expect(
        consumer['timepointDistributionService'].createTimepointJobs
      ).toHaveBeenCalledWith({
        timepointIds: ['1'],
      });
    });

    it('should throw error if timepoint jobs creation fails', async () => {
      consumer['timepointDistributionService'].createTimepointJobs = jest
        .fn()
        .mockResolvedValue(err('test'));
      try {
        await consumer.processTimepointBatch(
          JobFake({ data: { timepointIds: ['1'] } }) as any
        );
        throw new Error('Should not reach here');
      } catch (e) {
        expect(e).toEqual('test');
      }
    });

    it('should not throw error if timepoint not found', async () => {
      consumer['timepointDistributionService'].createTimepointJobs = jest
        .fn()
        .mockResolvedValue(err(new TimepointNotFoundException()));
      await consumer.processTimepointBatch(
        JobFake({ data: { timepointIds: ['1'] } }) as any
      );
      expect(
        consumer['timepointDistributionService'].createTimepointJobs
      ).toHaveBeenCalledWith({
        timepointIds: ['1'],
      });
    });
  });

  describe('createNotificationBuilderJobs', () => {
    it('should create notification builder jobs', async () => {
      consumer['timepointDistributionService'].createNotificationBuilderJobs =
        jest.fn().mockResolvedValue(ok(undefined));
      await consumer.createNotificationBuilderJobs(
        JobFake({ data: { timepointId: '1' } }) as any
      );
      expect(
        consumer['timepointDistributionService'].createNotificationBuilderJobs
      ).toHaveBeenCalledWith({
        timepointId: '1',
      });
    });

    it('should not throw error if timepoint is not ready failure', async () => {
      consumer['timepointDistributionService'].createNotificationBuilderJobs =
        jest.fn().mockResolvedValue(err(new TimepointNotReadyException()));
      await consumer.createNotificationBuilderJobs(
        JobFake({ data: { timepointId: '1' } }) as any
      );
      expect(
        consumer['timepointDistributionService'].createNotificationBuilderJobs
      ).toHaveBeenCalledWith({
        timepointId: '1',
      });
    });

    it('should not throw an error if the timepoint has already been processed', async () => {
      consumer['timepointDistributionService'].createNotificationBuilderJobs =
        jest
          .fn()
          .mockResolvedValue(err(new TimepointAlreadyProcessedException()));

      await consumer.createNotificationBuilderJobs(
        JobFake({ data: { timepointId: '1' } }) as any
      );
      expect(
        consumer['timepointDistributionService'].createNotificationBuilderJobs
      ).toHaveBeenCalledWith({
        timepointId: '1',
      });
    });

    it('should not throw an error if the timepoint has expired', async () => {
      consumer['timepointDistributionService'].createNotificationBuilderJobs =
        jest.fn().mockResolvedValue(err(new TimepointExpiredException()));
      await consumer.createNotificationBuilderJobs(
        JobFake({ data: { timepointId: '1' } }) as any
      );
      expect(
        consumer['timepointDistributionService'].createNotificationBuilderJobs
      ).toHaveBeenCalledWith({
        timepointId: '1',
      });
    });

    it('should not throw an error if the timepoint is not found', async () => {
      consumer['timepointDistributionService'].createNotificationBuilderJobs =
        jest.fn().mockResolvedValue(err(new TimepointNotFoundException()));
      await consumer.createNotificationBuilderJobs(
        JobFake({ data: { timepointId: '1' } }) as any
      );
      expect(
        consumer['timepointDistributionService'].createNotificationBuilderJobs
      ).toHaveBeenCalledWith({
        timepointId: '1',
      });
    });

    it('should throw error if notification builder job faces critical failure', async () => {
      const criticalError = new InternalServerErrorException('bad');
      consumer['timepointDistributionService'].createNotificationBuilderJobs =
        jest.fn().mockResolvedValue(err(criticalError));
      try {
        await consumer.createNotificationBuilderJobs(
          JobFake({ data: { timepointId: '1' } }) as any
        );
        throw new Error('Should not reach here');
      } catch (e) {
        expect(e).toEqual(criticalError);
      }
    });
  });
});
