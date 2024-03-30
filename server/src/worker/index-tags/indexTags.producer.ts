import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { TagEntity } from '../../tag/tag.entity';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '../worker.helper';

@Injectable()
export class IndexTagsProducer {
  constructor(
    @InjectQueue('index-tags-queue') private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'IndexTagsProducer' });
  }

  async indexTags(job: IndexTagJob) {
    queueWithLogging(this.logger, this.queue, 'index-tags-job', job, {
      job,
    });
  }
}

export interface IndexTagJob {
  tags: TagEntity[];
}
