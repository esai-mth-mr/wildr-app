import { Process, Processor } from '@nestjs/bull';
import { OpenSearchIndexService } from '../../open-search/open-search-index/openSearchIndex.service';
import { Job } from 'bull';
import { IndexTagJob } from './indexTags.producer';

@Processor('index-tags-queue')
export class IndexTagsConsumer {
  constructor(private openSearchIndexService: OpenSearchIndexService) {}

  @Process('index-tags-job')
  async indexTag(job: Job<IndexTagJob>) {
    await this.openSearchIndexService.indexMultipleHashTags(job.data.tags);
  }
}
