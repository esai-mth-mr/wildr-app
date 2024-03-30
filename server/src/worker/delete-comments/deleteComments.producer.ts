import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { CommentEntity } from '../../comment/comment.entity';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '../worker.helper';

@Injectable()
export class DeleteCommentsProducer {
  constructor(
    @InjectQueue('delete-comments-queue') private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'DeleteCommentsProducer' });
  }

  async deleteComments(job: DeleteCommentsJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'delete-comments-job',
      job,
      {
        length: job.ids?.length ?? job.comments?.length,
      }
    );
  }
}

export interface DeleteCommentsJob {
  ids?: string[];
  comments?: CommentEntity[];
}
