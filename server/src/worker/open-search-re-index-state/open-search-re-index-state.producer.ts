import { Inject, Injectable } from '@nestjs/common';
import { WildrProducer } from '../common/wildrProducer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Queue } from 'bull';
import { Logger } from 'winston';
import { InjectQueue } from '@nestjs/bull';
import { IndexableEntityName } from '@verdzie/server/open-search-v2/index-version/index-version.service';
import { IndexRequests } from '@verdzie/server/open-search-v2/index-state/index-state.service';
import { SnapshotType } from '@verdzie/server/open-search-v2/index-wal/index-wal.service';

export const OPEN_SEARCH_RE_INDEX_STATE_QUEUE_NAME =
  'open-search-re-index-state-queue';
export const OPEN_SEARCH_RE_INDEX_REQUEST_JOB_NAME =
  'open-search-re-index-request-job';
export const OPEN_SEARCH_RE_INDEX_COMPLETE_JOB_NAME =
  'open-search-re-index-complete-job';

export interface ReIndexRequestJob {
  entityIds: string[];
  entityName: IndexableEntityName;
  requests: IndexRequests;
}

export interface MarkReIndexCompleteJob {
  entityName: IndexableEntityName;
  snapshots: SnapshotType[];
}

@Injectable()
export class OSReIndexStateProducer extends WildrProducer {
  constructor(
    @InjectQueue(OPEN_SEARCH_RE_INDEX_STATE_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue, { skipJobPayloadLogging: true });
    this.logger = logger.child({ context: this.constructor.name });
  }

  async requestReIndex(job: ReIndexRequestJob) {
    await this.produce(OPEN_SEARCH_RE_INDEX_REQUEST_JOB_NAME, job);
  }

  async markReIndexComplete(job: MarkReIndexCompleteJob) {
    await this.produce(OPEN_SEARCH_RE_INDEX_COMPLETE_JOB_NAME, job);
  }
}
