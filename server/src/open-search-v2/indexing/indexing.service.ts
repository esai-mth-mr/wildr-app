import {
  IndexRequestTuples,
  IndexRequests,
  isInIndexRequestTuples,
} from '../index-state/index-state.service';
import {
  IndexVersionAlias,
  IndexVersionName,
  IndexVersionService,
  IndexableEntityName,
} from '../index-version/index-version.service';
import { Logger } from 'winston';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { getEntityConstructorFromName } from '../open-search.common';
import {
  OSIndexWALService,
  SnapshotType,
} from '@verdzie/server/open-search-v2/index-wal/index-wal.service';
import { OpenSearchClient } from '@verdzie/server/open-search-v2/open-search.client';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@verdzie/server/exceptions/wildr.exception';
import { OSIncrementalIndexStateProducer } from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.producer';
import { OSReIndexStateProducer } from '@verdzie/server/worker/open-search-re-index-state/open-search-re-index-state.producer';

export interface IndexingRequest {
  id: string;
  requests: IndexRequests | IndexRequestTuples;
}

export enum IndexingJobType {
  RE_INDEX,
  INCREMENTAL_INDEX,
}

interface IndexingRequestWithSnapshot extends IndexingRequest {
  snapshot: SnapshotType;
}

@Injectable()
export class OSIndexingService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly indexVersionService: IndexVersionService,
    private readonly indexWALService: OSIndexWALService,
    private readonly openSearchClient: OpenSearchClient,
    private readonly incrementalIndexStateProducer: OSIncrementalIndexStateProducer,
    private readonly reIndexStateProducer: OSReIndexStateProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async indexMany(
    entityName: IndexableEntityName,
    requests: IndexingRequest[],
    jobType: IndexingJobType
  ) {
    const context = {
      methodName: 'indexMany',
      entityName,
      jobType,
    };
    this.logger.info('updating indexes', context);
    // Get snapshots for each entity
    const requestsWithSnapshots: IndexingRequestWithSnapshot[] =
      await Promise.all(
        requests.map(async request => {
          const snapshot = await this.indexVersionService.getSnapshot(
            getEntityConstructorFromName(entityName),
            request.id
          );
          return {
            ...request,
            snapshot,
          };
        })
      );
    // Create update records
    const individualUpdates = this.getIndividualUpdates({
      requestsWithSnapshots,
      entityName,
    });
    let bulkRequest = '';
    if (individualUpdates.length) {
      // Create os _bulk request
      bulkRequest += '\n';
      individualUpdates.forEach(update => {
        const {
          indexAlias,
          indexVersion,
          entitySnapshot: serializedEntity,
          osDoc,
        } = update;
        const { id } = serializedEntity;
        bulkRequest += JSON.stringify({
          index: {
            _index: this.getMappingName(indexVersion, indexAlias),
            _id: id,
          },
        });
        bulkRequest += '\n';
        bulkRequest += JSON.stringify(osDoc);
        bulkRequest += '\n';
      });
    }
    this.logger.debug('updating WAL', context);
    // Log updates to WAL
    await this.indexWALService.logEntityIndexUpdates(
      individualUpdates.map(update => ({
        indexVersion: update.indexVersion,
        indexAlias: update.indexAlias,
        entitySnapshot: update.entitySnapshot,
      }))
    );
    // Send bulk request to OS
    if (bulkRequest.length) {
      this.logger.debug('sending bulk request to open search', context);
      const { data } = await this.openSearchClient.client
        .post('_bulk', bulkRequest, {
          headers: {
            'Content-Type': 'application/x-ndjson',
          },
        })
        .catch(error => {
          this.logger.error('error indexing entities', {
            error,
            bulkRequest,
            ...context,
          });
          throw new InternalServerErrorException('Error indexing entities', {
            error,
            bulkRequest,
          });
        });
      if (data.errors) {
        this.logger.error('error indexing entities', {
          errors: data?.items?.filter((item: any) => item.index.error),
          ...context,
        });
        throw new InternalServerErrorException('Error indexing entities');
      }
    }
    // Create job to update state using index state service producer
    if (jobType === IndexingJobType.INCREMENTAL_INDEX) {
      this.logger.debug('creating incremental index state updated job', {
        ...context,
      });
      await this.incrementalIndexStateProducer.markIncrementalIndexComplete({
        entityName,
        snapshots: requestsWithSnapshots.map(request => request.snapshot),
      });
    } else if (jobType === IndexingJobType.RE_INDEX) {
      this.logger.debug('creating re-index state updated job', context);
      await this.reIndexStateProducer.markReIndexComplete({
        entityName,
        snapshots: requestsWithSnapshots.map(request => request.snapshot),
      });
    }
  }

  requestsToIndexVersionAliasesMap({
    requests,
  }: {
    requests: IndexRequests | IndexRequestTuples;
  }): {
    indexVersion: IndexVersionName;
    indexAliases: IndexVersionAlias[];
  }[] {
    const versionsAndAliases = [];
    if (isInIndexRequestTuples(requests)) {
      for (const [indexVersion, indexAliases] of Object.entries(
        requests.tuples
      )) {
        versionsAndAliases.push({
          indexVersion: indexVersion as IndexVersionName,
          indexAliases,
        });
      }
    } else {
      for (const [indexAlias, indexVersion] of Object.entries(requests)) {
        versionsAndAliases.push({
          indexVersion,
          indexAliases: [indexAlias],
        });
      }
    }
    return versionsAndAliases;
  }

  getIndividualUpdates({
    requestsWithSnapshots,
    entityName,
  }: {
    requestsWithSnapshots: IndexingRequestWithSnapshot[];
    entityName: IndexableEntityName;
  }): {
    indexAlias: IndexVersionAlias;
    indexVersion: IndexVersionName;
    entitySnapshot: SnapshotType;
    osDoc: Record<string, any>;
  }[] {
    const context = {
      methodName: 'getIndividualUpdates',
      entityName,
    };
    // Create updates records
    const individualUpdates: {
      indexAlias: IndexVersionAlias;
      indexVersion: IndexVersionName;
      entitySnapshot: SnapshotType;
      osDoc: Record<string, any>;
    }[] = [];
    requestsWithSnapshots.forEach(request => {
      const versionsAndAliases = this.requestsToIndexVersionAliasesMap({
        requests: request.requests,
      });
      for (const version of versionsAndAliases) {
        const osDoc = this.indexVersionService.getOSDoc(
          getEntityConstructorFromName(entityName),
          version.indexVersion,
          request.snapshot
        );
        if (!osDoc) {
          this.logger.info('no os doc for entity', {
            ...context,
            indexVersion: version.indexVersion,
            entityName,
            snapshotId: request.snapshot.id,
          });
          return;
        }
        version.indexAliases.forEach(indexAlias => {
          individualUpdates.push({
            indexAlias,
            indexVersion: version.indexVersion,
            entitySnapshot: request.snapshot,
            osDoc,
          });
        });
      }
    });
    return individualUpdates;
  }

  getMappingName(
    indexVersionName: IndexVersionName,
    indexVersionAlias: string
  ) {
    return indexVersionName + '_' + indexVersionAlias;
  }

  async upsertMapping({
    entityName,
    indexVersionName,
    indexVersionAlias,
  }: {
    entityName: IndexableEntityName;
    indexVersionName: IndexVersionName;
    indexVersionAlias: IndexVersionAlias;
  }) {
    const context = {
      methodName: 'upsertMapping',
      entityName,
      indexVersionName,
      indexVersionAlias,
    };
    this.logger.info('creating index', context);
    const indexVersions = this.indexVersionService.findIndexVersions(
      getEntityConstructorFromName(entityName),
      [indexVersionName]
    );
    if (!indexVersions.length) {
      throw new BadRequestException(
        'Index version not found with name: "' +
          indexVersionName +
          '" for entity: "' +
          entityName +
          '"',
        context
      );
    }
    let indexExists = false;
    try {
      const { data } = await this.openSearchClient.client.get('/_mappings');
      const indexNames = Object.keys(data);
      indexExists = indexNames.includes(
        this.getMappingName(indexVersionName, indexVersionAlias)
      );
    } catch (error) {
      this.logger.error('error checking if index exists', {
        error: JSON.stringify(error),
        ...context,
      });
      throw new InternalServerErrorException(
        'Unknown error checking if index exists index',
        { error: JSON.stringify(error), ...context }
      );
    }
    if (indexExists) {
      this.logger.debug('index already exists', context);
      return;
    }
    try {
      this.logger.debug('[upsertMapping] creating index mapping');
      await this.openSearchClient.client.put(
        '/' + this.getMappingName(indexVersionName, indexVersionAlias),
        indexVersions[0].getMapping()
      );
    } catch (error) {
      throw new InternalServerErrorException('Unknown error creating index', {
        error: JSON.stringify(error),
      });
    }
  }
}
