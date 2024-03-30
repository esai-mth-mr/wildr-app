import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { UserListService } from '@verdzie/server/user-list/userList.service';
import {
  DISTRIBUTE_POSTS_TO_LISTS_JOB_NAME,
  DISTRIBUTE_POSTS_TO_LISTS_QUEUE_NAME,
  DistributePostToListsJob,
} from '@verdzie/server/worker/distribute-post/distribute-post-to-lists-worker/distributePostToListsWorker.config';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(DISTRIBUTE_POSTS_TO_LISTS_QUEUE_NAME)
export class DistributePostToListsConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private readonly userListService: UserListService
  ) {
    console.info('DistributePostToListsConsumer created');
    this.logger = this.logger.child({
      context: 'DistributePostToListsConsumer',
    });
  }

  /**
   * listIds are just Page1 of the lists
   * need to find the last page to push into
   */
  @Process(DISTRIBUTE_POSTS_TO_LISTS_JOB_NAME)
  async distributePostToListsJob(job: Job<DistributePostToListsJob>) {
    this.logger.info('distributePostToListsJob()', {});
    for (const listId of job.data.listIds) {
      await this.userListService.addPostToConsumptionFeed(
        listId,
        job.data.postId,
        job.data.postType
      );
    }
  }
}
