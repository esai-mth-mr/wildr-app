import { Body, Controller, Inject, Injectable, Post } from '@nestjs/common';
import { ConstructIndexDto } from '@verdzie/server/admin/open-search/dto/construct-index.dto';
import { AdminOpenSearchService } from '@verdzie/server/admin/open-search/admin-open-search.service';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
@Controller('open-search')
export class AdminOpenSearchController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly openSearchService: AdminOpenSearchService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Post('construct-index')
  async constructIndex(@Body() body: ConstructIndexDto) {
    await this.openSearchService.startIndexConstruction({
      entityName: body.entityName,
      indexVersionName: body.indexVersionName,
      indexVersionAlias: body.indexVersionAlias,
    });
  }
}
