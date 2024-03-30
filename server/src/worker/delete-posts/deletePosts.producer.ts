import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { PostEntity } from '../../post/post.entity';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '../worker.helper';

@Injectable()
export class DeletePostsProducer {
  constructor(
    @InjectQueue('delete-posts-queue') private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'DeletePostsProducer' });
  }

  async deletePosts(job: DeletePostsJob) {
    await queueWithLogging(this.logger, this.queue, 'delete-posts-job', job, {
      size: job.posts.length,
    });
  }
}

export interface DeletePostsJob {
  posts: PostEntity[];
}
