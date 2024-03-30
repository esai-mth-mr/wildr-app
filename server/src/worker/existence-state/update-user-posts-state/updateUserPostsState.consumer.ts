import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Job } from 'bull';
import {
  RespawnUserPostsJob,
  TakeDownUserPostsJob,
} from '@verdzie/server/worker/existence-state/update-user-posts-state/updateUserPostsState.producer';
import { UserService } from '@verdzie/server/user/user.service';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { PostService } from '@verdzie/server/post/post.service';

@Processor('update-user-posts-state-queue')
export class UpdateUserPostsStateConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly feedService: FeedService,
    private readonly postService: PostService
  ) {
    this.logger = this.logger.child({
      context: 'UpdateUserPostsStateConsumer',
    });
  }

  @Process('take-down-user-posts-job')
  async takeDownUserPosts(job: Job<TakeDownUserPostsJob>) {
    const userPostsFeed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS, job.data.userId)
    );
    if (!userPostsFeed) {
      this.logger.info('No USER_PUB_PVT_POSTS feed found for user', {
        userId: job.data.userId,
      });
      return;
    }
    const postIds = userPostsFeed.page.ids;
    const BATCH_SIZE = 100;
    while (postIds.length !== 0) {
      await this.postService.takeDownPosts(postIds.splice(0, BATCH_SIZE));
    }
  }

  @Process('respawn-user-posts-job')
  async respawnUserPosts(job: Job<RespawnUserPostsJob>) {
    const userPostsFeed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS, job.data.userId)
    );
    if (!userPostsFeed) {
      this.logger.info('No USER_PUB_PVT_POSTS feed found for user', {
        userId: job.data.userId,
      });
      return;
    }
    const postIds = userPostsFeed.page.ids;
    this.logger.info('respawning posts', { length: postIds.length });
    const BATCH_SIZE = 100;
    while (postIds.length !== 0) {
      const result = await this.postService.respawnPosts(
        postIds.splice(0, BATCH_SIZE)
      );
    }
  }
}
