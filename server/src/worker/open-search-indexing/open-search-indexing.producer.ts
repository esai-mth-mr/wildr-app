import { Inject, Injectable } from '@nestjs/common';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Queue } from 'bull';
import { Logger } from 'winston';
import { InjectQueue } from '@nestjs/bull';
import { IndexableEntityName } from '@verdzie/server/open-search-v2/index-version/index-version.service';
import {
  IndexingJobType,
  IndexingRequest,
} from '@verdzie/server/open-search-v2/indexing/indexing.service';

export const OPEN_SEARCH_INDEXING_QUEUE_NAME = 'open-search-indexing-queue';
export const OPEN_SEARCH_BATCH_INDEXING_JOB_NAME =
  'open-search-batch-indexing-job';

export interface BatchIndexingJob {
  entityName: IndexableEntityName;
  jobType: IndexingJobType;
  requests: IndexingRequest[];
}

@Injectable()
export class OSIndexingServiceProducer extends WildrProducer {
  constructor(
    @InjectQueue(OPEN_SEARCH_INDEXING_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async index(job: BatchIndexingJob) {
    await this.produce(OPEN_SEARCH_BATCH_INDEXING_JOB_NAME, job);
  }
}
