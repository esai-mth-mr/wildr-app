import { Inject, Injectable } from '@nestjs/common';
import {
  IndexVersionAlias,
  IndexVersionName,
  IndexableEntity,
  IndexableEntityName,
} from '@verdzie/server/open-search-v2/index-version/index-version.service';
import { getEntityConstructorFromName } from '@verdzie/server/open-search-v2/open-search.common';
import { OSReIndexCoordinatorProducer } from '@verdzie/server/worker/open-search-re-index-coordinator/open-search-re-index-coordinator.producer';
import { OSReIndexStateProducer } from '@verdzie/server/worker/open-search-re-index-state/open-search-re-index-state.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Connection, LessThanOrEqual } from 'typeorm';
import { Logger } from 'winston';

export const RE_INDEX_BATCH_SIZE = 50;

@Injectable()
export class OSReIndexCoordinatorService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger,
    private readonly reIndexCoordinatorProducer: OSReIndexCoordinatorProducer,
    private readonly reIndexStateProducer: OSReIndexStateProducer,
    private readonly connection: Connection
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async batchIndex({
    entityName,
    indexVersionName,
    indexVersionAlias,
    cursor,
  }: {
    entityName: IndexableEntityName;
    indexVersionName: IndexVersionName;
    indexVersionAlias: IndexVersionAlias;
    cursor?: IndexableEntity;
  }) {
    this.logger.debug('[batchIndex] starting batch index');
    const entityRepository = this.connection.getRepository(
      getEntityConstructorFromName(entityName)
    );
    // Batch processor starts at newest and proceeds to oldest, new records will
    // be handled by incremental index if needed
    const newestDate = cursor?.createdAt || new Date();
    const entitiesToIndex = await entityRepository.find({
      select: ['id', 'createdAt'],
      where: {
        createdAt: LessThanOrEqual(newestDate),
      },
      order: {
        createdAt: 'DESC',
      },
      take: RE_INDEX_BATCH_SIZE,
    });
    const entityIds = entitiesToIndex.reduce((acc: string[], entity) => {
      if (!cursor || entity.id !== cursor.id) {
        acc.push(entity.id);
      }
      return acc;
    }, []);
    if (!entityIds || !entityIds.length) {
      this.logger.info('[batchIndex] no more entities to index', {
        entityName,
        indexVersionName,
        indexVersionAlias,
      });
      return;
    }
    this.logger.debug('[batchIndex] making re-index state update request', {
      entityIds,
      entityName,
      requests: {
        [indexVersionAlias]: indexVersionName,
      },
    });
    // Update re-index state to continuous indexer
    await this.reIndexStateProducer.requestReIndex({
      entityIds,
      entityName,
      requests: {
        [indexVersionAlias]: indexVersionName,
      },
    });
    // Call itself recursively to continue indexing
    await this.reIndexCoordinatorProducer.reIndex({
      entityName,
      indexVersionName,
      indexVersionAlias,
      cursor: entitiesToIndex[entitiesToIndex.length - 1],
    });
  }
}
