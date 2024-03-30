import { Inject, Injectable } from '@nestjs/common';
import {
  IndexVersionAlias,
  IndexVersionName,
  IndexableEntityName,
} from '@verdzie/server/open-search-v2/index-version/index-version.service';
import { OSIndexingService } from '@verdzie/server/open-search-v2/indexing/indexing.service';
import { OSReIndexCoordinatorProducer } from '@verdzie/server/worker/open-search-re-index-coordinator/open-search-re-index-coordinator.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AdminOpenSearchService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly osReIndexCoordinatorProducer: OSReIndexCoordinatorProducer,
    private readonly indexingService: OSIndexingService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async startIndexConstruction({
    entityName,
    indexVersionName,
    indexVersionAlias,
  }: {
    entityName: IndexableEntityName;
    indexVersionName: IndexVersionName;
    indexVersionAlias: IndexVersionAlias;
  }) {
    await this.indexingService.upsertMapping({
      entityName,
      indexVersionName,
      indexVersionAlias,
    });

    await this.osReIndexCoordinatorProducer.reIndex({
      entityName,
      indexVersionName,
      indexVersionAlias,
    });
  }
}
