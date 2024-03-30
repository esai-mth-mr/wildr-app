import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PostService } from '@verdzie/server/post/post.service';
import {
  UPDATE_VIEW_COUNT_JOB_NAME,
  UPDATE_VIEW_COUNT_QUEUE_NAME,
  UpdateViewCountJob,
} from '@verdzie/server/worker/update-view-count/updateViewCount.producer';
import { Job } from 'bull';
import { UserService } from '@verdzie/server/user/user.service';

@Processor(UPDATE_VIEW_COUNT_QUEUE_NAME)
export class UpdateViewCountConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private postService: PostService,
    private userService: UserService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(UPDATE_VIEW_COUNT_JOB_NAME)
  async updateViewCount(job: Job<UpdateViewCountJob>) {
    const postIds = job.data.postIds;
    const posts = await this.postService.findByIds(postIds, {});
    if (!posts) {
      this.logger.info('No posts found for ids', { postIds: [...postIds] });
      return;
    }
    const postTypes: number[] = [];
    const categoryIds: string[] = [];
    for (const post of posts) {
      postTypes.push(post.type);
      categoryIds.push(...(post.categoryIds ?? []));
    }
    await this.userService.updatePostTypeViewCount(job.data.userId, postTypes);
    await this.userService.updatePostCategoryViewCount(
      job.data.userId,
      categoryIds
    );
  }
}
