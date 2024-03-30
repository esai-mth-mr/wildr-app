import { Inject, Injectable } from '@nestjs/common';
import { Connection, In } from 'typeorm';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { IndexableEntityName } from '@verdzie/server/open-search-v2/index-version/index-version.service';
import {
  IndexRequests,
  IndexingState,
} from '@verdzie/server/open-search-v2/index-state/index-state.service';
import {
  getEntityIndexStateConstructorFromName,
  getRequestsKeyFromJobType,
  getStateKeyFromJobType,
} from '@verdzie/server/open-search-v2/open-search.common';
import _ from 'lodash';
import { OSIndexingServiceProducer } from '@verdzie/server/worker/open-search-indexing/open-search-indexing.producer';
import { IndexingJobType } from '@verdzie/server/open-search-v2/indexing/indexing.service';
import { InjectConnection } from '@nestjs/typeorm';
import { BI_CONNECTION_NAME } from '@verdzie/server/typeorm/typeormconfig-bi';

export const INDEXING_JOB_BATCH_SIZE = 20;

export interface IndexingRequest {
  id: string;
  requests: IndexRequests;
}

@Injectable()
export class OSIndexingAggregatorService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectConnection(BI_CONNECTION_NAME)
    private readonly connection: Connection,
    private readonly indexingServiceProducer: OSIndexingServiceProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async createAggregatedJobs(
    entityName: IndexableEntityName,
    indexingJobType: IndexingJobType
  ) {
    this.logger.debug('[aggregateJobs] aggregating jobs', {
      entityName,
      indexingJobType,
    });
    const stateKey = getStateKeyFromJobType(indexingJobType);
    const requestsKey = getRequestsKeyFromJobType(indexingJobType);
    await this.connection.transaction(async manager => {
      const entityStateRepository = manager.getRepository(
        getEntityIndexStateConstructorFromName(entityName)
      );
      // Lock the records with `READY` state in incrementalIndexState or
      // reIndexState depending on the `indexingJobType`
      const entityStates = await entityStateRepository.find({
        // don't grab snapshot to save memory
        select: ['id', requestsKey],
        where: { [stateKey]: IndexingState.READY },
        // ensure that a concurrent index requests that set state to READY
        // don't get overwritten when this transaction commits
        lock: { mode: 'pessimistic_write' },
        take: INDEXING_JOB_BATCH_SIZE * 20,
      });
      if (!entityStates.length) {
        this.logger.debug('[aggregateJobs] no records need index update', {
          entityName,
        });
        return;
      }
      // Create batches of n records
      const batches = _.chunk(
        entityStates.map(entityState => ({
          id: entityState.id,
          requests: entityState[requestsKey] ?? {},
        })),
        INDEXING_JOB_BATCH_SIZE
      );
      // Create a job for each batch
      await Promise.all(
        batches.map(batch =>
          this.indexingServiceProducer.index({
            entityName,
            jobType: indexingJobType,
            requests: batch,
          })
        )
      );
      this.logger.debug('[aggregateJobs] jobs created successfully');
      // Update the records with `INDEXING` state in incrementalIndexState or
      // reIndexState
      await entityStateRepository.update(
        {
          id: In(entityStates.map(entityState => entityState.id)),
        },
        {
          [stateKey]: IndexingState.INDEXING,
        }
      );
    });
  }
}
