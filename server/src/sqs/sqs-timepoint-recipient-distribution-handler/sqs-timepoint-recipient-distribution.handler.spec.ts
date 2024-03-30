import { SqsTimepointRecipientDistributionHandler } from '@verdzie/server/sqs/sqs-timepoint-recipient-distribution-handler/sqs-timepoint-recipient-distribution.handler';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe('TimepointRecipientDistributionHandler', () => {
  let handler: SqsTimepointRecipientDistributionHandler;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [SqsTimepointRecipientDistributionHandler],
    });
    handler = module.get(SqsTimepointRecipientDistributionHandler);
  });

  describe('handleMessage', () => {
    it('should create an offset job creation job', async () => {
      await handler.handleMessage({});
      expect(
        handler['timepointRecipientDistributionProducer']
          .createTimepointOffsetJobs
      ).toHaveBeenCalled();
    });
  });
});
