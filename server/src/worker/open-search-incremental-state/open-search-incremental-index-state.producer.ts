import { Inject, Injectable } from '@nestjs/common';
import { WildrProducer } from '../common/wildrProducer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Queue } from 'bull';
import { Logger } from 'winston';
import { InjectQueue } from '@nestjs/bull';
import { IndexableEntityName } from '@verdzie/server/open-search-v2/index-version/index-version.service';
import { SnapshotType } from '@verdzie/server/open-search-v2/index-wal/index-wal.service';

export const OPEN_SEARCH_INCREMENTAL_INDEX_STATE_QUEUE_NAME =
  'open-search-incremental-index-state-queue';
export const OPEN_SEARCH_INCREMENTAL_INDEX_REQUEST_JOB_NAME =
  'open-search-incremental-index-request-job';
export const OPEN_SEARCH_INCREMENTAL_INDEX_COMPLETE_JOB_NAME =
  'open-search-incremental-index-complete-job';

export interface IncrementalIndexRequestJob {
  entityName: IndexableEntityName;
  entityId: string;
}

export interface MarkIncrementalIndexCompleteJob {
  entityName: IndexableEntityName;
  snapshots: SnapshotType[];
}

@Injectable()
export class OSIncrementalIndexStateProducer extends WildrProducer {
  constructor(
    @InjectQueue(OPEN_SEARCH_INCREMENTAL_INDEX_STATE_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue, { skipJobPayloadLogging: true });
    this.logger = logger.child({ context: this.constructor.name });
  }

  async requestIncrementalIndex(job: IncrementalIndexRequestJob) {
    await this.produce(OPEN_SEARCH_INCREMENTAL_INDEX_REQUEST_JOB_NAME, job);
  }

  async markIncrementalIndexComplete(job: MarkIncrementalIndexCompleteJob) {
    await this.produce(OPEN_SEARCH_INCREMENTAL_INDEX_COMPLETE_JOB_NAME, job);
  }
}
