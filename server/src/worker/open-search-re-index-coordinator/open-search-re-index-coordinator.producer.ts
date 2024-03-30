import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import {
  IndexVersionAlias,
  IndexVersionName,
  IndexableEntity,
  IndexableEntityName,
} from '@verdzie/server/open-search-v2/index-version/index-version.service';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';

export const OPEN_SEARCH_RE_INDEX_QUEUE_NAME = 'open-search-re-index-queue';
export const OPEN_SEARCH_RE_INDEX_JOB_NAME = 'open-search-re-index-job';

export interface ReIndexJob {
  entityName: IndexableEntityName;
  cursor?: IndexableEntity;
  indexVersionName: IndexVersionName;
  indexVersionAlias: IndexVersionAlias;
}

const TWO_MINUTES = 1000 * 60 * 2;

@Injectable()
export class OSReIndexCoordinatorProducer extends WildrProducer {
  constructor(
    @InjectQueue(OPEN_SEARCH_RE_INDEX_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async reIndex(job: ReIndexJob) {
    await this.produce(OPEN_SEARCH_RE_INDEX_JOB_NAME, job, {
      delay:
        SSMParamsService.Instance.openSearchParams.OPEN_SEARCH_RE_INDEX_DELAY ??
        TWO_MINUTES,
    });
  }
}
