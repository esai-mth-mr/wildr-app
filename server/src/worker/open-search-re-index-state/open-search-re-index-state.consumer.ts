import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { OSIndexStateService } from '@verdzie/server/open-search-v2/index-state/index-state.service';
import {
  MarkReIndexCompleteJob,
  OPEN_SEARCH_RE_INDEX_COMPLETE_JOB_NAME,
  OPEN_SEARCH_RE_INDEX_REQUEST_JOB_NAME,
  OPEN_SEARCH_RE_INDEX_STATE_QUEUE_NAME,
  ReIndexRequestJob,
} from './open-search-re-index-state.producer';

@Processor(OPEN_SEARCH_RE_INDEX_STATE_QUEUE_NAME)
export class OSReIndexStateConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private readonly indexStateService: OSIndexStateService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(OPEN_SEARCH_RE_INDEX_REQUEST_JOB_NAME)
  async processReIndexingRequest(job: Job<ReIndexRequestJob>) {
    await this.indexStateService.recordReIndexRequest({ ...job.data });
  }

  @Process(OPEN_SEARCH_RE_INDEX_COMPLETE_JOB_NAME)
  async processReIndexingComplete(job: Job<MarkReIndexCompleteJob>) {
    await this.indexStateService.markReIndexComplete({
      ...job.data,
    });
  }
}
