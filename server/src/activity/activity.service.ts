/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Inject, Injectable } from '@nestjs/common';
import { ActivityStreamEntity } from '@verdzie/server/activity-stream/activity.stream.entity';
import { ActivityStreamService } from '@verdzie/server/activity-stream/activity.stream.service';
import {
  Activity,
  ActivityObjectType,
  ActivityType,
  ActivityVerb,
} from '@verdzie/server/activity/activity';
import { ActivityItemData } from '@verdzie/server/activity/activity-common';
import {
  CommentEntity,
  CommentEntityWithAuthorAndPost,
} from '@verdzie/server/comment/comment.entity';
import { CommentService } from '@verdzie/server/comment/comment.service';
import {
  FCMDataMessagePayload,
  FCMService,
} from '@verdzie/server/fcm/fcm.service';
import { ReactionType } from '@verdzie/server/generated-graphql';
import { PostEntity } from '@verdzie/server/post/post.entity';
import {
  CanViewCommentsResult,
  PostService,
} from '@verdzie/server/post/post.service';
import { ReplyService } from '@verdzie/server/reply/reply.service';
import { ReplyEntity } from '@verdzie/server/reply/reply.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import { WildrEntity } from '@verdzie/server/user/wildr.entity';
import {
  NotifyAboutMentionedInCommentJob,
  NotifyAboutMentionedInPostJob,
  NotifyAboutMentionedInReplyJob,
} from '@verdzie/server/worker/notify-about-mention/notifyAboutMention.producer';
import { UserAddedToInnerCircleJob } from '@verdzie/server/worker/notify-add-to-inner-circle/notifyAddedToIC.producer';
import {
  NotifyAuthorAboutCommentOnPostJob,
  NotifyAuthorAboutFollowedEventJob,
  NotifyAuthorAboutReactionOnCommentJob,
  NotifyAuthorAboutReactionOnPostJob,
  NotifyAuthorAboutReactionOnReplyJob,
  NotifyAuthorAboutReplyOnCommentJob,
  NotifyAuthorCommentOnChallengeJob,
  UserAddedToFollowingJob,
} from '@verdzie/server/worker/notify-author/notifyAuthor.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CommentVisibilityAccess } from '@verdzie/server/post/postAccessControl';
import { NotifyAboutRepostJob } from '@verdzie/server/worker/notify-about-repost/notifyAboutRepost.producer';
import {
  EphemeralLogger,
  loggerWithMethodContext,
} from '@verdzie/server/common/logger-with-context';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ChallengeService } from '@verdzie/server/challenge/challenge.service';
import { ChallengeCommentService } from '@verdzie/server/challenge/challenge-comment/challenge-comment-service';
import { withSerializationRetries } from '@verdzie/server/common/with-serialization-retries';
import { WildrExceptionDecorator } from '@verdzie/server/common/wildr-exception.decorator';
import { AccessControlService } from '@verdzie/server/access-control/access-control.service';

type EntitiesWithActivityDataName =
  | 'UserEntity'
  | 'PostEntity'
  | 'CommentEntity'
  | 'ReplyEntity'
  | 'ChallengeEntity';

function getEntityWithActivityDataFromName(
  name: EntitiesWithActivityDataName
):
  | typeof UserEntity
  | typeof PostEntity
  | typeof CommentEntity
  | typeof ReplyEntity
  | typeof ChallengeEntity {
  switch (name) {
    case 'UserEntity':
      return UserEntity;
    case 'PostEntity':
      return PostEntity;
    case 'CommentEntity':
      return CommentEntity;
    case 'ReplyEntity':
      return ReplyEntity;
    case 'ChallengeEntity':
      return ChallengeEntity;
  }
}

@Injectable()
export class ActivityService {
  constructor(
    // @ts-ignore
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private activityStreamService: ActivityStreamService,
    private fcmService: FCMService,
    private userService: UserService,
    private postService: PostService,
    private commentService: CommentService,
    private replyService: ReplyService,
    private challengeService: ChallengeService,
    private challengeCommentService: ChallengeCommentService,
    private accessControlService: AccessControlService
  ) {
    this.logger = logger.child({ context: 'ActivityService' });
  }

  async reactOnPost({
    reactionType,
    postId,
    subjectId,
    timeStamp,
  }: NotifyAuthorAboutReactionOnPostJob) {
    const context = {
      methodName: ActivityService.prototype.reactOnPost.name,
      reactionType,
      postId,
      subjectId,
      timeStamp,
    };
    const [post, subject] = await Promise.all([
      this.postService.findWithAuthorRelation(postId),
      this.userService.findById(subjectId),
    ]);
    if (!post) {
      this.logger.error('reactOnPost() Post not found', { ...context, postId });
      return;
    }
    if (!subject) {
      this.logger.error('reactOnPost() Subject not found', {
        ...context,
        subjectId,
      });
      return;
    }
    if (post.authorId === subjectId) {
      this.logger.warn('notification job created for author about author', {
        ...context,
        authorId: post.authorId,
      });
      return;
    }
    switch (reactionType) {
      case ReactionType.REAL:
        return this.realReactionOnPost({
          post,
          subject,
          timeStamp,
        });
      case ReactionType.APPLAUD:
        return this.applaudReactionOnPost({
          post,
          subject,
          timeStamp,
        });
      case ReactionType.LIKE:
        return this.likeReactionOnPost({
          post,
          subject,
          timeStamp,
        });
    }
    return undefined;
  }

  private async likeReactionOnPost({
    post,
    subject,
    timeStamp,
  }: {
    post: PostEntity;
    subject: UserEntity;
    timeStamp: Date;
  }): Promise<void> {
    const logger = loggerWithMethodContext({
      logger: this.logger,
      methodName: ActivityService.prototype.likeReactionOnPost.name,
    });
    logger.info('recording like reaction on post event', {
      postId: post.id,
      subjectId: subject.id,
      authorId: post.authorId,
    });
    const author =
      post.author ?? (await this.userService.findById(post.authorId));
    if (!author) {
      logger.error('Post author is null');
      return;
    }
    author.activityStream = await this.getActivityStream(author);
    if (!author.activityStream) return;
    const { activityItemData, activity } =
      this.updateUserActivityStreamAndItemActivityData({
        activityOwner: author,
        subject,
        activityItemData: post.activityData?.reactionLikeAD,
        timeStamp,
        objectId: post.id,
        objectType: ActivityObjectType.POST,
        verb: ActivityVerb.REACTION_LIKE,
        logger,
        miscId: post.id,
        contentBody: undefined,
        canAggregate: true,
      });
    post.activityData.reactionLikeAD = activityItemData;
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: post,
      entityName: 'PostEntity',
      activityStream: author.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: author,
      subject,
      logger,
    });
  }

  private async realReactionOnPost({
    post,
    subject,
    timeStamp,
  }: {
    post: PostEntity;
    subject: UserEntity;
    timeStamp: Date;
  }): Promise<PostEntity | undefined> {
    const logger = loggerWithMethodContext({
      logger: this.logger,
      methodName: 'realReactionOnPost',
    });
    const author =
      post.author ?? (await this.userService.findById(post.authorId));
    if (!author) {
      logger.error('Post author is null');
      return;
    }
    author.activityStream = await this.getActivityStream(author);
    if (!author.activityStream) return;
    const { activityItemData, activity } =
      this.updateUserActivityStreamAndItemActivityData({
        activityOwner: author,
        subject,
        activityItemData: post.activityData?.reactionRealAD,
        timeStamp,
        objectId: post.id,
        objectType: ActivityObjectType.POST,
        verb: ActivityVerb.REACTION_REAL,
        logger,
        miscId: post.id,
        contentBody: undefined,
        canAggregate: true,
      });
    post.activityData.reactionRealAD = activityItemData;
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: post,
      entityName: 'PostEntity',
      activityStream: author.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: author,
      subject,
      logger,
    });
  }

  private async applaudReactionOnPost({
    post,
    subject,
    timeStamp,
  }: {
    post: PostEntity;
    subject: UserEntity;
    timeStamp: Date;
  }): Promise<void> {
    const logger = loggerWithMethodContext({
      logger: this.logger,
      methodName: 'applaudReactionOnPost',
    });
    const author =
      post.author ?? (await this.userService.findById(post.authorId));
    if (!author) {
      logger.error('Post author is null');
      return;
    }
    author.activityStream = await this.getActivityStream(author);
    if (!author.activityStream) return;
    const { activityItemData, activity } =
      this.updateUserActivityStreamAndItemActivityData({
        activityOwner: author,
        subject,
        activityItemData: post.activityData?.reactionApplauseAD,
        timeStamp,
        objectId: post.id,
        objectType: ActivityObjectType.POST,
        verb: ActivityVerb.REACTION_APPLAUD,
        logger,
        miscId: post.id,
        contentBody: undefined,
        canAggregate: true,
      });
    post.activityData.reactionApplauseAD = activityItemData;
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: post,
      entityName: 'PostEntity',
      activityStream: author.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: author,
      subject,
      logger,
    });
  }

  async commentOnPost({
    postId,
    subjectId,
    commentId,
    timeStamp,
  }: NotifyAuthorAboutCommentOnPostJob): Promise<void> {
    const logger = loggerWithMethodContext({
      logger: this.logger,
      methodName: 'commentOnPost',
    });
    logger.info('recording comment on post event', {
      postId,
      subjectId,
      commentId,
      timeStamp,
    });
    const [post, subject, comment] = await Promise.all([
      this.postService.findWithAuthorRelation(postId),
      this.userService.findById(subjectId),
      this.commentService.findById(commentId),
    ]);
    if (!post) {
      logger.error('Post not found', { postId });
      return;
    }
    if (!subject) {
      logger.error('Subject not found', { subjectId });
      return;
    }
    if (!comment) {
      logger.error('Comment not found', { commentId });
      return;
    }
    const activityOwner = post.author;
    if (!activityOwner) {
      logger.error('Post author is null');
      return;
    }
    if (activityOwner.id === subjectId) {
      logger.info('author is the Subject');
      return;
    }
    activityOwner.activityStream = await this.getActivityStream(activityOwner);
    if (!activityOwner.activityStream) return;
    const { activityItemData, activity } =
      this.updateUserActivityStreamAndItemActivityData({
        activityOwner: activityOwner,
        subject,
        activityItemData: post.activityData?.commentAD,
        timeStamp,
        objectId: postId,
        objectType: ActivityObjectType.POST,
        verb: ActivityVerb.COMMENTED,
        logger,
        miscId: `${postId}##${commentId}`,
        contentBody: comment.body,
        canAggregate: true,
      });
    post.activityData.commentAD = activityItemData;
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: post,
      entityName: 'PostEntity',
      activityStream: activityOwner.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner,
      subject,
      logger,
    });
  }

  @WildrExceptionDecorator()
  async commentOnChallenge({
    commentId,
  }: NotifyAuthorCommentOnChallengeJob): Promise<void> {
    const logger = loggerWithMethodContext({
      logger: this.logger,
      methodName: 'commentOnChallenge',
    });
    logger.info('recording comment on challenge event', { commentId });
    const comment = await this.commentService.findByIdWithAuthor(commentId);
    if (!comment) {
      logger.error('Comment not found', {
        commentId,
      });
      return;
    }
    if (!comment.author) {
      logger.error('Comment author not found', {
        commentId,
      });
      return;
    }
    const { activity, author } = await withSerializationRetries(
      () =>
        this.userService.repo.manager.transaction(async manager => {
          const userRepo = manager.getRepository(UserEntity);
          const challengeRepo = manager.getRepository(ChallengeEntity);
          const challenge = await challengeRepo.findOne(comment.challengeId);
          if (!challenge) {
            logger.error('Challenge not found', {
              commentId: comment.id,
              challengeId: comment.challengeId,
            });
            return { activity: null, author: null };
          }
          if (challenge.authorId === comment.authorId) {
            logger.info(
              'Challenge author is the comment author, not sending notification'
            );
            return { activity: null, author: null };
          }
          const author = await userRepo.findOne(challenge?.authorId, {
            relations: ['activityStream'],
          });
          if (!author) {
            logger.error('Challenge author not found', {
              commentId: comment.id,
              challengeId: comment.challengeId,
              authorId: challenge?.authorId,
            });
            return { activity: null, author: null };
          }
          if (!author.activityStream) {
            logger.error('Challenge author activity stream not found', {
              commentId: comment.id,
              challengeId: comment.challengeId,
              authorId: challenge?.authorId,
            });
            return { activity: null, author: null };
          }
          const { activityItemData, activity } =
            this.updateUserActivityStreamAndItemActivityData({
              activityOwner: author,
              subject: comment.author!,
              activityItemData: challenge.activityData?.commentAD,
              timeStamp: new Date(),
              objectId: challenge.id,
              objectType: ActivityObjectType.CHALLENGE,
              verb: ActivityVerb.COMMENTED,
              commentId: comment.id,
              challengeId: challenge.id,
              logger,
              contentBody: comment.body,
              canAggregate: true,
            });
          if (!challenge.activityData) {
            challenge.activityData = { type: 'ActivityData' };
          }
          challenge.activityData.commentAD = activityItemData;
          await Promise.all([
            manager
              .getRepository(ActivityStreamEntity)
              .update(author.activityStream.id, author.activityStream),
            challengeRepo.update(challenge.id, {
              activityData: challenge.activityData,
            }),
          ]);
          return { activity, author };
        }),
      2,
      this
    )();
    if (!activity || !author) return;
    await this.sendActivityNotification({
      activity,
      activityOwner: author,
      subject: comment.author,
      logger,
    });
  }

  async replyOnComment({
    commentId,
    replyId,
    subjectId,
    timeStamp,
  }: NotifyAuthorAboutReplyOnCommentJob): Promise<void> {
    const logger = loggerWithMethodContext({
      methodName: 'replyOnComment',
      logger: this.logger,
    });
    logger.info('recording reply on comment event', {
      commentId,
      replyId,
      subjectId,
    });
    const [comment, reply, subject] = await Promise.all([
      this.commentService.findByIdWithAuthor(commentId),
      this.replyService.findById(replyId),
      this.userService.findById(subjectId),
    ]);
    if (!comment) {
      logger.error('Comment not found', { commentId });
      return;
    }
    if (!reply) {
      logger.error('Reply not found', { replyId });
      return;
    }
    if (!subject) {
      logger.error('Subject not found', { subjectId });
      return;
    }
    const commentAuthor = comment.author;
    if (!commentAuthor) {
      logger.error('comment author is null');
      return;
    }
    if (commentAuthor.id === subjectId) {
      logger.info('author is the subject');
      return;
    }
    if (!comment.activityData) {
      comment.activityData = { type: 'ActivityData' };
      logger.debug('adding activityData');
    }
    commentAuthor.activityStream = await this.getActivityStream(commentAuthor);
    if (!commentAuthor.activityStream) return;
    const { activityItemData, activity } =
      this.updateUserActivityStreamAndItemActivityData({
        activityOwner: commentAuthor,
        subject,
        activityItemData: comment.activityData?.replyAD,
        timeStamp,
        objectId: commentId,
        objectType: ActivityObjectType.COMMENT,
        verb: ActivityVerb.REPLIED,
        logger,
        postId: comment.postId,
        replyId,
        commentId,
        challengeId: comment.challengeId,
        contentBody: reply.body,
        canAggregate: true,
      });
    comment.activityData.replyAD = activityItemData;
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: comment,
      entityName: 'CommentEntity',
      activityStream: commentAuthor.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: commentAuthor,
      subject,
      logger,
    });
  }

  async reactOnComment(
    job: NotifyAuthorAboutReactionOnCommentJob
  ): Promise<CommentEntity | undefined> {
    if (job.reactionType === ReactionType.LIKE) {
      return this.likeOnComment(job);
    }

    return undefined;
  }

  private async likeOnComment({
    commentId,
    subjectId,
    timeStamp,
  }: NotifyAuthorAboutReactionOnCommentJob): Promise<
    CommentEntity | undefined
  > {
    const logger = loggerWithMethodContext({
      methodName: 'likeOnComment',
      logger: this.logger,
    });
    logger.info('recording like on comment event', { commentId, subjectId });
    const [comment, subject] = await Promise.all([
      this.commentService.findByIdWithAuthor(commentId),
      this.userService.findById(subjectId),
    ]);
    if (!comment) {
      logger.error('Comment not found', { commentId });
      return;
    }
    if (!subject) {
      logger.error('Subject not found', { subjectId });
      return;
    }
    if (comment.authorId === subjectId) {
      logger.info('Subject is the author of the comment, returning...');
      return;
    }
    const commentAuthor = comment.author;
    if (!commentAuthor) {
      logger.error('author not found', { commentId });
      return;
    }
    commentAuthor.activityStream = await this.getActivityStream(commentAuthor);
    if (!commentAuthor.activityStream) {
      logger.error('author activity stream not found', {
        author: comment.authorId,
      });
      return;
    }
    const { activityItemData, activity } =
      this.updateUserActivityStreamAndItemActivityData({
        activityOwner: commentAuthor,
        subject,
        activityItemData: comment.activityData?.reactionLikeAD,
        timeStamp,
        objectId: commentId,
        objectType: ActivityObjectType.COMMENT,
        verb: ActivityVerb.REACTION_LIKE,
        logger,
        postId: comment.postId,
        commentId: comment.id,
        challengeId: comment.challengeId,
        canAggregate: true,
      });
    comment.activityData.reactionLikeAD = activityItemData;
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: comment,
      entityName: 'CommentEntity',
      activityStream: commentAuthor.activityStream,
    });

    await this.sendActivityNotification({
      activity,
      activityOwner: commentAuthor,
      subject,
      logger,
    });
  }

  async followedEvent(
    args: NotifyAuthorAboutFollowedEventJob
  ): Promise<UserEntity | undefined> {
    const logger = loggerWithMethodContext({
      methodName: 'followedEvent',
      logger: this.logger,
    });
    logger.info('recording followed event', {
      followedUserId: args.followedUserId,
      subjectId: args.subjectId,
    });
    const followedUser = await this.userService.findById(args.followedUserId);
    if (!followedUser) {
      logger.warn('[followedEvent] followedUser not found');
      return;
    }
    const currentUser = await this.userService.findById(args.subjectId);
    if (!currentUser) {
      logger.warn('[followedEvent] currentUser not found');
      return;
    }
    followedUser.activityStream = await this.getActivityStream(followedUser);
    if (!followedUser.activityStream) {
      logger.warn('[followedEvent] followedUser.activityStream not found', {
        followedUserId: followedUser.id,
      });
      return;
    }
    const { activityItemData, activity } =
      this.updateUserActivityStreamAndItemActivityData({
        activityOwner: followedUser,
        subject: currentUser,
        activityItemData: followedUser.activityData.followedAD,
        timeStamp: new Date(),
        objectId: followedUser.id,
        objectType: ActivityObjectType.USER,
        verb: ActivityVerb.FOLLOWED,
        logger,
        canAggregate: false,
      });
    followedUser.activityData.followedAD = activityItemData;
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: followedUser,
      entityName: 'UserEntity',
      activityStream: followedUser.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: followedUser,
      subject: currentUser,
      logger,
    });
  }

  async commentEmbargoEvent(
    author: UserEntity
  ): Promise<UserEntity | undefined> {
    author.activityStream = await this.getActivityStream(author);
    if (!author.activityStream) return;
    this.logger.debug(
      `[commentEmbargoEvent] [ActivityStream does not exist]`,
      {}
    );
    return;
  }

  async strikeEvent(
    author: UserEntity,
    strikeCount: number,
    reviewRequestId: string
  ): Promise<void> {
    const logger = loggerWithMethodContext({
      methodName: 'strikeEvent',
      logger: this.logger,
    });
    author.activityStream = await this.getActivityStream(author);
    if (!author.activityStream) return;
    const { activity } = this.updateUserActivityStreamAndItemActivityData({
      activityOwner: author,
      subject: new WildrEntity(),
      timeStamp: new Date(),
      objectId: author.id,
      objectType: ActivityObjectType.USER,
      verb:
        strikeCount == 3
          ? ActivityVerb.REC_FINAL_STRIKE
          : strikeCount == 2
          ? ActivityVerb.REC_SECOND_STRIKE
          : ActivityVerb.REC_FIRST_STRIKE,
      logger,
      miscId: reviewRequestId,
      reportId: reviewRequestId,
      canAggregate: true,
    });
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: author,
      entityName: 'UserEntity',
      activityStream: author.activityStream,
    });
    await this.sendSystemNotification({
      activity,
      activityOwner: author,
      logger,
    });
  }

  async ringImprovedEvent(
    author: UserEntity,
    ringColor: string,
    score: string
  ): Promise<void> {
    this.logger.info('[ringImprovementEvent] ignoring ring improvement event');
    return;
    const logger = loggerWithMethodContext({
      methodName: 'ringImprovedEvent',
      logger: this.logger,
    });
    author.activityStream = await this.getActivityStream(author);
    if (!author.activityStream) return;
    const { activity } = this.updateUserActivityStreamAndItemActivityData({
      activityOwner: author,
      subject: new WildrEntity(),
      timeStamp: new Date(),
      objectId: author.id,
      objectType: ActivityObjectType.USER,
      verb: ActivityVerb.IMPROVED_PROFILE_RING,
      logger,
      miscId: undefined,
      contentBody: ringColor,
      otherData: score,
      canAggregate: true,
    });
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: author,
      entityName: 'UserEntity',
      // @ts-ignore
      activityStream: author.activityStream,
    });
    await this.sendSystemNotification({
      activity,
      activityOwner: author,
      logger,
    });
  }

  async followeePosted(followerId: string, postId: string): Promise<void> {
    const logger = loggerWithMethodContext({
      methodName: 'followeePosted',
      logger: this.logger,
    });
    logger.info('recording followee post', { followerId, postId });
    const post = await this.postService.findWithAuthorRelation(postId);
    if (!post) {
      logger.error('Post not found', { id: postId });
      return;
    }
    const postAuthor =
      post.author ?? (await this.userService.findById(post.authorId));
    if (!postAuthor) {
      logger.error('Post author not found', { id: post.authorId });
      return;
    }
    if (followerId === post.authorId) {
      logger.info('Follower ID = PostAuthorId');
      return;
    }
    const follower = await this.userService.findById(followerId, {
      relations: [UserEntity.kActivityStreamRelation],
    });
    if (!follower) {
      logger.error('Follower not found', { id: followerId });
      return;
    }
    follower.activityStream = await this.getActivityStream(follower);
    if (!follower.activityStream) {
      return;
    }
    const { activity } = this.updateUserActivityStreamAndItemActivityData({
      activityOwner: follower,
      subject: postAuthor,
      timeStamp: new Date(),
      objectId: post.id,
      objectType: ActivityObjectType.POST,
      verb: ActivityVerb.POSTED,
      logger,
      canAggregate: false,
    });
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: follower,
      entityName: 'UserEntity',
      activityStream: follower.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: follower,
      subject: postAuthor,
      logger,
    });
  }

  @WildrExceptionDecorator()
  async followeeCreatedChallenge({
    challengeId,
    followerId,
  }: {
    challengeId: string;
    followerId: string;
  }) {
    const logger = loggerWithMethodContext({
      methodName: 'followeeCreatedChallenge',
      logger: this.logger,
    });
    logger.info('recording followee challenge creation', {
      challengeId,
      followerId,
    });
    const challenge = await this.challengeService.findById({
      id: challengeId,
      findOptions: { relations: [ChallengeEntity.kAuthorRelation] },
    });
    if (!challenge) {
      logger.error('Challenge not found', { id: challengeId });
      return;
    }
    if (!challenge.author) {
      logger.error('Challenge author not found', { id: challenge.authorId });
      return;
    }
    let follower: UserEntity | undefined;
    const { activity } = await withSerializationRetries(
      () =>
        this.userService.repo.manager.transaction(async manager => {
          const userRepo = manager.getRepository(UserEntity);
          follower = await userRepo.findOne(followerId, {
            relations: [UserEntity.kActivityStreamRelation],
          });
          if (!follower) {
            logger.error('Follower not found', { id: followerId });
            return { activity: undefined };
          }
          if (!follower.activityStream) {
            logger.error('Follower activity stream not found', {
              id: followerId,
            });
            return { activity: undefined };
          }
          const { activity } = this.updateUserActivityStreamAndItemActivityData(
            {
              activityOwner: follower,
              subject: challenge.author!,
              timeStamp: new Date(),
              objectId: challenge.id,
              challengeId: challenge.id,
              objectType: ActivityObjectType.CHALLENGE,
              verb: ActivityVerb.CHALLENGE_CREATED,
              logger,
              canAggregate: false,
            }
          );
          await Promise.all([
            manager
              .getRepository(ActivityStreamEntity)
              .update(follower.activityStream.id, follower.activityStream),
          ]);
          return { activity };
        }),
      2,
      { logger }
    )();
    if (!activity) return;
    await this.sendActivityNotification({
      activity,
      activityOwner: follower!,
      subject: challenge.author,
      logger,
    });
  }

  async repost(args: NotifyAboutRepostJob) {
    const logger = loggerWithMethodContext({
      methodName: 'repost',
      logger: this.logger,
    });
    logger.info('recording repost activity', {
      repostId: args.repostId,
      parentPostId: args.parentPostId,
    });
    const repost = await this.postService.findWithAuthorRelation(args.repostId);
    if (!repost) {
      logger.error('Repost not found', { id: args.repostId });
      return;
    }
    if (!repost.author) {
      logger.error('Repost Author not found', { id: repost.authorId });
      return;
    }
    const parentPost = await this.postService.findWithAuthorRelation(
      args.parentPostId
    );
    if (!parentPost) {
      logger.error('ParentPost not found', { id: args.parentPostId });
      return;
    }
    const parentPostAuthor = parentPost.author;
    if (!parentPostAuthor) {
      logger.error('ParentPost Author not found', {
        id: args.parentPostId,
      });
      return;
    }
    parentPostAuthor.activityStream = await this.getActivityStream(
      parentPostAuthor
    );
    if (!parentPostAuthor.activityStream) {
      logger.info('No activity stream found for parentPostAuthor');
      return;
    }
    const { activityItemData, activity } =
      this.updateUserActivityStreamAndItemActivityData({
        timeStamp: new Date(),
        activityOwner: parentPostAuthor,
        subject: repost.author,
        objectId: parentPost.id,
        objectType: ActivityObjectType.POST,
        verb: ActivityVerb.REPOSTED,
        postId: repost.id,
        logger,
        canAggregate: true,
      });
    parentPost.activityData.repostAD = activityItemData;
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: parentPost,
      entityName: 'PostEntity',
      activityStream: parentPostAuthor.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: parentPostAuthor,
      subject: repost.author,
      logger,
    });
  }

  async mentionedInPost(args: NotifyAboutMentionedInPostJob) {
    const logger = loggerWithMethodContext({
      methodName: 'mentionedInPost',
      logger: this.logger,
    });
    logger.info('recording repost activity', {
      postId: args.postId,
      objectId: args.objectId,
    });
    const post = await this.postService.findWithAuthorRelation(args.postId);
    if (!post) {
      logger.error('Post not found', { id: args.postId });
      return;
    }
    const mentionedUserId = args.objectId;
    const mentionedUser = await this.userService.findById(mentionedUserId);
    if (!mentionedUser) {
      logger.error('Mentioned user not found', { id: mentionedUserId });
      return;
    }
    //Check whether mentionedUser has blocked author of the post
    const hasBlocked = await this.userService.hasBlockedFromEitherSide({
      userA: mentionedUser,
      userBId: post.authorId,
      userB: post.author,
    });
    if (hasBlocked) {
      logger.info('Not mentioning the user since because hasBlocked = true', {
        userA: mentionedUserId,
        userB: post.authorId,
      });
      return;
    }
    const cannotViewPostErrorMessage =
      await this.postService.cannotViewPostErrorMessage(
        mentionedUserId,
        post,
        false
      );
    if (cannotViewPostErrorMessage) {
      logger.info('not notifying user about post', { mentionedUserId });
      return;
    }
    if (!post.author) {
      logger.error('Author not found', { id: post.authorId });
      return;
    }
    const userWhoMentioned = post.author;
    if (userWhoMentioned.id === args.objectId) {
      logger.info('Author is the Subject');
      return;
    }
    mentionedUser.activityStream = await this.getActivityStream(mentionedUser);
    if (!mentionedUser.activityStream) {
      logger.info('No activity stream found for mentioned user');
      return;
    }
    // `userWhoMentioned` mentioned `mentionedUser` in `object`
    const { activity } = this.updateUserActivityStreamAndItemActivityData({
      activityOwner: mentionedUser,
      subject: userWhoMentioned,
      timeStamp: new Date(),
      objectId: mentionedUser.id,
      objectType: ActivityObjectType.USER,
      verb: ActivityVerb.MENTIONED_IN_POST,
      logger,
      canAggregate: false,
      postId: post.id,
      postPageIndex: args.pageIndex,
    });
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: mentionedUser,
      entityName: 'UserEntity',
      activityStream: mentionedUser.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: mentionedUser,
      subject: userWhoMentioned,
      logger,
    });
  }

  //Comment's author mentioned `object` in their comment
  async mentionedInComment(args: NotifyAboutMentionedInCommentJob) {
    const logger = loggerWithMethodContext({
      methodName: 'mentionedInComment',
      logger: this.logger,
    });
    logger.info('recording mentioned in comment activity', {
      commentId: args.commentId,
      objectId: args.objectId,
    });
    const comment = (await this.commentService.findWithRelations(
      args.commentId,
      {
        relations: [
          CommentEntity.kAuthorRelation,
          CommentEntity.kPostRelation,
          CommentEntity.kChallengeRelation,
        ],
      }
    )) as CommentEntityWithAuthorAndPost;
    if (!comment) {
      logger.error('Comment not found', { id: args.commentId });
      return;
    }
    if (!comment.author) {
      logger.error('Comment author not found', { id: comment.authorId });
      return;
    }
    let parent: PostEntity | ChallengeEntity | undefined;
    if (comment.postId) {
      parent = comment.post;
    } else if (comment.challengeId) {
      parent = comment.challenge;
    }
    if (!parent) {
      logger.error('Parent not found for comment', { id: comment.id });
      return;
    }
    const userWhoMentioned = comment.author;
    if (userWhoMentioned.id === args.objectId) {
      logger.info('Author is the Subject');
      return;
    }
    const mentionedUserId = args.objectId;
    const mentionedUser = await this.userService.findById(mentionedUserId);
    if (!mentionedUser) {
      logger.error('Mentioned user not found', { id: mentionedUserId });
      return;
    }
    const hasBlocked = await this.userService.hasBlockedFromEitherSide({
      userA: mentionedUser,
      userB: parent.author,
      userBId: parent.authorId,
    });
    if (hasBlocked) {
      logger.info('Not mentioning the user since because hasBlocked = true', {
        userA: mentionedUserId,
        userB: parent.authorId,
      });
      return;
    }
    //if Parent Author mentioned a user, notify only if the user can view the comments
    if (parent.authorId === comment.authorId) {
      switch (parent.accessControl?.commentVisibilityAccessData.access) {
        case CommentVisibilityAccess.AUTHOR:
          try {
            await this.accessControlService.checkMessagePostingAccess({
              parent,
              currentUser: mentionedUser,
              messageType: 'comment',
              parentType: parent instanceof PostEntity ? 'post' : 'challenge',
            });
          } catch (e) {
            logger.info(
              'Not notifying, the user does not have comment access;' +
                ' Probably not part of the intended audience'
            );
            return;
          }
          break;
        default:
          try {
            await this.accessControlService.checkMessageVisibilityAccess({
              object: parent,
              currentUser: mentionedUser,
              parentType: parent instanceof PostEntity ? 'post' : 'challenge',
              messageType: 'comment',
            });
          } catch (e) {
            logger.info(
              'Not notifying, the user does not have comment view access'
            );
            return;
          }
          break;
      }
    } else if (mentionedUserId === parent.authorId) {
      logger.info('Author of the comment is also author of the post');
    } else if (mentionedUserId !== parent.authorId) {
      try {
        await this.accessControlService.checkMessageVisibilityAccess({
          object: parent,
          currentUser: mentionedUser,
          parentType: parent instanceof PostEntity ? 'post' : 'challenge',
          messageType: 'comment',
        });
      } catch (e) {
        logger.info(
          'Not notifying user about the comment, since' +
            ' they cannot view the comments',
          { mentionedUserId }
        );
        return;
      }
    }
    if (!mentionedUser) {
      logger.error('mentioned user not found', { mentionedUserId });
      return;
    }
    mentionedUser.activityStream = await this.getActivityStream(mentionedUser);
    if (!mentionedUser.activityStream) {
      logger.info('No activity stream found for mentioned user');
      return;
    }
    // `userWhoMentioned` mentioned `mentionedUser` in `object`
    const { activity } = this.updateUserActivityStreamAndItemActivityData({
      activityOwner: mentionedUser,
      subject: userWhoMentioned,
      timeStamp: new Date(),
      objectId: mentionedUser.id,
      objectType: ActivityObjectType.USER,
      verb: ActivityVerb.MENTIONED_IN_COMMENT,
      logger,
      canAggregate: false,
      commentId: comment.id,
      postId: comment.postId,
      challengeId: comment.challengeId,
    });
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: mentionedUser,
      entityName: 'UserEntity',
      activityStream: mentionedUser.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: mentionedUser,
      subject: userWhoMentioned,
      logger,
    });
  }

  //Comment's author mentioned `object` in their comment
  async mentionedInReply(args: NotifyAboutMentionedInReplyJob) {
    const logger = loggerWithMethodContext({
      methodName: 'mentionedInReply',
      logger: this.logger,
    });
    logger.info('executing mentionedInReply');
    const reply = await this.replyService.findByIdWithAuthorAndParentComment(
      args.replyId
    );
    if (!reply) {
      logger.error('reply not found', { id: args.replyId });
      return;
    }
    if (!reply.author) {
      logger.error('Author not found', { id: reply.authorId });
      return;
    }
    const comment = reply.comment;
    if (!comment) {
      logger.error('comment not found for reply', { id: args.replyId });
      return;
    }
    const userWhoMentioned = reply.author;
    if (userWhoMentioned.id === args.objectId) {
      logger.info('Author is the Subject');
      return;
    }
    let parent: PostEntity | ChallengeEntity | undefined;
    if (comment.postId) {
      parent = await this.postService.findById(comment.postId);
    } else if (comment.challengeId) {
      parent = await this.challengeService.findById({
        id: comment.challengeId,
      });
    }
    if (!parent) {
      logger.error("Comment's parent not found");
      return;
    }
    const mentionedUserId = args.objectId;
    const mentionedUser = await this.userService.findById(mentionedUserId);
    if (!mentionedUser) {
      logger.error('Mentioned user not found', { id: mentionedUserId });
      return;
    }
    const hasBlocked = await this.userService.hasBlockedFromEitherSide({
      userA: mentionedUser,
      userBId: parent.authorId,
      userB: parent.author,
    });
    if (hasBlocked) {
      logger.info('Not mentioning the user since because hasBlocked = true', {
        userA: mentionedUserId,
        userB: parent.authorId,
      });
      return;
    }
    //If mentionedUser is Author of the post, continue
    //If mentioned user is Author of the comment, continue
    //If mentioned user is someone else,
    //  - Check whether that user has commentView access
    if (
      mentionedUserId !== parent.authorId &&
      mentionedUserId !== comment.authorId
    ) {
      let canViewComment: CanViewCommentsResult | undefined;
      if (parent instanceof PostEntity) {
        canViewComment = await this.postService.canViewCommentsStatusAndMessage(
          mentionedUserId,
          parent,
          false
        );
      } else {
        canViewComment =
          await this.challengeCommentService.canViewCommentsStatusAndMessage(
            mentionedUserId,
            parent,
            false
          );
      }
      if (!canViewComment || !canViewComment.canViewComments) {
        logger.info('mentionedInReply; The person does not have view access');
        return;
      }
    }
    if (!mentionedUser) {
      logger.error('Object not found', { id: args.objectId });
      return;
    }
    mentionedUser.activityStream = await this.getActivityStream(mentionedUser);
    if (!mentionedUser.activityStream) {
      logger.info('No activity stream found for mentioned user');
      return;
    }
    const props: PerformActionArgs = {
      activityOwner: mentionedUser,
      subject: userWhoMentioned,
      timeStamp: new Date(),
      objectId: mentionedUser.id,
      objectType: ActivityObjectType.USER,
      verb: ActivityVerb.MENTIONED_IN_REPLY,
      logger,
      canAggregate: false,
      replyId: reply.id,
      commentId: comment.id,
      postId: comment.postId,
      challengeId: comment.challengeId,
    };
    const { activity } =
      this.updateUserActivityStreamAndItemActivityData(props);
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: mentionedUser,
      entityName: 'UserEntity',
      activityStream: mentionedUser.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: mentionedUser,
      subject: userWhoMentioned,
      logger,
    });
  }

  async addedToInnerCircle(args: UserAddedToInnerCircleJob) {
    const logger = loggerWithMethodContext({
      methodName: 'addedToInnerCircle',
      logger: this.logger,
    });
    logger.info('recording added to inner circle activity', {
      addedUserId: args.addedUserId,
      ownerId: args.ownerId,
      shouldSendNotificationToAddedUser: args.shouldSendNotificationToAddedUser,
    });
    const userWhoAdded = await this.userService.findById(args.ownerId);
    if (!userWhoAdded) {
      logger.error('owner not found', { id: args.ownerId });
      return;
    }
    const addedUser = await this.userService.findById(args.addedUserId);
    if (!addedUser) {
      logger.error('added user not found', { id: args.addedUserId });
      return;
    }
    addedUser.activityStream = await this.getActivityStream(addedUser);
    if (!addedUser.activityStream) {
      logger.info('No activity stream found for addedUser user', {
        addedUser: addedUser.id,
      });
      return;
    }
    const { activity } = this.updateUserActivityStreamAndItemActivityData({
      activityOwner: addedUser,
      subject: userWhoAdded,
      timeStamp: new Date(),
      objectId: addedUser.id,
      activityItemData: addedUser.activityData.addedToInnerCircleAD,
      objectType: ActivityObjectType.USER,
      verb: ActivityVerb.ADDED_TO_IC,
      logger,
      canAggregate: true,
    });
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: addedUser,
      entityName: 'UserEntity',
      activityStream: addedUser.activityStream,
    });
    if (args.shouldSendNotificationToAddedUser) {
      await this.sendActivityNotification({
        activity,
        activityOwner: addedUser,
        subject: userWhoAdded,
        logger,
      });
    }
  }

  async automaticallyAddedToInnerCircle(args: UserAddedToInnerCircleJob) {
    const logger = loggerWithMethodContext({
      methodName: 'automaticallyAddedToInnerCircle',
      logger: this.logger,
    });
    logger.info('executing automaticallyAddedToInnerCircle');
    const userWhoAdded = await this.userService.findById(args.ownerId);
    if (!userWhoAdded) {
      logger.error('owner not found', { id: args.ownerId });
      return;
    }
    const addedUser = await this.userService.findById(args.addedUserId);
    if (!addedUser) {
      logger.error('added user not found', { id: args.addedUserId });
      return;
    }
    userWhoAdded.activityStream = await this.getActivityStream(userWhoAdded);
    if (!userWhoAdded.activityStream) {
      logger.info('No activity stream found for addedUser user', {
        userWhoAdded: userWhoAdded.id,
      });
      return;
    }
    const { activity } = this.updateUserActivityStreamAndItemActivityData({
      activityOwner: userWhoAdded,
      subject: addedUser,
      timeStamp: new Date(),
      objectId: userWhoAdded.id,
      activityItemData: userWhoAdded.activityData.addedToInnerCircleAD,
      objectType: ActivityObjectType.USER,
      verb: ActivityVerb.AUTO_ADDED_TO_IC,
      logger,
      canAggregate: true,
    });
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: userWhoAdded,
      entityName: 'UserEntity',
      activityStream: userWhoAdded.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: userWhoAdded,
      subject: addedUser,
      logger,
    });
  }

  async automaticallyAddedToFollowing(args: UserAddedToFollowingJob) {
    const logger = loggerWithMethodContext({
      methodName: 'automaticallyAddedToFollowing',
      logger: this.logger,
    });
    logger.info('executing automaticallyAddedToFollowing');
    const userWhoAdded = await this.userService.findById(args.ownerId);
    if (!userWhoAdded) {
      logger.error('owner not found', { id: args.ownerId });
      return;
    }
    const addedUser = await this.userService.findById(args.addedUserId);
    if (!addedUser) {
      logger.error('added user not found', { id: args.addedUserId });
      return;
    }
    userWhoAdded.activityStream = await this.getActivityStream(userWhoAdded);
    if (!userWhoAdded.activityStream) {
      logger.info('No activity stream found for addedUser user', {
        userWhoAdded: userWhoAdded.id,
      });
      return;
    }
    const { activity } = this.updateUserActivityStreamAndItemActivityData({
      activityOwner: userWhoAdded,
      subject: addedUser,
      timeStamp: new Date(),
      objectId: userWhoAdded.id,
      activityItemData: userWhoAdded.activityData.addedToFollowingAD,
      objectType: ActivityObjectType.USER,
      verb: ActivityVerb.AUTO_ADDED_TO_FOLLOWING,
      logger,
      canAggregate: true,
    });
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: userWhoAdded,
      entityName: 'UserEntity',
      activityStream: userWhoAdded.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: userWhoAdded,
      subject: addedUser,
      logger,
    });
  }

  async reactOnReply(job: NotifyAuthorAboutReactionOnReplyJob): Promise<void> {
    if (job.reactionType === ReactionType.LIKE) {
      return this.likeOnReply(job);
    }

    return undefined;
  }

  private async likeOnReply({
    commentId,
    replyId,
    subjectId,
    timeStamp,
  }: NotifyAuthorAboutReactionOnReplyJob): Promise<void> {
    const logger = loggerWithMethodContext({
      methodName: 'likeOnReply',
      logger: this.logger,
    });
    const [comment, reply, subject] = await Promise.all([
      this.commentService.findById(commentId),
      this.replyService.findByIdWithAuthor(replyId),
      this.userService.findById(subjectId),
    ]);
    if (!comment) {
      logger.error('Comment not found', { commentId });
      return;
    }
    if (!reply) {
      logger.error('Reply not found', { replyId });
      return;
    }
    if (!subject) {
      logger.error('Subject not found', { subjectId });
      return;
    }
    if (reply.authorId === subjectId) {
      logger.info('Subject is the reply author, returning...');
      return;
    }
    const replyAuthor = reply.author;
    if (!replyAuthor) {
      logger.error('author not found', { replyId });
      return undefined;
    }
    replyAuthor.activityStream = await this.getActivityStream(replyAuthor);
    if (!replyAuthor.activityStream) {
      logger.error('author activity stream not found', {
        replyAuthorId: reply.authorId,
      });
      return undefined;
    }
    if (!reply.activityData) {
      reply.activityData = {
        type: 'ActivityData',
      };
    }
    if (!reply.activityData.reactionLikeAD) {
      reply.activityData.reactionLikeAD = {
        type: 'ActivityItemData',
        ids: [],
        isAggregated: false,
      };
    }
    const { activity, activityItemData } =
      this.updateUserActivityStreamAndItemActivityData({
        activityOwner: replyAuthor,
        subject,
        activityItemData: reply.activityData.reactionLikeAD,
        timeStamp,
        objectId: replyId,
        objectType: ActivityObjectType.REPLY,
        verb: ActivityVerb.REACTION_LIKE,
        logger,
        postId: comment.postId,
        commentId,
        replyId,
        challengeId: comment.challengeId,
        canAggregate: true,
      });
    reply.activityData.reactionLikeAD = activityItemData;
    await this.updateEntityActivityDataAndActivityStreamInTx({
      entity: reply,
      entityName: 'ReplyEntity',
      activityStream: replyAuthor.activityStream,
    });
    await this.sendActivityNotification({
      activity,
      activityOwner: replyAuthor,
      subject,
      logger,
    });
  }

  async participantJoinedChallenge({
    challengeId,
    participantId,
  }: {
    challengeId: string;
    participantId: string;
  }) {
    const logger = loggerWithMethodContext({
      methodName: 'participantJoinedChallenge',
      logger: this.logger,
    });
    const participant = await this.userService.findById(participantId);
    if (!participant) {
      logger.error('participant not found', { participantId });
      return;
    }
    const { activity, author } = await withSerializationRetries(
      () =>
        this.userService.repo.manager.transaction(async manager => {
          const challengeRepo = manager.getRepository(ChallengeEntity);
          const userRepo = manager.getRepository(UserEntity);
          const challenge = await challengeRepo.findOne(challengeId);
          if (!challenge) {
            logger.error('challenge not found', { challengeId });
            return { activity: null };
          }
          const author = await userRepo.findOne(challenge.authorId, {
            relations: ['activityStream'],
          });
          if (!author) {
            logger.error('challenge author not found', {
              challengeId,
              authorId: challenge.authorId,
            });
            return { activity: null, author };
          }
          if (!author.activityStream) {
            logger.error('author activity stream not found', {
              challengeId,
              authorId: challenge.authorId,
            });
            return { activity: null, author };
          }
          const { activity, activityItemData } =
            this.updateUserActivityStreamAndItemActivityData({
              activityOwner: author,
              subject: participant,
              activityItemData: challenge.activityData?.joinedAD,
              timeStamp: new Date(),
              objectId: challengeId,
              challengeId: challengeId,
              objectType: ActivityObjectType.CHALLENGE,
              verb: ActivityVerb.JOINED_CHALLENGE,
              logger,
              canAggregate: true,
            });
          if (!challenge.activityData) {
            challenge.activityData = {
              type: 'ActivityData',
            };
          }
          challenge.activityData.joinedAD = activityItemData;
          await Promise.all([
            manager
              .getRepository(ActivityStreamEntity)
              .update(author.activityStream.id, author.activityStream),
            challengeRepo.update(challengeId, {
              activityData: challenge.activityData,
            }),
          ]);
          return { activity, author };
        }),
      2,
      this
    )();
    if (!activity) return;
    if (!author) return;
    await this.sendActivityNotification({
      activity,
      activityOwner: author,
      subject: participant,
      logger,
    });
  }

  //------------------------Helpers------------------------------------------
  private getPerformActionArgsWithDefaults(
    args: PerformActionArgs
  ): PerformActionArgsWithDefaults {
    if (!args.activityItemData)
      args.activityItemData = {
        type: 'ActivityItemData',
        ids: [],
        isAggregated: false,
      };
    return args as PerformActionArgsWithDefaults;
  }

  private updateUserActivityStreamAndItemActivityData(
    args: PerformActionArgs
  ): {
    activityItemData?: ActivityItemData;
    activity: Activity;
  } {
    if (args.subject instanceof WildrEntity) {
      const result = this.systemNotificationData(
        this.getPerformActionArgsWithDefaults(args)
      );
      this.upsertNewActivityToItemDataAndUserStream(
        this.getPerformActionArgsWithDefaults(args)
      );
      return {
        activityItemData: result.activityItemData,
        activity: result.activity,
      };
    }
    const { activity, activityItemData } =
      this.upsertActivityToItemDataAndUserStream(
        this.getPerformActionArgsWithDefaults(args)
      );
    return {
      activityItemData,
      activity,
    };
  }

  private async sendActivityNotification({
    activity,
    subject,
    activityOwner,
    logger,
  }: NotificationData & {
    logger: EphemeralLogger;
  }) {
    const secondSubject = activity.subjectIds[1]
      ? await this.userService.findById(activity.subjectIds[1])
      : undefined;
    const [fcmDataPayload, displayStrForNotification] =
      this.getDataPayloadAndDisplayStr({
        activity,
        subject,
        secondSubject,
      });
    if (activityOwner.fcmToken) {
      logger.info('sending activity notification', {
        ownerId: activityOwner.id,
        fcmDataPayload,
        displayStrForNotification,
      });
      return this.fcmService.sendNotification(
        activityOwner.fcmToken,
        displayStrForNotification,
        {
          ...fcmDataPayload,
          body: displayStrForNotification!,
        }
      );
    } else {
      logger.info('missing fcm token', {
        ownerId: activityOwner.id,
        subjectId: subject.id,
      });
    }
  }

  private async sendSystemNotification({
    activity,
    activityOwner,
    logger,
  }: {
    activity: Activity;
    activityOwner: UserEntity;
    logger: EphemeralLogger;
  }) {
    const context = {
      methodName: ActivityService.prototype.sendSystemNotification.name,
      userId: activityOwner.id,
    };
    const { fcmData, displayStr } = this.getSystemNotificationData({
      activity,
      activityVerb: activity.verb,
    });
    if (!activityOwner.fcmToken) {
      logger.warn(`no fcm token found`, context);
      return;
    }
    logger.info(`sending system notification`, {
      ...context,
      fcmData,
      displayStr,
    });
    return this.fcmService.sendNotification(
      activityOwner.fcmToken,
      displayStr,
      {
        ...fcmData,
        body: displayStr,
      }
    );
  }

  private async getActivityStream(
    mentionedUser: UserEntity
  ): Promise<ActivityStreamEntity | undefined> {
    const activityStream: ActivityStreamEntity | undefined =
      mentionedUser.activityStream ??
      (await this.activityStreamService.findById(
        mentionedUser.activityStreamId ?? ''
      ));
    if (!activityStream) {
      this.logger.debug(`ActivityStream does not exist`);
      return;
    }
    return activityStream;
  }

  private static getVerbStr(verb: ActivityVerb): string {
    switch (verb) {
      case ActivityVerb.REACTION_LIKE:
        return 'liked';
      case ActivityVerb.REACTION_APPLAUD:
        return 'applauded';
      case ActivityVerb.REACTION_REAL:
        return 'found';
      case ActivityVerb.COMMENTED:
        return 'commented on';
      case ActivityVerb.REPLIED:
        return 'replied to';
      case ActivityVerb.FOLLOWED:
        return 'followed';
      case ActivityVerb.POSTED:
        return 'just posted';
      case ActivityVerb.REPOSTED:
        return 'reposted';
      case ActivityVerb.MENTIONED_IN_POST:
      case ActivityVerb.MENTIONED_IN_COMMENT:
      case ActivityVerb.MENTIONED_IN_REPLY:
        return 'mentioned';
      case ActivityVerb.ADDED_TO_IC:
        return 'added';
      case ActivityVerb.AUTO_ADDED_TO_IC:
        return 'has been added';
      case ActivityVerb.AUTO_ADDED_TO_FOLLOWING:
        return 'is now part of';
      case ActivityVerb.JOINED_CHALLENGE:
        return 'joined';
      case ActivityVerb.CHALLENGE_CREATED:
        return 'just created a';
      default:
        return 'default';
    }
  }

  getTrailingObjStr(activity: Activity) {
    let str = '';

    switch (activity.getVerb()) {
      case ActivityVerb.MENTIONED_IN_POST:
        str += 'in a post';
        break;
      case ActivityVerb.MENTIONED_IN_COMMENT:
        str += 'in a comment';
        break;
      case ActivityVerb.MENTIONED_IN_REPLY:
        str += 'in a reply';
        break;
      case ActivityVerb.ADDED_TO_IC:
        str += 'to their Inner Circle';
        break;
      case ActivityVerb.AUTO_ADDED_TO_IC:
        str += 'to your Inner Circle';
        break;
      case ActivityVerb.AUTO_ADDED_TO_FOLLOWING:
        str += 'your following list';
        break;
      case ActivityVerb.CHALLENGE_CREATED:
        str += 'challenge 🎯 \n Tap to check it out!';
    }
    return str;
  }

  /**
     Single Activity:
     `verbStr + objectStr`

     Aggregated Activity:
     `, and + count + others + verbStr + objectStr`
     */
  combineVerbAndObjStr(
    activityType: ActivityType,
    activity: Activity,
    verbStr: string,
    objectStr: string,
    trailing: string,
    isForNotification = true
  ): string {
    let displayStr = '';
    if (isForNotification) {
      if (activityType === ActivityType.SINGLE) {
        displayStr += ' ';
      } else if (activityType === ActivityType.AGGREGATED) {
        displayStr += ', and ';
        displayStr += `${(activity.totalCount ?? 0) - 2}`;
        displayStr += ' others ';
      }
    }
    displayStr += verbStr;
    displayStr += ' ';
    displayStr += objectStr;
    if (objectStr.length !== 0) displayStr += ' ';
    displayStr += trailing;
    return displayStr;
  }

  private getObjectStrAndFcmDataPayload(args: {
    activity: Activity;
    ids: string[];
  }): [string, FCMDataMessagePayload] {
    const activity = args.activity;
    const verb = activity.verb;
    const ids = args.ids;
    const activityType: ActivityType = activity.getType();
    let fcmMessageDataPayload: FCMDataMessagePayload = {
      verb: `${activity.getGqlVerb()}`,
    };
    let objectStr = 'default';
    switch (activity.getObjectType()) {
      case ActivityObjectType.POST:
        objectStr = 'your post';
        if (verb == ActivityVerb.COMMENTED) {
          fcmMessageDataPayload = {
            verb: `${activity.getGqlVerb()}`, //COMMENTED
            postId: activity.postId ?? ids![0],
            commentId: activity.commentId ?? ids![1],
          };
        } else if (verb === ActivityVerb.POSTED) {
          objectStr = 'on Wildr.\nTap to find out!';
          fcmMessageDataPayload = {
            verb: `${activity.getGqlVerb()}`, //Posted
            objectType: `${activity.getObjectType()}`,
            postId: `${activity.objectId}`,
            postAuthorId: `${activity.subjectIds[0]}`,
          };
        } else if (verb === ActivityVerb.REPOSTED) {
          objectStr = 'your post.';
          fcmMessageDataPayload = {
            verb: `${activity.getGqlVerb()}`, //REPOSTED
            objectType: `${activity.getObjectType()}`,
            objectId: activity.objectId,
            repostId: activity.postId,
            postAuthorId: `${activity.subjectIds[0]}`,
          };
        } else {
          fcmMessageDataPayload = {
            verb: `${activity.getGqlVerb()}`, //REACTION
            postId: activity.postId ?? ids![0],
          };
        }
        break;
      case ActivityObjectType.COMMENT:
        if (verb === ActivityVerb.REPLIED) {
          objectStr = 'your comment';
          fcmMessageDataPayload = {
            verb: `${activity.getGqlVerb()}`,
            postId: activity.postId,
            commentId: activity.commentId,
            replyId: activity.replyId,
            challengeId: activity.challengeId,
          };
        } else if (verb === ActivityVerb.REACTION_LIKE) {
          objectStr = 'your comment';
          fcmMessageDataPayload = {
            verb: `${activity.getGqlVerb()}`,
            postId: activity.postId ?? ids![0],
            commentId: activity.commentId ?? ids![1],
            challengeId: activity.challengeId,
          };
        }
        break;
      case ActivityObjectType.REPLY:
        objectStr = 'your reply';
        if (verb === ActivityVerb.REACTION_LIKE) {
          objectStr = 'your reply';
          fcmMessageDataPayload = {
            verb: `${activity.getGqlVerb()}`,
            postId: activity.postId,
            commentId: activity.commentId,
            replyId: activity.replyId,
            challengeId: activity.challengeId,
          };
        }
        break;
      case ActivityObjectType.USER:
        objectStr = 'you';
        switch (verb) {
          case ActivityVerb.FOLLOWED:
            if (activityType == ActivityType.SINGLE) {
              fcmMessageDataPayload = {
                verb: `${activity.getGqlVerb()}`, //Followed
                objectType: `${activity.getObjectType()}`,
                objectId: `${activity.objectId}`,
                followerId: `${activity.subjectIds[0]}`,
              };
            }
            break;
          case ActivityVerb.AUTO_ADDED_TO_FOLLOWING:
            if (activityType == ActivityType.SINGLE) {
              objectStr = '';
              fcmMessageDataPayload = {
                verb: `${activity.getGqlVerb()}`, //Followed
                objectType: `${activity.getObjectType()}`,
                objectId: `${activity.objectId}`,
                followerId: `${activity.subjectIds[0]}`,
              };
            }
            break;
          case ActivityVerb.MENTIONED_IN_POST:
            if (activityType == ActivityType.SINGLE) {
              fcmMessageDataPayload = {
                verb: `${activity.getGqlVerb()}`, //Mentioned
                objectType: `${activity.getObjectType()}`,
                objectId: activity.objectId,
                subjectId: activity.subjectIds[0],
                postId: activity.postId,
                ...(activity.postPageIndex && {
                  postPageIndex: activity.postPageIndex.toString(),
                }),
                challengeId: activity.challengeId,
              };
            }
            break;
          case ActivityVerb.MENTIONED_IN_COMMENT:
          case ActivityVerb.MENTIONED_IN_REPLY:
            if (activityType == ActivityType.SINGLE) {
              fcmMessageDataPayload = {
                verb: `${activity.getGqlVerb()}`, //Mentioned
                objectType: `${activity.getObjectType()}`,
                objectId: activity.objectId,
                subjectId: activity.subjectIds[0],
                postId: activity.postId,
                commentId: activity.commentId,
                replyId: activity.replyId,
                ...(activity.postPageIndex && {
                  postPageIndex: activity.postPageIndex.toString(),
                }),
                challengeId: activity.challengeId,
              };
            }
            break;
          case ActivityVerb.ADDED_TO_IC:
            if (activityType == ActivityType.SINGLE) {
              fcmMessageDataPayload = {
                verb: `${activity.getGqlVerb()}`,
                objectType: `${activity.getObjectType()}`,
                objectId: activity.objectId,
                subjectId: activity.subjectIds[0],
              };
            }
            break;
          case ActivityVerb.AUTO_ADDED_TO_IC:
            objectStr = '';
            if (activityType == ActivityType.SINGLE) {
              fcmMessageDataPayload = {
                verb: `${activity.getGqlVerb()}`,
                objectType: `${activity.getObjectType()}`,
                objectId: activity.objectId,
                subjectId: activity.subjectIds[0],
              };
            }
            break;
        }
        break;
      case ActivityObjectType.CHALLENGE:
        objectStr = '';
        switch (verb) {
          case ActivityVerb.JOINED_CHALLENGE:
            objectStr = 'your challenge';
            fcmMessageDataPayload = {
              verb: `${activity.getGqlVerb()}`,
              objectType: `${activity.getObjectType()}`,
              objectId: activity.objectId,
              subjectId: activity.subjectIds[0],
              challengeId: activity.challengeId,
            };
            break;
          case ActivityVerb.CHALLENGE_CREATED:
            fcmMessageDataPayload = {
              verb: `${activity.getGqlVerb()}`,
              objectType: `${activity.getObjectType()}`,
              objectId: activity.objectId,
              subjectId: activity.subjectIds[0],
              challengeId: activity.challengeId,
            };
            break;
          case ActivityVerb.COMMENTED:
            objectStr = 'your challenge';
            fcmMessageDataPayload = {
              verb: `${activity.getGqlVerb()}`,
              objectType: `${activity.getObjectType()}`,
              objectId: activity.objectId,
              subjectId: activity.subjectIds[0],
              commentId: activity.commentId,
              challengeId: activity.challengeId,
            };
            break;
        }
        break;
      default:
        objectStr = 'default';
        fcmMessageDataPayload = {
          verb: `${activity.getGqlVerb()}`,
        };
    }
    return [objectStr, fcmMessageDataPayload];
  }

  getDataPayloadAndDisplayStr(props: {
    activity: Activity;
    subject: UserEntity;
    secondSubject?: UserEntity;
    miscIds?: string[];
  }): [FCMDataMessagePayload, string, string] {
    const activity = props.activity;
    let ids = props.miscIds;
    let notificationDisplayStr = '';
    let displayBodyStr: string;
    notificationDisplayStr += props.subject.handle;
    if (props.secondSubject) {
      notificationDisplayStr += ', ' + props.secondSubject.handle;
    }
    const verb: ActivityVerb = activity.getVerb();
    const verbStr: string = ActivityService.getVerbStr(verb);
    if (activity.miscId && !ids) ids = activity.miscId.split('##');
    const activityType: ActivityType = activity.getType();
    const [objectStr, fcmMessageDataPayload] =
      this.getObjectStrAndFcmDataPayload({
        activity,
        ids: ids ?? [],
      });
    const trailing = this.getTrailingObjStr(activity);
    notificationDisplayStr += this.combineVerbAndObjStr(
      activityType,
      activity,
      verbStr,
      objectStr,
      trailing
    );
    displayBodyStr = this.combineVerbAndObjStr(
      activityType,
      activity,
      verbStr,
      objectStr,
      trailing,
      false
    );
    displayBodyStr =
      displayBodyStr[0].toUpperCase() + displayBodyStr.substring(1);
    return [fcmMessageDataPayload, notificationDisplayStr, displayBodyStr];
  }

  getSystemNotificationData({
    activity,
    activityVerb,
    otherData,
  }: {
    activity: Activity;
    activityVerb: ActivityVerb;
    otherData?: string;
  }): {
    fcmData: FCMDataMessagePayload;
    displayStr: string;
    displayBodyStr: string;
  } {
    const payload = {
      verb: `${activity.getGqlVerb()}`,
      type: `${activity.getGqlActivityType()}`,
    };
    let fcmData: FCMDataMessagePayload;
    let displayStr = '';
    let displayBodyStr = '';
    if (activityVerb === ActivityVerb.COMMENT_EMBARGO_LIFTED) {
      displayStr = 'Congrats! 🎉 ';
      displayBodyStr = displayStr;
      fcmData = payload;
    } else if (activityVerb === ActivityVerb.REC_FIRST_STRIKE) {
      displayStr = "You've received your first strike.";
      displayBodyStr = "You've received your first strike.";
      fcmData = { ...payload, reviewRequestId: activity.miscId ?? '' };
    } else if (activityVerb === ActivityVerb.REC_SECOND_STRIKE) {
      displayStr = "You've received your second strike.";
      displayBodyStr = "You've received your second strike.";
      fcmData = { ...payload, reviewRequestId: activity.miscId ?? '' };
    } else if (activityVerb === ActivityVerb.REC_FINAL_STRIKE) {
      fcmData = { ...payload, reviewRequestId: activity.miscId ?? '' };
      displayStr = "You've received your final strike.";
      displayBodyStr = "You've received your final strike.";
    } else if (activityVerb === ActivityVerb.IMPROVED_PROFILE_RING) {
      fcmData = {
        ...payload,
        ringColor: activity.contentBody ?? '',
        score: otherData!,
      };
      displayStr = 'Congrats! 🎉 ';
      displayBodyStr = 'Congrats! 🎉 ';
    } else if (activityVerb === ActivityVerb.INITIAL_FEED_READY) {
      fcmData = { ...payload };
      displayStr = 'Feed Ready! 🎉 ';
      displayBodyStr = 'Feed Ready! 🎉 ';
    } else {
      fcmData = payload;
    }
    return { fcmData, displayStr, displayBodyStr };
  }

  private systemNotificationData(
    args: PerformActionArgs
  ): PerformActionReturnArgs {
    const activity = new Activity();
    const activityItemData = args.activityItemData!;
    activity.objectId = args.objectId;
    activity.miscId = args.miscId;
    activity.reportId = args.reportId;
    activity.setObjectType(args.objectType);
    activity.setVerb(args.verb);
    activity.createdAt = args.timeStamp;
    activity.updatedAt = args.timeStamp;
    activity.contentBody = args.contentBody;
    activity.pushSubject(args.subject.id);
    activity.setType(ActivityType.SYSTEM);
    activityItemData.ids.push(activity.id);
    const { fcmData, displayStr } = this.getSystemNotificationData({
      activity,
      activityVerb: args.verb,
      otherData: args.otherData,
    });
    return {
      fcmDataPayload: fcmData,
      displayStrForNotification: displayStr,
      activity,
      activityItemData,
    };
  }

  private upsertActivityToItemDataAndUserStream(
    args: PerformActionArgsWithDefaults
  ): {
    activity: Activity;
    activityItemData: ActivityItemData;
  } {
    if (args.activityItemData.isAggregated) {
      return this.upsertActivityToAggregatedItemDataAndUserStream(args);
    } else if (args.canAggregate && args.activityItemData.ids.length > 4) {
      return this.aggregateThenUpsertActivityToItemDataAndUserStream(args);
    } else {
      return this.upsertNewActivityToItemDataAndUserStream(args);
    }
  }

  private upsertNewActivityToItemDataAndUserStream(
    args: PerformActionArgsWithDefaults
  ): {
    activity: Activity;
    activityItemData: ActivityItemData;
  } {
    args.logger.debug('upsertNewActivityToItemDataAndUserStream');
    const activity = Activity.singleTypeFromArgs(args);
    activity.pushSubject(args.subject.id);
    args.activityItemData.ids.push(activity.id);
    if (!args.activityOwner.activityStream?.activities) {
      args.activityOwner.activityStream!.activities = [activity];
    } else {
      args.activityOwner.activityStream.activities.unshift(activity);
    }
    return {
      activity,
      activityItemData: args.activityItemData,
    };
  }

  private aggregateThenUpsertActivityToItemDataAndUserStream(
    args: PerformActionArgsWithDefaults
  ): {
    activity: Activity;
    activityItemData: ActivityItemData;
  } {
    args.logger.debug('aggregateThenUpsertActivityToItemDataAndUserStream');
    const activity = Activity.singleTypeFromArgs(args);
    //Increment
    activity.totalCount = args.activityItemData.ids.length + 1;
    const secondId =
      args.activityItemData.ids[args.activityItemData.ids.length - 1];
    //Convert into Aggregated Activity
    activity.pushSubject(args.subject.id, true, secondId);
    activity.setType(ActivityType.AGGREGATED);
    const deleteEvent = Activity.createDeleteMetaEvent(
      args.activityItemData.ids
    );
    //2.1 Delete previous activities from Author's ActivityStream
    args.activityOwner.activityStream!.activities.unshift(deleteEvent);
    //2.2 Delete previous activities from ActivityData
    args.activityItemData.ids = [activity.id, secondId];
    args.activityItemData.isAggregated = true;
    args.activityOwner.activityStream!.activities.unshift(activity);
    return {
      activity,
      activityItemData: args.activityItemData,
    };
  }

  private upsertActivityToAggregatedItemDataAndUserStream(
    args: PerformActionArgsWithDefaults
  ): {
    activity: Activity;
    activityItemData: ActivityItemData;
  } {
    args.logger.debug('upsertActivityToAggregatedItemDataAndUserStream');
    const aggregatedActivityId = args.activityItemData.ids[0];
    const userActivityStream = args.activityOwner.activityStream!;
    let aggregatedIndex = -1;
    for (let i = 0; i < userActivityStream.activities.length; i++) {
      if (userActivityStream.activities[i].id === aggregatedActivityId) {
        aggregatedIndex = i;
        break;
      }
    }
    args.logger.info('aggregatedActivityIndex', { aggregatedIndex });
    if (aggregatedIndex !== -1) {
      const aggregatedActivity = userActivityStream.activities[aggregatedIndex];
      const activity = Activity.copy(aggregatedActivity);
      activity.commentId = args.commentId;
      activity.postId = args.postId;
      activity.replyId = args.replyId;
      activity.reportId = args.reportId;
      activity.postPageIndex = args.postPageIndex;
      activity.setType(ActivityType.AGGREGATED);
      activity.updatedAt = args.timeStamp;
      if (!activity.totalCount) activity.totalCount = 0;
      //example -> "A, B and (totalCount - 2) others liked your post"
      activity.totalCount += 1;
      activity.pushSubject(args.subject.id, true);
      activity.updatedAt = args.timeStamp;
      userActivityStream.activities.splice(aggregatedIndex, 1);
      userActivityStream.activities.unshift(activity);
      return {
        activity,
        activityItemData: args.activityItemData,
      };
    } else {
      return this.upsertNewActivityToItemDataAndUserStream(args);
    }
  }

  private async updateEntityActivityDataAndActivityStreamInTx({
    entity,
    entityName,
    activityStream,
  }: {
    entity: PostEntity | CommentEntity | ReplyEntity | UserEntity;
    entityName: EntitiesWithActivityDataName;
    activityStream: ActivityStreamEntity;
  }): Promise<void> {
    await this.postService.repo.repository.manager.transaction(
      async manager => {
        return Promise.all([
          manager
            .getRepository(getEntityWithActivityDataFromName(entityName))
            .update(entity.id, {
              activityData: entity.activityData,
            }),
          manager
            .getRepository(ActivityStreamEntity)
            .update(activityStream.id, activityStream),
        ]);
      }
    );
  }
}

export interface PerformActionArgs {
  activityOwner: UserEntity;
  subject: UserEntity | WildrEntity;
  activityItemData?: ActivityItemData; // required for aggregation
  timeStamp: Date;
  objectId: string;
  objectType: ActivityObjectType;
  verb: ActivityVerb;
  logger: EphemeralLogger;
  /**
   * @deprecated Use [postId] | commentId | replyId
   * or create another variable
   */
  miscId?: string; //commentID (commented) | postId (replied)
  postId?: string;
  commentId?: string;
  replyId?: string;
  reportId?: string;
  challengeId?: string;
  postPageIndex?: number;
  contentBody?: string; //will be empty in case of empty
  otherData?: string;
  canAggregate: boolean;
}

interface PerformActionArgsWithDefaults extends PerformActionArgs {
  activityItemData: ActivityItemData;
}

export interface PerformActionReturnArgs {
  activity: Activity;
  displayStrForNotification: string | undefined;
  fcmDataPayload: FCMDataMessagePayload | undefined;
  activityItemData: ActivityItemData | undefined;
  aggregatedIndex?: number | undefined;
}

interface NotificationData {
  activity: Activity;
  subject: UserEntity;
  activityOwner: UserEntity;
}
