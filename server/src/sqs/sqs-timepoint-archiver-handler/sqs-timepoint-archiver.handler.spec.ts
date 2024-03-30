import { SqsTimepointArchiverHandler } from '@verdzie/server/sqs/sqs-timepoint-archiver-handler/sqs-timepoint-archiver.handler';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe('SqsTimepointArchiverHandler', () => {
  let handler: SqsTimepointArchiverHandler;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [SqsTimepointArchiverHandler],
    });
    handler = module.get(SqsTimepointArchiverHandler);
  });

  describe('handleMessage', () => {
    it('should create an offset job creation job', async () => {
      await handler.handleMessage({});
      expect(
        handler['timepointArchiverProducer'].createTimepointArchiverOffsetJobs
      ).toHaveBeenCalled();
    });
  });
});
