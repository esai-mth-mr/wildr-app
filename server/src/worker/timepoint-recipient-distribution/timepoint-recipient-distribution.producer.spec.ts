import { getQueueToken } from '@nestjs/bull';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import {
  TIMEPOINT_RECIPIENT_DISTRIBUTION_BATCH_JOB_CREATION_JOB_NAME,
  TIMEPOINT_RECIPIENT_DISTRIBUTION_BATCH_JOB_NAME,
  TIMEPOINT_RECIPIENT_DISTRIBUTION_OFFSET_JOB_NAME,
  TIMEPOINT_RECIPIENT_DISTRIBUTION_PARSE_JOB_NAME,
  TIMEPOINT_RECIPIENT_DISTRIBUTION_QUEUE_NAME,
  TimepointRecipientDistributionProducer,
} from '@verdzie/server/worker/timepoint-recipient-distribution/timepoint-recipient-distribution.producer';

describe('TimepointRecipientDistributionProducer', () => {
  let producer: TimepointRecipientDistributionProducer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      imports: [WildrBullModule],
      providers: [
        TimepointRecipientDistributionProducer,
        {
          provide: getQueueToken(TIMEPOINT_RECIPIENT_DISTRIBUTION_QUEUE_NAME),
          useValue: {
            add: jest.fn(),
            on: jest.fn(),
          },
        },
      ],
    });
    producer = module.get(TimepointRecipientDistributionProducer);
  });

  describe('createTimepointOffsetJobs', () => {
    it('should create timepoint offset jobs', async () => {
      producer.produce = jest.fn().mockResolvedValue(undefined);
      await producer.createTimepointOffsetJobs();
      expect(producer.produce).toHaveBeenCalledWith(
        TIMEPOINT_RECIPIENT_DISTRIBUTION_OFFSET_JOB_NAME,
        {}
      );
    });
  });

  describe('createTimepointBatchJobs', () => {
    it('should create timepoint batch jobs', async () => {
      producer.produce = jest.fn().mockResolvedValue(undefined);
      await producer.createTimepointBatchJobs({
        hour: 1,
        offset: 1,
      });
      expect(producer.produce).toHaveBeenCalledWith(
        TIMEPOINT_RECIPIENT_DISTRIBUTION_BATCH_JOB_CREATION_JOB_NAME,
        {
          hour: 1,
          offset: 1,
        }
      );
    });
  });

  describe('processTimepointBatch', () => {
    it('should create timepoint batch processing job', async () => {
      producer.produce = jest.fn().mockResolvedValue(undefined);
      await producer.processTimepointBatch({
        timepointIds: ['1'],
      });
      expect(producer.produce).toHaveBeenCalledWith(
        TIMEPOINT_RECIPIENT_DISTRIBUTION_BATCH_JOB_NAME,
        {
          timepointIds: ['1'],
        }
      );
    });
  });

  describe('createNotificationBuilderJobs', () => {
    it('should create timepoint processing job', async () => {
      producer.produce = jest.fn().mockResolvedValue(undefined);
      await producer.createNotificationBuilderJobs({
        timepointId: '1',
      });
      expect(producer.produce).toHaveBeenCalledWith(
        TIMEPOINT_RECIPIENT_DISTRIBUTION_PARSE_JOB_NAME,
        {
          timepointId: '1',
        }
      );
    });
  });
});
