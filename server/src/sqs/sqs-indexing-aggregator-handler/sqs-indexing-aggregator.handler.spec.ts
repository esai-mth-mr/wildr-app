import { IndexingJobType } from '@verdzie/server/open-search-v2/indexing/indexing.service';
import { SqsIndexingAggregatorHandler } from '@verdzie/server/sqs/sqs-indexing-aggregator-handler/sqs-indexing-aggregator.handler';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe('SqsIndexingAggregatorHandler', () => {
  describe('handleMessage', () => {
    let handler: SqsIndexingAggregatorHandler;

    beforeEach(async () => {
      const module = await createMockedTestingModule({
        providers: [SqsIndexingAggregatorHandler],
      });
      handler = module.get(SqsIndexingAggregatorHandler);
    });

    it('should return if message is invalid', async () => {
      const message = JSON.stringify({ entityName: 'test' });
      await handler.handleMessage({ Body: message } as any);
      expect(
        handler['indexingAggregatorService'].createAggregatedJobs
      ).not.toHaveBeenCalled();
    });

    it('should return if job type is invalid', async () => {
      const message = JSON.stringify({
        entityName: 'UserEntity',
        jobType: 'invalid',
      });
      await handler.handleMessage({ Body: message } as any);
      expect(
        handler['indexingAggregatorService'].createAggregatedJobs
      ).not.toHaveBeenCalled();
    });

    it('should return if message body is empty', () => {
      handler.handleMessage({ Body: undefined } as any);
      expect(
        handler['indexingAggregatorService'].createAggregatedJobs
      ).not.toHaveBeenCalled();
    });

    it('should create aggregated jobs', async () => {
      const message = JSON.stringify({
        entityName: 'UserEntity',
        jobType: IndexingJobType.RE_INDEX,
      });
      await handler.handleMessage({ Body: message } as any);
      expect(
        handler['indexingAggregatorService'].createAggregatedJobs
      ).toHaveBeenCalledWith('UserEntity', IndexingJobType.RE_INDEX);
    });

    it('should handle errors when creating aggregated jobs', async () => {
      const message = JSON.stringify({
        entityName: 'UserEntity',
        jobType: IndexingJobType.RE_INDEX,
      });
      handler['indexingAggregatorService'].createAggregatedJobs = jest
        .fn()
        .mockRejectedValue(new Error('test'));
      await handler.handleMessage({ Body: message } as any);
      expect(
        handler['indexingAggregatorService'].createAggregatedJobs
      ).toHaveBeenCalledWith('UserEntity', IndexingJobType.RE_INDEX);
    });

    it('should call createAggregatedJobs with INCREMENTAL_INDEX', async () => {
      const message = JSON.stringify({
        entityName: 'UserEntity',
        jobType: IndexingJobType.INCREMENTAL_INDEX,
      });
      await handler.handleMessage({ Body: message } as any);
      expect(
        handler['indexingAggregatorService'].createAggregatedJobs
      ).toHaveBeenCalledWith('UserEntity', IndexingJobType.INCREMENTAL_INDEX);
    });
  });
});
