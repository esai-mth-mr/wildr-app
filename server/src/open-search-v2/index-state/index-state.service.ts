import { Inject, Injectable } from '@nestjs/common';
import {
  IndexVersionAlias,
  IndexVersionName,
  IndexVersionService,
  IndexableEntityName,
} from '@verdzie/server/open-search-v2/index-version/index-version.service';
import { Connection, In } from 'typeorm';
import { Logger } from 'winston';
import {
  getEntityConstructorFromName,
  getEntityIndexStateConstructorFromName,
} from '../open-search.common';
import { PostEntityIndexState } from './post-entity/post-entity-index-state.entity.bi';
import { UserEntityIndexState } from './user-entity/user-entity-index-state.entity.bi';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { WildrExceptionDecorator } from '@verdzie/server/common/wildr-exception.decorator';
import { SnapshotType } from '@verdzie/server/open-search-v2/index-wal/index-wal.service';
import { InjectConnection } from '@nestjs/typeorm';
import { BI_CONNECTION_NAME } from '@verdzie/server/typeorm/typeormconfig-bi';

export const DEFAULT_INDEX_VERSION_ALIAS = 'production';

export enum IndexingState {
  READY,
  INDEXING,
  INDEXED,
}

export type EntityIndexStateTypes = UserEntityIndexState | PostEntityIndexState;

/**
 * @deprecated use `IndexRequestTuples` instead to prevent overwriting of index
 * requests with the same alias. This is still used when re-indexing as there
 * can't be multiple versions requested for re-indexing.
 */
export interface IndexRequests {
  [name: IndexVersionAlias]: IndexVersionName;
}

export interface IndexRequestTuples {
  __typename: 'IndexRequestTuples';
  tuples: {
    [N in IndexVersionName]?: IndexVersionAlias[];
  };
}

export const isInIndexRequestTuples = (req: any): req is IndexRequestTuples => {
  if (typeof req === 'object' && req !== null) {
    return req?.__typename === 'IndexRequestTuples';
  }
  return false;
};

export interface EntityIndexState {
  id: string;
  snapshot?: SnapshotType;
  incrementalIndexState?: IndexingState;
  incrementalIndexRequests?: IndexRequests | IndexRequestTuples;
  reIndexState?: IndexingState;
  reIndexRequests?: IndexRequests | IndexRequestTuples;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class OSIndexStateService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectConnection(BI_CONNECTION_NAME)
    private readonly connection: Connection,
    private readonly indexVersionService: IndexVersionService
  ) {
    this.logger = logger.child({ context: OSIndexStateService.name });
  }

  @WildrExceptionDecorator()
  async recordIncrementalIndexRequest({
    entityId,
    entityName,
  }: {
    entityId: string;
    entityName: IndexableEntityName;
  }) {
    const context = {
      entityId,
      entityName,
      methodName: 'recordIncrementalIndexRequest',
    };
    this.logger.debug('recording index request', context);
    const incrementalIndexVersions =
      this.indexVersionService.getIncrementalIndexVersions(
        getEntityConstructorFromName(entityName)
      );
    const repo = this.connection.getRepository(
      getEntityIndexStateConstructorFromName(entityName)
    );
    const incrementalIndexRequests: IndexRequestTuples = {
      __typename: 'IndexRequestTuples',
      tuples: {},
    };
    for (const version of incrementalIndexVersions) {
      if (!incrementalIndexRequests.tuples[version.name]) {
        incrementalIndexRequests.tuples[version.name] = [];
      }
      incrementalIndexRequests.tuples[version.name]!.push(
        DEFAULT_INDEX_VERSION_ALIAS
      );
    }
    this.logger.debug('created index request', {
      ...context,
      incrementalIndexRequests,
    });
    await repo.upsert(
      {
        id: entityId,
        incrementalIndexState: IndexingState.READY,
        incrementalIndexRequests,
      },
      {
        conflictPaths: ['id'],
      }
    );
  }

  @WildrExceptionDecorator()
  async recordReIndexRequest({
    entityIds,
    entityName,
    requests,
  }: {
    entityIds: string[];
    entityName: IndexableEntityName;
    requests: IndexRequests;
  }) {
    const context = {
      entityIds,
      entityName,
      methodName: 'recordReIndexRequest',
    };
    this.logger.debug('recording re-index request', context);
    const repo = this.connection.getRepository(
      getEntityIndexStateConstructorFromName(entityName)
    );
    await repo.upsert(
      entityIds.map(id => ({
        id,
        reIndexState: IndexingState.READY,
        reIndexRequests: requests,
      })),
      {
        conflictPaths: ['id'],
      }
    );
  }

  @WildrExceptionDecorator()
  async markIncrementalIndexComplete({
    snapshots,
    entityName,
  }: {
    snapshots: SnapshotType[];
    entityName: IndexableEntityName;
  }) {
    const context = {
      methodName: 'markIncrementalIndexComplete',
      entityName,
      count: snapshots.length,
    };
    this.logger.debug('marking index complete', context);
    await this.connection.transaction(async manager => {
      const indexStateRepo = manager.getRepository(
        getEntityIndexStateConstructorFromName(entityName)
      );
      const indexStates = await indexStateRepo.find({
        where: {
          id: In(snapshots.map(snapshot => snapshot.id)),
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });
      const updates = indexStates.map(indexState => {
        // Only set those that are still in the INDEXING state to avoid
        // overwriting another incremental index request
        if (indexState.incrementalIndexState === IndexingState.INDEXING) {
          this.logger.debug('setting state to INDEXED', {
            entityId: indexState.id,
            ...context,
          });
          indexState.incrementalIndexState = IndexingState.INDEXED;
          indexState.incrementalIndexRequests = {};
        }
        const snapshot = snapshots.find(s => s.id === indexState.id);
        if (!snapshot) {
          this.logger.error('snapshot not found', {
            entityId: indexState.id,
            ...context,
          });
        } else {
          indexState.snapshot = snapshot;
        }
        return indexState;
      });
      await indexStateRepo.upsert(updates, {
        conflictPaths: ['id'],
      });
    });
  }

  @WildrExceptionDecorator()
  async markReIndexComplete({
    snapshots,
    entityName,
  }: {
    snapshots: SnapshotType[];
    entityName: IndexableEntityName;
  }) {
    const context = {
      methodName: 'markReIndexComplete',
      entityName,
      count: snapshots.length,
    };
    this.logger.info('marking re-index complete', context);
    await this.connection.transaction(async manager => {
      const indexStateRepo = manager.getRepository(
        getEntityIndexStateConstructorFromName(entityName)
      );
      const indexStates = await indexStateRepo.find({
        where: {
          id: In(snapshots.map(snapshot => snapshot.id)),
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });
      const updates = indexStates.map(indexState => {
        // Only set those that are still in the INDEXING state to avoid
        // overwriting another incremental index request
        if (indexState.reIndexState === IndexingState.INDEXING) {
          this.logger.debug('setting state to INDEXED', {
            entityId: indexState.id,
            ...context,
          });
          indexState.reIndexState = IndexingState.INDEXED;
          indexState.reIndexRequests = {};
        }
        const snapshot = snapshots.find(
          snapshot => snapshot.id === indexState.id
        );
        if (!snapshot) {
          this.logger.error('snapshot not found', {
            entityId: indexState.id,
            ...context,
          });
        } else {
          indexState.snapshot = snapshot;
        }
        return indexState;
      });
      await indexStateRepo.upsert(updates, {
        conflictPaths: ['id'],
      });
    });
  }
}
