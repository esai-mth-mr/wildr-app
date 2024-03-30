import { Inject, UseGuards } from '@nestjs/common';
import { Args, Context, ResolveField, Resolver } from '@nestjs/graphql';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  Activity,
  ActivityMetaEvent,
  ActivityObjectType,
  ActivityType,
  ActivityVerb,
} from '../../../activity/activity';
import { ActivityService } from '../../../activity/activity.service';
import { CommentEntity } from '../../../comment/comment.entity';
import { CommentService } from '../../../comment/comment.service';
import { FCMDataMessagePayload } from '../../../fcm/fcm.service';
import {
  ActivitiesConnection,
  ActivitiesEdge,
  Activity as GqlActivity,
  ActivityObject,
  ActivityObjectType as GqlActivityObjectType,
  Challenge,
  MiscObject,
  User as GqlUser,
} from '../../../generated-graphql';
import { PostService } from '../../../post/post.service';
import { ReplyService } from '../../../reply/reply.service';
import { UserEntity } from '../../user.entity';
import { UserService } from '../../user.service';
import { JwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';
import { AppContext, setupParentPostsForReposts } from '@verdzie/server/common';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { FindConditions } from 'typeorm';
import {
  canShowChallengeActivities,
  canShowReposts,
} from '@verdzie/server/data/common';
import { ignoreRepostsPredicate } from '@verdzie/server/post/post-repository/post.predicates';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import _ from 'lodash';
import { ActivityStreamService } from '@verdzie/server/activity-stream/activity.stream.service';
import { ReplyEntity } from '@verdzie/server/reply/reply.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { ChallengeRepository } from '@verdzie/server/challenge/challenge-repository/challenge.repository';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ChallengeCoverService } from '@verdzie/server/challenge/challengeCover.service';

@Resolver('User')
@UseGuards(JwtAuthGuard)
export class UserActivitiesConnectionResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private postService: PostService,
    private userService: UserService,
    private commentService: CommentService,
    private replyService: ReplyService,
    private activityService: ActivityService,
    private activityStreamService: ActivityStreamService,
    private feedService: FeedService,
    private challengeRepository: ChallengeRepository,
    private challengeCoverService: ChallengeCoverService
  ) {
    this.logger = this.logger.child({
      context: 'UserActivitiesConnectionResolver',
    });
  }

  @ResolveField(() => ActivitiesConnection, { name: 'activitiesConnection' })
  @UseGuards(JwtAuthGuard)
  async activitiesConnection(
    @Args('first') first: number,
    @Args('after') after: string,
    @Args('last') last: number,
    @Args('before') before: string,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ActivitiesConnection | undefined> {
    if (!currentUser) {
      this.logger.error('User not logged in');
      return undefined;
    }
    if (currentUser.id !== ctx.user?.id) {
      this.logger.error("Current user requesting someone else's data");
      return undefined;
    }
    const activityStream = await this.activityStreamService.findById(
      currentUser.id
    );
    if (!activityStream) {
      this.logger.error('No ActivityStream found for user', {
        user: currentUser.id,
      });
      return undefined;
    }
    let hasFoundRequiredNumberOfPosts = false;
    let infiniteLoopCheckCounter = 0;
    let predicate: FindConditions<PostEntity> | undefined;
    const shouldSkipReposts = !canShowReposts(ctx.version);
    const authorIdsToSkip: Set<string> = new Set<string>();
    //Get Block list
    //Get BlockByUser List
    if (currentUser.blockListFeedId) {
      const blockedUserIds: string[] =
        await this.userService.getBlockedUsersList({
          userId: currentUser.id,
          userEntity: currentUser,
        });
      blockedUserIds.forEach(id => authorIdsToSkip.add(id));
    }
    const blockedByUsersList = await this.feedService.find(
      toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, currentUser.id)
    );
    if (blockedByUsersList)
      blockedByUsersList.ids.forEach(id => authorIdsToSkip.add(id));
    if (shouldSkipReposts) {
      this.logger.info('version is less required Repost version', {
        version: ctx.version,
      });
      predicate = ignoreRepostsPredicate;
    }
    const edges: ActivitiesEdge[] = [];
    const posts: PostEntity[] = [];
    const challenges: ChallengeEntity[] = [];
    let afterCursor = after ?? undefined;
    while (!hasFoundRequiredNumberOfPosts) {
      infiniteLoopCheckCounter += 1;
      if (infiniteLoopCheckCounter == 50) {
        this.logger.error('RAN INTO INFINITE LOOP');
        break;
      }
      const [activityEntities] = (await this.activityStreamService.getPage(
        activityStream,
        first ?? undefined,
        afterCursor,
        last ?? undefined,
        before ?? undefined
      )) ?? [[], false, false];
      const lastPostId = _.last(activityEntities)?.id;
      if (!lastPostId) break;
      if (lastPostId) {
        afterCursor = lastPostId;
      }
      if (!afterCursor) {
        hasFoundRequiredNumberOfPosts = true;
        break;
      }
      await this.parseActivitiesIntoEdges({
        activities: activityEntities,
        shouldSkipReposts,
        predicate,
        posts,
        challenges,
        edges,
        authorIdsToSkip: [...authorIdsToSkip],
        ctx,
      });
      hasFoundRequiredNumberOfPosts = edges.length >= first;
    }
    await setupParentPostsForReposts(posts, ctx, this.postService, this.logger);
    //TODO: Remove idsToDelete
    return {
      __typename: 'ActivitiesConnection',
      pageInfo: {
        __typename: 'PageInfo',
        startCursor: _.first(edges)?.node.id ?? '',
        endCursor: _.last(edges)?.node.id ?? '',
        hasNextPage: false, //The old code was just hardcoding this value
        hasPreviousPage: false, //The old code was just hardcoding this value
      },
      edges,
    };
  }

  async parseActivitiesIntoEdges({
    activities,
    shouldSkipReposts,
    predicate,
    posts,
    challenges,
    edges,
    authorIdsToSkip,
    ctx,
  }: {
    activities: Activity[];
    shouldSkipReposts: boolean;
    predicate: FindConditions<PostEntity> | undefined;
    posts: PostEntity[];
    challenges: ChallengeEntity[];
    edges: ActivitiesEdge[];
    authorIdsToSkip: string[];
    ctx: AppContext;
  }) {
    let idsToDelete: string[] = [];
    for (const activity of activities) {
      const act = Activity.copy(activity);
      if (act.metaEvent == ActivityMetaEvent.DELETE) {
        //Delete and skip some stuff
        if (act.metaEvent == 1) {
          idsToDelete.push(act.id);
          if (act.deletedIds) {
            idsToDelete = idsToDelete.concat(act.deletedIds);
          }
          this.logger.debug(`IDS to delete = ${idsToDelete}`);
        }
      } else {
        if (
          idsToDelete.find(id => {
            return act.id === id;
          })
        ) {
          continue;
        }
        const subjects: UserEntity[] = [];
        const gqlSubjects: GqlUser[] = [];
        for (const userId of act.subjectIds) {
          if (authorIdsToSkip.includes(userId)) {
            this.logger.info('Subject needs to be skipped');
            continue;
          }
          const user = await this.userService.findById(userId);
          if (user) {
            subjects.push(user);
            gqlSubjects.push(this.userService.toUserObject({ user }));
          }
        }
        let object: ActivityObject | undefined;
        let objectType: GqlActivityObjectType = GqlActivityObjectType.NONE;
        let miscObject: MiscObject | undefined;
        let miscIds: string[] = [];
        if (activity.miscId) miscIds = activity.miscId.split('##');
        switch (act.getObjectType()) {
          case ActivityObjectType.POST:
            if (act.getVerb() == ActivityVerb.REPOSTED) {
              if (shouldSkipReposts) {
                continue;
              }
            }
            const postEntity = await this.postService.findById(
              act.objectId,
              predicate
            );
            if (!postEntity) {
              continue;
            }
            if (postEntity?.isParentPostDeleted()) continue;
            if (authorIdsToSkip.includes(postEntity.authorId)) continue;
            object = this.postService.toGqlPostObject(postEntity);
            if (!object) continue;
            if (postEntity) posts.push(postEntity);
            if (object!.__typename == 'ImagePost') {
              objectType = GqlActivityObjectType.POST_IMAGE;
            } else if (object!.__typename == 'TextPost') {
              objectType = GqlActivityObjectType.POST_TEXT;
            } else if (object!.__typename == 'VideoPost') {
              objectType = GqlActivityObjectType.POST_VIDEO;
            } else if (object!.__typename == 'MultiMediaPost') {
              objectType = GqlActivityObjectType.POST_MULTI_MEDIA;
            }
            if (act.getVerb() == ActivityVerb.COMMENTED) {
              const commentId = activity.commentId ?? miscIds[1];
              const comment = await this.commentService.findById(commentId);
              if (comment) {
                miscObject = this.commentService.toCommentObject(comment);
              }
            }
            break;
          case ActivityObjectType.COMMENT:
            objectType = GqlActivityObjectType.COMMENT;
            const comment = await this.commentService.findWithRelations(
              act.objectId,
              {
                relations: [
                  CommentEntity.kPostRelation,
                  CommentEntity.kChallengeRelation,
                ],
              }
            );
            if (
              !comment ||
              (!comment.post && !comment.challenge) ||
              comment.flagMeta?.flags
            ) {
              this.logger.warn('Comment not found or comment has flag meta');
              continue;
            }
            if (authorIdsToSkip.includes(comment.authorId)) continue;
            object = this.commentService.toCommentObject(comment);
            if (comment.post) {
              miscObject = this.postService.toGqlPostObject(comment?.post);
              if (comment?.post) {
                posts.push(comment.post);
              }
            } else if (comment.challenge) {
              miscObject = await this.toChallengeObject(comment.challenge);
              if (comment.challenge) {
                challenges.push(comment.challenge);
              }
            }
            break;
          case ActivityObjectType.REPLY:
            objectType = GqlActivityObjectType.REPLY;
            const reply = await this.replyService.findByIdWithCommentRelation(
              act.objectId
            );
            // Don't show notification for replies that don't have comments or
            // have hidden comments so that the user doesn't get navigated to
            // something that doesn't exist
            if (!reply || !reply.comment || reply.comment.flagMeta?.flags)
              continue;
            if (authorIdsToSkip.includes(reply.authorId)) continue;
            object = this.replyService.toReplyObject(reply);
            if (activity.postId || miscIds[0]) {
              const post = await this.postService.findById(
                activity.postId ?? miscIds[0],
                predicate
              );
              if (post?.isParentPostDeleted()) continue;
              if (!post) continue;
              if (post) posts.push(post);
              miscObject = this.postService.toGqlPostObject(post);
            } else if (activity.challengeId) {
              const challenge = await this.challengeRepository.findOne({
                id: activity.challengeId,
              });
              if (!challenge) continue;
              if (challenge) challenges.push(challenge);
              miscObject = await this.toChallengeObject(challenge);
            }
            break;
          case ActivityObjectType.USER:
            objectType = GqlActivityObjectType.USER;
            const user = await this.userService.findById(act.objectId);
            if (!user) continue;
            object = this.userService.toUserObject({ user });
            switch (act.getVerb()) {
              case ActivityVerb.MENTIONED_IN_POST:
                const post = await this.postService.findById(
                  activity.postId ?? miscIds[0],
                  predicate
                );
                if (!post || post?.isParentPostDeleted()) continue;
                miscObject = this.postService.toGqlPostObject(post);
                posts.push(post);
                break;
              case ActivityVerb.MENTIONED_IN_COMMENT:
                if (!activity.commentId) {
                  this.logger.warn(
                    '[parseActivitiesIntoEdges] commentId is undefined in mention in comment activity'
                  );
                  continue;
                }
                const commentWithPostAndChallenge =
                  await this.commentService.findById(activity.commentId, {
                    relations: [
                      CommentEntity.kPostRelation,
                      CommentEntity.kChallengeRelation,
                    ],
                  });
                if (
                  !commentWithPostAndChallenge ||
                  (!commentWithPostAndChallenge.post &&
                    !commentWithPostAndChallenge.challenge) ||
                  commentWithPostAndChallenge.flagMeta?.flags ||
                  commentWithPostAndChallenge.post?.isParentPostDeleted()
                ) {
                  continue;
                }
                if (commentWithPostAndChallenge.challenge) {
                  challenges.push(commentWithPostAndChallenge.challenge);
                  miscObject = await this.toChallengeObject(
                    commentWithPostAndChallenge.challenge
                  );
                } else if (commentWithPostAndChallenge.post) {
                  posts.push(commentWithPostAndChallenge.post);
                  miscObject = this.postService.toGqlPostObject(
                    commentWithPostAndChallenge.post
                  );
                } else {
                  this.logger.warn(
                    '[parseActivitiesIntoEdges] mentioning comment has no parent',
                    {
                      activity,
                    }
                  );
                  continue;
                }
                break;
              case ActivityVerb.MENTIONED_IN_REPLY:
                if (!activity.replyId) {
                  this.logger.warn(
                    '[parseActivitiesIntoEdges] replyId is undefined in mention in reply activity'
                  );
                  continue;
                }
                const replyWithCommentAndParent =
                  await this.replyService.findById(activity.replyId, {
                    relations: [
                      ReplyEntity.kCommentRelation,
                      ReplyEntity.kCommentRelation +
                        '.' +
                        CommentEntity.kPostRelation,
                      ReplyEntity.kCommentRelation +
                        '.' +
                        CommentEntity.kChallengeRelation,
                    ],
                  });
                if (
                  !replyWithCommentAndParent ||
                  !replyWithCommentAndParent.comment ||
                  (!replyWithCommentAndParent.comment.post &&
                    !replyWithCommentAndParent.comment.challenge) ||
                  replyWithCommentAndParent.comment.flagMeta?.flags ||
                  replyWithCommentAndParent.comment.post?.isParentPostDeleted()
                ) {
                  continue;
                }
                if (replyWithCommentAndParent.comment.challenge) {
                  challenges.push(replyWithCommentAndParent.comment.challenge);
                  miscObject = await this.toChallengeObject(
                    replyWithCommentAndParent.comment.challenge
                  );
                } else if (replyWithCommentAndParent.comment.post) {
                  posts.push(replyWithCommentAndParent.comment.post);
                  miscObject = this.postService.toGqlPostObject(
                    replyWithCommentAndParent.comment.post
                  );
                } else {
                  this.logger.warn(
                    '[parseActivitiesIntoEdges] mentioning reply has no parent',
                    {
                      activity,
                    }
                  );
                  continue;
                }
                break;
            }
            break;
          case ActivityObjectType.CHALLENGE:
            if (!canShowChallengeActivities(ctx.version)) {
              continue;
            }
            objectType = GqlActivityObjectType.CHALLENGE;
            const challenge = await this.challengeRepository.findOne({
              id: act.objectId,
            });
            if (!challenge) continue;
            if (authorIdsToSkip.includes(challenge.authorId)) continue;
            object = await this.toChallengeObject(challenge);
            break;
          default:
            objectType = GqlActivityObjectType.NONE;
        }
        let displayStr: string;
        let displayBodyStr: string;
        let fcmDataMessagePayload: FCMDataMessagePayload;
        if (act.getType() == ActivityType.SYSTEM) {
          this.logger.debug(`System notification, ${act.getVerb()}`);
          const result = this.activityService.getSystemNotificationData({
            activity: act,
            activityVerb: act.getVerb(),
          });
          fcmDataMessagePayload = result.fcmData;
          displayStr = result.displayStr;
          displayBodyStr = result.displayBodyStr;
        } else if (subjects.length == 2) {
          [fcmDataMessagePayload, displayStr, displayBodyStr] =
            this.activityService.getDataPayloadAndDisplayStr({
              activity: act,
              subject: subjects[0],
              secondSubject: subjects[1],
              miscIds,
            });
        } else {
          if (subjects[0] === undefined) {
            this.logger.debug('Subjects is undefined');
            break;
          }
          [fcmDataMessagePayload, displayStr, displayBodyStr] =
            this.activityService.getDataPayloadAndDisplayStr({
              activity: act,
              subject: subjects[0],
              miscIds,
            });
        }
        const gqlActivity: GqlActivity = {
          __typename: 'Activity',
          id: act.id,
          object: object,
          verb: act.getGqlVerb(),
          type: act.getGqlActivityType(),
          ts: {
            createdAt: act.createdAt,
            updatedAt: act.updatedAt,
          },
          subjects: gqlSubjects,
          totalCount: act.totalCount,
          objectType: objectType,
          miscObject: miscObject,
          displayStr: displayStr, //Not being used
          displayBodyStr: displayBodyStr,
          dataPayload: JSON.stringify(fcmDataMessagePayload),
        };
        const edge: ActivitiesEdge = {
          __typename: 'ActivitiesEdge',
          cursor: act.id,
          node: gqlActivity,
        };
        edges.push(edge);
      }
    }
  }

  private async toChallengeObject(
    challenge: ChallengeEntity
  ): Promise<Challenge> {
    return {
      __typename: 'Challenge',
      id: challenge.id,
      name: challenge.name,
      author: challenge.author
        ? this.userService.toUserObject({ user: challenge.author })
        : undefined,
      cover: await this.challengeCoverService.getGqlCover(challenge),
      ts: {
        createdAt: challenge.createdAt,
        updatedAt: challenge.updatedAt,
        expiry: challenge.endDate,
        start: challenge.startDate,
      },
      willBeDeleted: challenge.willBeDeleted,
      stats: challenge.stats,
      isCompleted: challenge.isCompleted,
    };
  }
}
