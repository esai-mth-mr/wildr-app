import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Job } from 'bull';
import { ActivityService } from '../../activity/activity.service';
import {
  NotifyAuthorAboutCommentOnPostJob,
  NotifyAuthorAboutFollowedEventJob,
  NotifyAuthorAboutReactionOnPostJob,
  NotifyAuthorAboutReplyOnCommentJob,
  NotifyAuthorAboutReactionOnCommentJob,
  NotifyAuthorAboutReactionOnReplyJob,
  UserAddedToFollowingJob,
  NOTIFY_AUTHOR_REACTION_ON_POST_JOB_NAME,
  NOTIFY_AUTHOR_COMMENT_ON_POST_JOB_NAME,
  NOTIFY_AUTHOR_REPLY_ON_COMMENT_JOB_NAME,
  NOTIFY_AUTHOR_FOLLOWED_EVENT_JOB_NAME,
  NOTIFY_AUTO_ADDED_TO_FOLLOWING_JOB_NAME,
  NOTIFY_AUTHOR_REACTION_ON_COMMENT_JOB_NAME,
  NOTIFY_AUTHOR_REACTION_ON_REPLY_JOB_NAME,
  NOTIFY_AUTHOR_QUEUE_NAME,
  NOTIFY_AUTHOR_COMMENT_ON_CHALLENGE_JOB_NAME,
  NotifyAuthorCommentOnChallengeJob,
} from './notifyAuthor.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(NOTIFY_AUTHOR_QUEUE_NAME)
export class NotifyAuthorConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private activityService: ActivityService
  ) {
    this.logger = logger.child({ context: 'NotifyAuthorConsumer' });
  }

  @Process(NOTIFY_AUTHOR_REACTION_ON_POST_JOB_NAME)
  async notifyAuthorAboutReactionOnPost(
    job: Job<NotifyAuthorAboutReactionOnPostJob>
  ) {
    await this.activityService.reactOnPost(job.data);
  }

  @Process(NOTIFY_AUTHOR_COMMENT_ON_POST_JOB_NAME)
  async notifyAuthorAboutCommentOnPostJob(
    job: Job<NotifyAuthorAboutCommentOnPostJob>
  ) {
    await this.activityService.commentOnPost(job.data);
  }

  @Process(NOTIFY_AUTHOR_REPLY_ON_COMMENT_JOB_NAME)
  async notifyAuthorAboutReplyOnCommentJob(
    job: Job<NotifyAuthorAboutReplyOnCommentJob>
  ) {
    await this.activityService.replyOnComment(job.data);
  }

  @Process(NOTIFY_AUTHOR_FOLLOWED_EVENT_JOB_NAME)
  async notifyAuthorAboutFollowedEventJob(
    job: Job<NotifyAuthorAboutFollowedEventJob>
  ) {
    await this.activityService.followedEvent(job.data);
  }

  @Process(NOTIFY_AUTO_ADDED_TO_FOLLOWING_JOB_NAME)
  async notifyAutoAddedToFollowing(job: Job<UserAddedToFollowingJob>) {
    await this.activityService.automaticallyAddedToFollowing(job.data);
  }

  @Process(NOTIFY_AUTHOR_REACTION_ON_COMMENT_JOB_NAME)
  async notifyAuthorReactionOnComment(
    job: Job<NotifyAuthorAboutReactionOnCommentJob>
  ) {
    await this.activityService.reactOnComment(job.data);
  }

  @Process(NOTIFY_AUTHOR_REACTION_ON_REPLY_JOB_NAME)
  async notifyAuthorReactionOnReply(
    job: Job<NotifyAuthorAboutReactionOnReplyJob>
  ) {
    await this.activityService.reactOnReply(job.data);
  }

  @Process(NOTIFY_AUTHOR_COMMENT_ON_CHALLENGE_JOB_NAME)
  async notifyAuthorCommentOnChallenge(
    job: Job<NotifyAuthorCommentOnChallengeJob>
  ) {
    await this.activityService.commentOnChallenge(job.data);
  }
}
