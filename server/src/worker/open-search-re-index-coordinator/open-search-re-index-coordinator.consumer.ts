import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { OSReIndexCoordinatorService } from '@verdzie/server/open-search-v2/re-index-coordinator/re-index-coordinator.service';
import {
  OPEN_SEARCH_RE_INDEX_JOB_NAME,
  OPEN_SEARCH_RE_INDEX_QUEUE_NAME,
  ReIndexJob,
} from '@verdzie/server/worker/open-search-re-index-coordinator/open-search-re-index-coordinator.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(OPEN_SEARCH_RE_INDEX_QUEUE_NAME)
export class OSReIndexCoordinatorConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger,
    private readonly reIndexService: OSReIndexCoordinatorService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(OPEN_SEARCH_RE_INDEX_JOB_NAME)
  async processReIndexing(job: Job<ReIndexJob>) {
    await this.reIndexService.batchIndex({ ...job.data });
  }
}
