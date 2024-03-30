import { Module } from '@nestjs/common';
import { EntitiesWithPagesCommon } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';

@Module({
  providers: [EntitiesWithPagesCommon],
  exports: [EntitiesWithPagesCommon],
})
export class EntitiesWithPagesModule {}
