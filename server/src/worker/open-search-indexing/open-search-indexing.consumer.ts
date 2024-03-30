import { Process, Processor } from '@nestjs/bull';
import { OSIndexingService } from '@verdzie/server/open-search-v2/indexing/indexing.service';
import {
  BatchIndexingJob,
  OPEN_SEARCH_BATCH_INDEXING_JOB_NAME,
  OPEN_SEARCH_INDEXING_QUEUE_NAME,
} from './open-search-indexing.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import { Logger } from 'winston';

@Processor(OPEN_SEARCH_INDEXING_QUEUE_NAME)
export class IndexingServiceConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly indexingService: OSIndexingService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(OPEN_SEARCH_BATCH_INDEXING_JOB_NAME)
  async index(job: Job<BatchIndexingJob>) {
    const { entityName, jobType, requests } = job.data;
    await this.indexingService.indexMany(entityName, requests, jobType);
  }
}
