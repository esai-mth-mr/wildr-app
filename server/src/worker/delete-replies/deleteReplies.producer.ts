import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '../worker.helper';

@Injectable()
export class DeleteRepliesProducer {
  constructor(
    @InjectQueue('delete-replies-queue') private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'DeleteRepliesProducer' });
  }

  async deleteReplies(job: DeleteRepliesJob) {
    await queueWithLogging(this.logger, this.queue, 'delete-replies-job', job, {
      length: job.ids.length,
    });
  }
}

export interface DeleteRepliesJob {
  ids: string[];
}
