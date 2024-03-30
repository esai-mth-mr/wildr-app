import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { NotifyFollowersAboutPostsJob } from '@verdzie/server/worker/notify-followers-about-posts/notifyFollowersAboutPosts.producer';
import { ActivityService } from '@verdzie/server/activity/activity.service';

@Processor('notify-followers-about-posts-queue')
export class NotifyFollowersAboutPostsConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private activityService: ActivityService
  ) {
    console.info('NotifyFollowersAboutPostsConsumer created');
    this.logger = this.logger.child({
      context: 'NotifyFollowersAboutPostsConsumer',
    });
  }

  @Process('notify-followers-about-post-job')
  async notifyFollowers(job: Job<NotifyFollowersAboutPostsJob>) {
    //In the future, we'll check whether the follower has subscribed to the
    // notification or any other logic to decide whether to notify them
    for (const follower of job.data.followerIds) {
      try {
        await this.activityService.followeePosted(follower, job.data.postId);
      } catch (e) {
        this.logger.error(e);
      }
    }
  }
}
