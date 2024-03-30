import { Module } from '@nestjs/common';
import { TagModule } from '../../tag/tag.module';
import { OpenSearchIndexService } from './openSearchIndex.service';

@Module({
  imports: [TagModule],
  providers: [OpenSearchIndexService],
  exports: [OpenSearchIndexService],
})
export class OpenSearchIndexModule {}
