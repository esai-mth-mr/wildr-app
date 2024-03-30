import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { ReactionType } from '../../generated-graphql';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';

export const NOTIFY_AUTHOR_QUEUE_NAME = 'notify-author-queue';

export const NOTIFY_AUTHOR_REACTION_ON_POST_JOB_NAME =
  'notify-author-reaction-on-post-job';
export const NOTIFY_AUTHOR_COMMENT_ON_POST_JOB_NAME =
  'notify-author-comment-on-post-job';
export const NOTIFY_AUTHOR_REPLY_ON_COMMENT_JOB_NAME =
  'notify-author-reply-on-comment-job';
export const NOTIFY_AUTHOR_FOLLOWED_EVENT_JOB_NAME =
  'notify-author-followed-event';
export const NOTIFY_AUTO_ADDED_TO_FOLLOWING_JOB_NAME =
  'notify-auto-added-to-following-job';
export const NOTIFY_AUTHOR_REACTION_ON_COMMENT_JOB_NAME =
  'notify-author-reaction-on-comment-job';
export const NOTIFY_AUTHOR_REACTION_ON_REPLY_JOB_NAME =
  'notify-author-reaction-on-reply-job';
export const NOTIFY_AUTHOR_COMMENT_ON_CHALLENGE_JOB_NAME =
  'notify-author-comment-on-challenge-job';

@Injectable()
export class NotifyAuthorProducer extends WildrProducer {
  constructor(
    @InjectQueue(NOTIFY_AUTHOR_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async reactionOnPost(job: NotifyAuthorAboutReactionOnPostJob) {
    await this.produce(NOTIFY_AUTHOR_REACTION_ON_POST_JOB_NAME, job);
  }

  async commentOnPostJob(job: NotifyAuthorAboutCommentOnPostJob) {
    await this.produce(NOTIFY_AUTHOR_COMMENT_ON_POST_JOB_NAME, job);
  }

  async replyOnCommentJob(job: NotifyAuthorAboutReplyOnCommentJob) {
    await this.produce(NOTIFY_AUTHOR_REPLY_ON_COMMENT_JOB_NAME, job);
  }

  async followedEventJob(job: NotifyAuthorAboutFollowedEventJob) {
    await this.produce(NOTIFY_AUTHOR_FOLLOWED_EVENT_JOB_NAME, job);
  }

  async userAutoAddedToFollowing(job: UserAddedToFollowingJob) {
    await this.produce(NOTIFY_AUTO_ADDED_TO_FOLLOWING_JOB_NAME, job);
  }

  async reactionOnComment(job: NotifyAuthorAboutReactionOnCommentJob) {
    await this.produce(NOTIFY_AUTHOR_REACTION_ON_COMMENT_JOB_NAME, job);
  }

  async reactionOnReply(job: NotifyAuthorAboutReactionOnReplyJob) {
    await this.produce(NOTIFY_AUTHOR_REACTION_ON_REPLY_JOB_NAME, job);
  }

  async commentOnChallenge(job: NotifyAuthorCommentOnChallengeJob) {
    await this.produce(NOTIFY_AUTHOR_COMMENT_ON_CHALLENGE_JOB_NAME, job);
  }
}

export interface NotifyAuthorAboutReactionOnPostJob {
  reactionType: ReactionType;
  postId: string;
  subjectId: string;
  timeStamp: Date;
}

export interface NotifyAuthorAboutCommentOnPostJob {
  postId: string;
  subjectId: string;
  commentId: string;
  timeStamp: Date;
}

export interface NotifyAuthorAboutReplyOnCommentJob {
  commentId: string;
  subjectId: string;
  replyId: string;
  timeStamp: Date;
}

export interface NotifyAuthorAboutFollowedEventJob {
  followedUserId: string;
  subjectId: string; //currentUser
}

export interface UserAddedToFollowingJob {
  addedUserId: string;
  ownerId: string;
}

export interface NotifyAuthorAboutReactionOnCommentJob {
  reactionType: ReactionType;
  commentId: string;
  subjectId: string;
  timeStamp: Date;
}

export interface NotifyAuthorAboutReactionOnReplyJob {
  reactionType: ReactionType;
  commentId: string;
  subjectId: string;
  replyId: string;
  timeStamp: Date;
}

export interface NotifyAuthorCommentOnChallengeJob {
  commentId: string;
}
