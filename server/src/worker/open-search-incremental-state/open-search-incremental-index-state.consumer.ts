import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  IncrementalIndexRequestJob,
  MarkIncrementalIndexCompleteJob,
  OPEN_SEARCH_INCREMENTAL_INDEX_COMPLETE_JOB_NAME,
  OPEN_SEARCH_INCREMENTAL_INDEX_REQUEST_JOB_NAME,
  OPEN_SEARCH_INCREMENTAL_INDEX_STATE_QUEUE_NAME,
} from './open-search-incremental-index-state.producer';
import { OSIndexStateService } from '@verdzie/server/open-search-v2/index-state/index-state.service';

@Processor(OPEN_SEARCH_INCREMENTAL_INDEX_STATE_QUEUE_NAME)
export class OSIncrementalIndexStateConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private readonly indexStateService: OSIndexStateService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(OPEN_SEARCH_INCREMENTAL_INDEX_REQUEST_JOB_NAME)
  async processIncrementalIndexingRequest(
    job: Job<IncrementalIndexRequestJob>
  ) {
    await this.indexStateService.recordIncrementalIndexRequest({
      ...job.data,
    });
  }

  @Process(OPEN_SEARCH_INCREMENTAL_INDEX_COMPLETE_JOB_NAME)
  async processIncrementalIndexingComplete(
    job: Job<MarkIncrementalIndexCompleteJob>
  ) {
    await this.indexStateService.markIncrementalIndexComplete({
      ...job.data,
    });
  }
}
