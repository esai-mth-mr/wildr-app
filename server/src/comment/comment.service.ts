import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  FindConditions,
  FindOneOptions,
  ObjectID,
  Repository,
  UpdateResult,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Logger } from 'winston';
import { generateId, ID_SEPARATOR } from '@verdzie/server/common/generateId';
import { getParticipationTypeValueFrom } from '@verdzie/server/common/participationType';
import { ContentIO } from '@verdzie/server/content/content.io';
import { preserveOrderByIds } from '@verdzie/server/data/common';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import {
  AddCommentInput,
  Comment,
  CommentContext,
  ParticipationType,
  ReportType,
} from '@verdzie/server/graphql';
import { ReplyEntity } from '@verdzie/server/reply/reply.entity';
import { ReplyService } from '@verdzie/server/reply/reply.service';
import { UserService } from '@verdzie/server/user/user.service';
import { ReportObjectTypeEnum } from '@verdzie/server/report/report.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { ReportProducer } from '@verdzie/server/worker/report/report.producer';
import {
  CommentEntity,
  CommentEntityStats,
  CommentEntityWithAuthor,
  CommentEntityWithChallenge,
  CommentEntityWithPost,
} from '@verdzie/server/comment/comment.entity';
import {
  FlagCommentInput,
  FlagOperationType,
  PaginationInput,
  ReactionType,
} from '@verdzie/server/generated-graphql';
import { isString } from 'class-validator';
import {
  CommentRepository,
  TxMethodOpts,
} from '@verdzie/server/comment/comment.repository';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';
import { NotifyAuthorProducer } from '@verdzie/server/worker/notify-author/notifyAuthor.producer';
import {
  FilterPaginateEntriesPredicate,
  TryAndPushItemToEntityResult,
} from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import {
  AccessControlService,
  MessageParentType,
} from '@verdzie/server/access-control/access-control.service';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  NotFoundExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';
import { WildrExceptionDecorator } from '../common/wildr-exception.decorator';
import { AppContext, retryWithBackoff } from '../common';
import {
  kBlockedUserAbleToViewContentCode,
  kSomethingWentWrong,
} from '../../constants';
import { OSIncrementalIndexStateProducer } from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.producer';
import {
  CommentPostingAccess,
  CommentPostingAccessData,
  CommentVisibilityAccess,
  CommentVisibilityAccessData,
} from '@verdzie/server/post/postAccessControl';
import { ContentService } from '@verdzie/server/content/content.service';
import { TrollDetectorService } from '@verdzie/server/troll-detector/troll-detector.service';
import {
  CannotCommentError,
  TrollingDetectedError,
} from '@verdzie/server/exceptions/ValidationException';
import { innerCircleListId } from '@verdzie/server/user-list/userList.helpers';
import { UserListService } from '@verdzie/server/user-list/userList.service';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { CanViewCommentsResult } from '@verdzie/server/post/post.service';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { getChallengeCommentsFeedId } from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { Result, err, ok } from 'neverthrow';
import { NotifyAboutMentionProducer } from '@verdzie/server/worker/notify-about-mention/notifyAboutMention.producer';
import {
  ChallengeInteractionEnum,
  ChallengeInteractionService,
} from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.service';

@Injectable()
export class CommentService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private repo: CommentRepository,
    private feedService: FeedService,
    private replyService: ReplyService,
    private userService: UserService,
    private reportWorker: ReportProducer,
    private notifyAuthorProducer: NotifyAuthorProducer,
    private accessControlService: AccessControlService,
    private incrementalIndexStateWorker: OSIncrementalIndexStateProducer,
    private notifyAboutMentionProducer: NotifyAboutMentionProducer,
    private challengeInteractionService: ChallengeInteractionService,
    private readonly contentService: ContentService,
    private readonly tdService: TrollDetectorService,
    private readonly userListService: UserListService
  ) {
    this.logger = this.logger.child({ context: 'CommentService' });
  }

  public toCommentObject(comment: CommentEntity): Comment {
    return {
      __typename: 'Comment',
      id: comment.id,
      ts: {
        __typename: 'Timestamps',
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
      commentStats: {
        __typename: 'CommentStats',
        likeCount: comment.stats.likeCount,
        replyCount: comment.stats.replyCount,
        reportCount: comment.stats.reportCount,
      },
      participationType: comment.getParticipationType(),
    };
  }

  /**
   * Parse transaction method opts for a repository or fall back to the default
   * comment repo if one is not passed.
   */
  getRepo(txOptions?: TxMethodOpts) {
    return (
      txOptions?.repo ||
      txOptions?.txManager?.getRepository(CommentEntity) ||
      this.repo.repo
    );
  }

  async findById(
    id: string,
    findOptions?: FindOneOptions<CommentEntity>
  ): Promise<CommentEntity | undefined> {
    return this.repo.findOne(id, findOptions);
  }

  async findByIdIncludingSoftDelete(
    id: string
  ): Promise<CommentEntity | undefined> {
    return this.repo.findOneIncludingSoftDelete(id);
  }

  async findByIdWithAuthor(id: string): Promise<CommentEntity | undefined> {
    return this.repo.findOne(id, {
      relations: [CommentEntity.kAuthorRelation],
    }) as Promise<CommentEntityWithAuthor | undefined>;
  }

  async findWithRelations(
    id: string,
    options?: FindOneOptions<CommentEntity>
  ): Promise<CommentEntity | undefined> {
    return this.repo.findOne(id, options);
  }

  async findByIds(
    ids: string[],
    opts?: { withAuthor?: boolean }
  ): Promise<CommentEntity[]> {
    return preserveOrderByIds(
      ids,
      await this.repo.findByIds(ids, {
        relations: [
          ...(opts?.withAuthor ? [CommentEntity.kAuthorRelation] : []),
        ],
      })
    );
  }

  async findReplies({
    commentOrId,
    first,
    after,
    last,
    before,
    includingAndAfter,
    includingAndBefore,
    targetReplyId,
  }: {
    commentOrId: CommentEntity | string;
    first?: number;
    after?: string;
    last?: number;
    before?: string;
    includingAndAfter?: string;
    includingAndBefore?: string;
    targetReplyId?: string;
  }): Promise<{
    replies: ReplyEntity[];
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    targetReplyError?: string;
  }> {
    this.logger.info('findReplies()', {
      includingAndAfter,
      includingAndBefore,
    });
    const comment =
      typeof commentOrId === 'string'
        ? await this.repo.findOne(commentOrId)
        : commentOrId;
    if (!comment) {
      this.logger.error('findReplies() -> comment not found for ', {
        commendId:
          typeof commentOrId === 'string' ? commentOrId : commentOrId.id,
      });
      return {
        replies: [],
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
    const feed = await this.feedService.find(comment.replyFeedId);
    if (!feed)
      return {
        replies: [],
        hasNextPage: false,
        hasPreviousPage: false,
      };
    const [page, hasNextPage, hasPreviousPage] = await this.feedService.getPage(
      {
        feedOrId: feed,
        after,
        last,
        before,
        first,
        includingAndAfter,
        includingAndBefore,
        shouldReverse: true, //need old ones first
      }
    );
    let replies = await this.replyService.findByIds(page.ids);
    replies = replies.filter(r => r !== undefined);
    let targetReplyError: string | undefined;
    if (targetReplyId) {
      const isTargetReplyDeleted = !replies.find(
        reply => reply.id === targetReplyId
      );
      if (isTargetReplyDeleted) {
        targetReplyError = 'Reply has been deleted';
      }
    }
    return {
      replies: replies.filter(reply => reply !== undefined),
      hasNextPage,
      hasPreviousPage,
      targetReplyError,
    };
  }

  async findWithConditions(
    where?: FindConditions<CommentEntity>,
    shouldIncludeDeletedPosts = false
  ): Promise<CommentEntity[]> {
    return await this.repo.find(where, shouldIncludeDeletedPosts);
  }

  async create({
    currentUser,
    parentId,
    parentType,
    content,
    body,
    negativeConfidenceValue,
  }: {
    currentUser: UserEntity;
    parentId: string;
    content: ContentIO;
    body: string;
    negativeConfidenceValue?: number;
    parentType: CommentParentType;
  }): Promise<CommentEntity> {
    const comment: CommentEntity = new CommentEntity();
    comment.id = generateId();
    comment.author = currentUser;
    comment.content = content;
    comment.body = body;
    switch (parentType) {
      case CommentParentType.POST:
        comment.postId = parentId;
        break;
      case CommentParentType.CHALLENGE:
        comment.challengeId = parentId;
        break;
    }
    comment.negativeConfidenceValue = negativeConfidenceValue;
    comment.replyFeed = await this.feedService.create(
      FeedEntityType.REPLY,
      comment.id
    );
    await this.repo.save(comment);
    comment.author = currentUser;
    return comment;
  }

  async save(comment: CommentEntity): Promise<CommentEntity> {
    return await this.repo.save(comment);
  }

  async updateStats(
    comment: CommentEntity,
    stats: CommentEntityStats
  ): Promise<CommentEntity> {
    await this.repo.update(comment.id, { _stats: stats });
    comment.stats = stats;
    return comment;
  }

  async takeDown(commentOrId: string | CommentEntity): Promise<boolean> {
    const commentId =
      typeof commentOrId === 'string' ? commentOrId : commentOrId.id;
    const result = await this.update(commentId, {
      state: ExistenceState.TAKEN_DOWN,
    });
    this.logger.info('takeDown', { result });
    return result.affected !== undefined;
  }

  async respawn(commentOrId: string | PostEntity): Promise<boolean> {
    const commentId =
      typeof commentOrId === 'string' ? commentOrId : commentOrId.id;
    const result = await this.update(commentId, { state: undefined });
    this.logger.info('respawn', { result });
    return result.affected !== undefined;
  }

  async update(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectID
      | ObjectID[]
      | FindConditions<CommentEntity>,
    partialEntity: QueryDeepPartialEntity<CommentEntity>
  ): Promise<UpdateResult> {
    return this.repo.update(criteria, partialEntity);
  }

  @WildrExceptionDecorator()
  async findOneWithAuthorization(
    commentId: string,
    currentUser?: UserEntity,
    findOptions?: FindOneOptions<CommentEntity>
  ) {
    const relations = new Set<string>([
      CommentEntity.kPostRelation,
      CommentEntity.kChallengeRelation,
      ...(findOptions?.relations ?? []),
    ]);
    const comment = await this.repo.findOne(commentId, {
      ...findOptions,
      relations: [...relations.values()],
    });
    if (!comment)
      throw new NotFoundException(`Comment not found`, { commentId });
    const parent = comment.post || comment.challenge;
    if (!parent)
      throw new NotFoundException(`Comment not found`, {
        commentId,
        post: comment.post,
        exceptionCode: comment.challengeId
          ? NotFoundExceptionCodes.CHALLENGE_NOT_FOUND
          : NotFoundExceptionCodes.POST_NOT_FOUND,
      });
    await this.accessControlService.checkMessageVisibilityAccess({
      object: parent,
      currentUser,
      messageType: 'comment',
      parentType: parent instanceof PostEntity ? 'post' : 'challenge',
      message: comment,
    });
    if (this.shouldHideFlaggedComment(comment, currentUser?.id))
      throw new ForbiddenException(`Comment has been flagged`, {
        commentId,
        currentUserId: currentUser?.id,
      });
    return comment;
  }

  async updateParticipation(
    commentId: string,
    type: ParticipationType
  ): Promise<CommentEntity | undefined> {
    const comment = await this.findAndResolveAuthorRelation(commentId);
    if (!comment) return undefined;
    const typeValue: number = getParticipationTypeValueFrom(type);
    await this.repo.update(commentId, {
      _participationType: typeValue,
    });
    comment._participationType = typeValue;
    return comment;
  }

  async softDelete(commentId: string): Promise<CommentEntity | undefined> {
    const comment = await this.repo.findOneIncludingSoftDelete(commentId);
    if (!comment) return comment;
    if (comment.willBeDeleted) return comment;
    await this.repo.update(commentId, { willBeDeleted: true });
    return comment;
  }

  async hardDelete(commentEntity: CommentEntity): Promise<boolean> {
    try {
      await this.repo.repo.remove(commentEntity);
      return true;
    } catch (err) {
      this.logger.error(err);
      return false;
    }
  }

  async report(
    commentId: string,
    reportType: ReportType,
    currentUser?: UserEntity
  ): Promise<CommentEntity | string> {
    if (!currentUser) {
      const comment = await this.findById(commentId);
      if (!comment) {
        this.logger.error('[comment.service] Couldnt not find comment obj');
        return 'Sorry, comment not found!';
      }
      if (reportType === ReportType.UNREPORT) {
        return 'You must log in first.';
      }
      comment?.incrementReportCount();
      await Promise.all([this.repo.save(comment)]);
      this.reportWorker.createReport({
        objectAuthorId: comment.authorId,
        objectType: ReportObjectTypeEnum.COMMENT,
        objectId: commentId,
        reporterId: '',
        reportType,
        reporterComment: '',
      });
      if (comment.postId) this.requestReIndex(comment.postId);
      return comment;
    }
    const reportCommentFeed = await this.feedService.find(
      currentUser.reportCommentFeedId ?? ''
    );
    if (!reportCommentFeed) {
      this.logger.error(
        "comment.service Current user's ReportCommentFeed not found",
        {
          userId: currentUser.id,
        }
      );
      return 'Something went wrong';
    }
    const comment = await this.findAndResolveAuthorRelation(commentId);
    if (!comment) {
      this.logger.error('[comment.service] Couldnt not find comment obj');
      return 'Sorry, comment not found!';
    }
    this.logger.debug('[comment.service] found comment for reporting: ', {
      comment,
    });

    if (reportType === ReportType.UNREPORT) {
      if (reportCommentFeed.hasEntry(comment.id)) {
        comment.decrementReportCount();
        await Promise.all([
          this.feedService.tryRemoveEntry(reportCommentFeed, comment.id),
          this.repo.save(comment),
        ]);
      } else {
        return 'This comment has been unreported.';
      }
    } else {
      if (reportCommentFeed.hasEntry(comment.id)) {
        return 'This comment has been reported.';
      } else {
        comment.incrementReportCount();
        await Promise.all([
          this.feedService.tryUnshiftEntry(reportCommentFeed, comment.id),
          this.repo.save(comment),
        ]);
        // this.userService.updateUserScoreData({
        //   userId: comment.authorId,
        //   action: UserScoreDataRelatedActionEnum.REC_REPORT_COMMENT,
        // });
        // this.userService.updateUserScoreData({
        //   userId: currentUser.id,
        //   action: UserScoreDataRelatedActionEnum.REPORTED_SOMEONE,
        // });
        this.reportWorker.createReport({
          objectAuthorId: comment.authorId,
          objectType: ReportObjectTypeEnum.COMMENT,
          objectId: commentId,
          reporterId: currentUser.id,
          reportType,
          reporterComment: '',
        });
        // this.userService.addStrike(comment.authorId); ///❌ TODO: REMOVE IT ❌
        ///TODO: UNCOMMENT IT
        // if (comment.stats.reportCount == 3) {
        //   //Give one strike to the author
        //   this.userService.addStrike(comment.authorId);
        // }
        if (comment.postId) this.requestReIndex(comment.postId);
      }
    }
    return comment;
  }

  private async findAndResolveAuthorRelation(
    commentId: string
  ): Promise<CommentEntity | undefined> {
    return await this.repo.findOne(commentId, {
      relations: [CommentEntity.kAuthorRelation],
    });
  }

  async getWillBeDeletedComments(take = 10): Promise<CommentEntity[]> {
    return await this.repo.repo.find({ take, where: { willBeDeleted: true } });
  }

  async deleteReply(
    replyId: string,
    commentOrId: CommentEntity | string
  ): Promise<CommentEntity | undefined> {
    const comment = isString(commentOrId)
      ? await this.findById(commentOrId)
      : commentOrId;
    if (!comment) return undefined;
    const feed = await this.feedService.tryRemoveEntry(
      comment.replyFeedId,
      replyId
    );
    if (!feed) return undefined;
    comment.stats = { ...comment.stats, replyCount: feed.page.ids.length };
    await this.save(comment);
    this.logger.debug('STATUS = ', { stats: comment.stats });
    if (comment.postId) this.requestReIndex(comment.postId);
    return comment;
  }

  async getReactions(
    commentOrId: CommentEntity | string,
    reactionType: ReactionType,
    paginationInput: PaginationInput
  ) {
    const comment =
      typeof commentOrId === 'string'
        ? await this.repo.findOne(commentOrId)
        : commentOrId;
    if (!comment) return;
    let feed: FeedEntity | undefined;
    switch (reactionType) {
      case ReactionType.LIKE:
        feed = await this.feedService.find(
          toFeedId(FeedEntityType.LIKE_REACTIONS_ON_COMMENT, comment.id)
        );
        break;
      default:
        this.logger.warn('[getReactions] unsupported reaction type', {
          commentId: comment.id,
          reactionType,
        });
        return;
    }
    if (!feed) {
      this.logger.error('[getReactions] cannot find reaction feed', {
        commentId: comment.id,
        reactionType,
      });
      return;
    }
    const [page, hasNextPage, hasPreviousPage] = await this.feedService.getPage(
      { feedOrId: feed },
      paginationInput
    );
    const users = await this.userService.findAllById(page.ids);
    return {
      users,
      hasNextPage,
      hasPreviousPage,
      count: feed.count,
    };
  }

  @WildrExceptionDecorator()
  async findByIdWithPostOrFail(
    commentId: string
  ): Promise<CommentEntityWithPost> {
    const comment = await this.repo.findByIdWithPost(commentId);
    if (!comment)
      throw new NotFoundException(`Sorry, comment not found`, { commentId });
    if (!comment.post)
      throw new NotFoundException(`Sorry, comment's post not found`, {
        commentId,
      });
    return comment as CommentEntityWithPost;
  }

  @WildrExceptionDecorator()
  async findByIdWithChallengeOrFail(
    commentId: string
  ): Promise<CommentEntityWithChallenge> {
    const comment = await this.repo.findByIdWithChallenge(commentId);
    if (!comment)
      throw new NotFoundException(`Sorry, comment not found`, { commentId });
    if (!comment.challenge)
      throw new NotFoundException(`Sorry, comment's challenge not found`, {
        commentId,
      });
    return comment as CommentEntityWithChallenge;
  }

  @WildrExceptionDecorator()
  async findByIdWithParentOrFail(
    commentId: string
  ): Promise<{ comment: CommentEntity; parent: PostEntity | ChallengeEntity }> {
    const comment = await this.findById(commentId, {
      relations: ['post', 'challenge'],
    });
    if (!comment) {
      throw new NotFoundException(`Sorry, comment not found`, { commentId });
    }
    if (comment.post) {
      return {
        comment,
        parent: comment.post,
      };
    } else if (comment.challenge) {
      return {
        comment,
        parent: comment.challenge,
      };
    }
    if (comment.postId && !comment.post) {
      throw new NotFoundException(`Sorry, comment's post not found`, {
        commentId,
      });
    }
    if (comment.challengeId && !comment.challenge) {
      throw new NotFoundException(`Sorry, comment's challenge not found`, {
        commentId,
      });
    }
    throw new InternalServerErrorException(`Comment parent not found`, {
      commentId,
    });
  }

  @WildrExceptionDecorator()
  private async authorizeCommentReaction(
    commentId: string,
    currentUser?: UserEntity
  ): Promise<{
    comment: CommentEntity;
    authorizedUser: UserEntity;
    parent: PostEntity | ChallengeEntity;
  }> {
    const { comment, parent } = await this.findByIdWithParentOrFail(commentId);
    const authorizedUser =
      await this.accessControlService.checkMessageReactionAccess({
        object: parent,
        currentUser,
        messageType: 'comment',
        parentType: parent instanceof PostEntity ? 'post' : 'challenge',
      });
    return { comment, authorizedUser, parent };
  }

  @WildrExceptionDecorator()
  async reactOnComment({
    commentId,
    reactionType,
    currentUser,
    context,
  }: {
    commentId: string;
    reactionType: ReactionType;
    currentUser?: UserEntity;
    context: AppContext;
  }): Promise<CommentEntity> {
    const { comment, authorizedUser, parent } =
      await this.authorizeCommentReaction(commentId, currentUser);
    if (currentUser) {
      const hasBlocked = await this.userService.hasBlocked({
        userWhoBlockedId: comment.authorId,
        userWhoBlocked: comment.author,
        userIdToCheck: currentUser.id,
      });
      if (hasBlocked) {
        this.logger.warn(
          '[reactOnComment] A blocked user was able to view this post',
          {
            commentId,
            blockedUser: currentUser.id,
            warnCode: kBlockedUserAbleToViewContentCode,
          }
        );
        throw new ForbiddenException(kSomethingWentWrong);
      }
    }
    if (reactionType === ReactionType.LIKE) {
      const updatedComment = await this.addLike({
        comment,
        parent,
        currentUser: authorizedUser,
        context,
      });
      if (comment.postId) this.requestReIndex(comment.postId);
      return updatedComment;
    } else if (reactionType === ReactionType.UN_LIKE) {
      const updatedComment = await this.removeLike(comment, authorizedUser);
      if (comment.postId) this.requestReIndex(comment.postId);
      return updatedComment;
    } else {
      throw new BadRequestException('Reaction type not implemented', {
        commentId,
        reactionType,
      });
    }
  }

  /**
   * Adds a like to the comment's like reaction feed if it does not exist.
   * Throws if the comment is not found or any ops fail.
   */
  private async addLike({
    comment,
    currentUser,
    context,
    parent,
  }: {
    comment: CommentEntity;
    currentUser: UserEntity;
    context: AppContext;
    parent: PostEntity | ChallengeEntity;
  }): Promise<CommentEntity> {
    await this.feedService.createIfNotExists(
      toFeedId(FeedEntityType.LIKE_REACTIONS_ON_COMMENT, comment.id)
    );
    let newLike = false;
    await this.repo.repo.manager.transaction(async manager => {
      const feedRepo = manager.getRepository(FeedEntity);
      const likeFeed = await feedRepo.findOne(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_COMMENT, comment.id)
      );
      if (!likeFeed) throw new Error('[addLike] like feed not found');
      const result: TryAndPushItemToEntityResult =
        await this.feedService.tryAndPushEntry(likeFeed.id, currentUser.id, {
          repo: feedRepo,
        });
      newLike = result.didAddEntry;
      this.logger.info('[addLike] updatedCommentFeed', {
        didAddEntry: result.didAddEntry,
      });
      comment._stats.likeCount = (result.entity as FeedEntity).count;
      await manager.save(comment);
    });
    if (newLike) {
      await Promise.all([
        retryWithBackoff({
          fn: () =>
            this.notifyAuthorProducer.reactionOnComment({
              reactionType: ReactionType.LIKE,
              commentId: comment.id,
              subjectId: currentUser.id,
              timeStamp: new Date(),
            }),
          retryCount: 0,
          throwAfterFailedRetries: false,
          logFailure: (e: unknown) =>
            this.logger.error(
              '[addLike] notifyAboutMentionProducer failed ' + e,
              {
                commentId: comment.id,
                userId: currentUser.id,
              }
            ),
        }),
        retryWithBackoff({
          fn: () =>
            this.challengeInteractionService.updateChallengeInteractionsIfAuthor(
              {
                postOrChallenge: parent,
                currentUser,
                objectId: comment.id,
                interactionType: ChallengeInteractionEnum.COMMENTED,
                context,
              }
            ),
          retryCount: 1,
          throwAfterFailedRetries: false,
          logFailure: (e: unknown) =>
            this.logger.error(
              '[addLike] Error updating challenge interactions ' + e,
              {
                commentId: comment.id,
                userId: currentUser.id,
              }
            ),
        }),
      ]);
    }
    return comment;
  }

  /**
   * Remove a like from the comment's like reaction feed. Throws if any of the
   * ops fail.
   */
  async removeLike(
    commentEntity: CommentEntity,
    userEntity: UserEntity
  ): Promise<CommentEntity> {
    // Use transaction for lock on feed and comment
    await this.repo.repo.manager.transaction(async manager => {
      const feedRepo = manager.getRepository(FeedEntity);

      const { entity: updatedFeed, didRemoveEntry } =
        await this.feedService.removeEntry(
          toFeedId(FeedEntityType.LIKE_REACTIONS_ON_COMMENT, commentEntity.id),
          userEntity.id,
          {
            repo: feedRepo,
          }
        );

      this.logger.debug('[removeLike] updatedCommentFeed', { didRemoveEntry });

      commentEntity._stats.likeCount = updatedFeed.count;
      await manager.save(commentEntity);
    });

    return commentEntity;
  }

  /**
   * Retrieve user specific context of a comment such as if they have liked the
   * comment.
   */
  async getContext(commentId: string, userId: string): Promise<CommentContext> {
    const isLiked = await this.feedService.findIndex(
      toFeedId(FeedEntityType.LIKE_REACTIONS_ON_COMMENT, commentId),
      userId
    );
    return {
      liked: isLiked !== -1,
    };
  }

  @WildrExceptionDecorator()
  private checkFlaggingAccess(
    parentAuthorId: string,
    currentUser: UserEntity | undefined,
    parentType: CommentParentType
  ) {
    if (!currentUser)
      throw new ForbiddenException('You must be logged in to flag a comment');
    if (parentAuthorId !== currentUser.id) {
      throw new ForbiddenException(
        'You can only flag comments on your own ' +
          toCommentParentTypeStr(parentType)
      );
    }
    return currentUser;
  }

  @WildrExceptionDecorator()
  private removeFlag(
    comment: CommentEntity,
    currentUser: UserEntity
  ): CommentEntity {
    if (!comment.flagMeta) return comment;

    comment.flagMeta.flags = comment.flagMeta?.flags.filter(
      flag => flag.flaggedByUserId !== currentUser.id
    );

    return comment;
  }

  @WildrExceptionDecorator()
  private pushFlag(
    comment: CommentEntity,
    currentUser: UserEntity
  ): CommentEntity {
    if (!comment.flagMeta) {
      comment.flagMeta = {
        flags: [
          {
            flaggedByUserId: currentUser.id,
            flaggedAt: new Date(),
          },
        ],
      };
    } else {
      comment.flagMeta.flags.push({
        flaggedByUserId: currentUser.id,
        flaggedAt: new Date(),
      });
    }
    return comment;
  }

  getFlaggedCommentEntryId(comment: CommentEntity): string {
    return comment.authorId + ID_SEPARATOR + comment.id;
  }

  @WildrExceptionDecorator()
  async flagComment(
    flagCommentInput: FlagCommentInput,
    ctx: AppContext,
    currentUser?: UserEntity
  ) {
    const comment = await this.repo.findOne(flagCommentInput.commentId);
    if (!comment)
      throw new NotFoundException(`Sorry, comment not found`, {
        commentId: flagCommentInput.commentId,
      });
    let parentType: CommentParentType;
    if (comment.postId) {
      parentType = CommentParentType.POST;
    } else if (comment.challengeId) {
      parentType = CommentParentType.CHALLENGE;
    } else {
      return;
    }
    return await this.flagCommentCommon({
      flagCommentInput,
      ctx,
      currentUser,
      parentType,
    });
  }

  @WildrExceptionDecorator()
  async flagCommentCommon({
    flagCommentInput,
    ctx,
    currentUser,
    parentType,
  }: {
    flagCommentInput: FlagCommentInput;
    ctx: AppContext;
    currentUser?: UserEntity;
    parentType: CommentParentType;
  }): Promise<CommentEntity> {
    this.logger.info('[flagComment]', {
      flagCommentInput,
      currentUserId: currentUser?.id,
      parentType,
    });
    let comment: CommentEntityWithPost | CommentEntityWithChallenge;
    let parent: CommentParent;
    switch (parentType) {
      case CommentParentType.POST:
        comment = await this.findByIdWithPostOrFail(flagCommentInput.commentId);
        parent = comment.post;
        if (comment.postId) ctx.posts[comment.postId] = parent;
        break;
      case CommentParentType.CHALLENGE:
        comment = await this.findByIdWithChallengeOrFail(
          flagCommentInput.commentId
        );
        parent = comment.challenge;
        if (comment.challengeId) ctx.challenges[comment.challengeId] = parent;
        break;
    }
    const authorizedUser = this.checkFlaggingAccess(
      parent.authorId,
      currentUser,
      parentType
    );
    const updatedComment = await this.repo.repo.manager.transaction(
      async manager => {
        const commentRepo = manager.getRepository(CommentEntity);
        const entityTarget = parentEntityTargetOnCommentParentType(parentType);
        const repo: Repository<PostEntity | ChallengeEntity> =
          manager.getRepository(entityTarget);
        const comment = await this.repo.findOne(
          flagCommentInput.commentId,
          {
            lock: { mode: 'pessimistic_write' },
          },
          { repo: commentRepo }
        );
        if (!comment)
          throw new NotFoundException('Comment not found', {
            commentId: flagCommentInput.commentId,
          });
        const updates = [];
        if (flagCommentInput.operation === FlagOperationType.FLAG) {
          this.logger.info('[flagComment] flagging comment', {
            commentId: comment.id,
          });
          this.pushFlag(comment, authorizedUser);
          updates.push(
            this.feedService.tryUnshiftEntry(
              toFeedId(flaggedCommentsOnParentFeedType(parentType), parent.id),
              this.getFlaggedCommentEntryId(comment)
            )
          );
          if (!parent.stats.hasHiddenComments) {
            this.logger.info(
              '[flagComment] setting hasHiddenComments flag on parent',
              {
                parentId: parent.id,
              }
            );
            // Set a flag on parent to let us know that we should factor in hidden
            // comments when calculating the comment count to show the user.
            if (parent instanceof PostEntity) {
              updates.push(
                repo
                  .createQueryBuilder()
                  .update(parent)
                  .set({
                    _stats: () =>
                      // jsonb_set will not act upon empty columns so we use
                      // COALESCE to ensure that stats is at least an empty object
                      // before using jsonb_set
                      `jsonb_set(COALESCE(stats, '{}'), '{hasHiddenComments}', 'true'::jsonb, true)`,
                  })
                  .where('id = :id', { id: parent.id })
                  .execute()
              );
            } else if (parent instanceof ChallengeEntity) {
              updates.push(
                repo
                  .createQueryBuilder()
                  .update(parent)
                  .set({
                    stats: () =>
                      // jsonb_set will not act upon empty columns so we use
                      // COALESCE to ensure that stats is at least an empty object
                      // before using jsonb_set
                      `jsonb_set(COALESCE(stats, '{}'), '{hasHiddenComments}', 'true'::jsonb, true)`,
                  })
                  .where('id = :id', { id: parent.id })
                  .execute()
              );
            } else {
              const _: never = parent;
            }
          }
        } else if (flagCommentInput.operation === FlagOperationType.UN_FLAG) {
          this.logger.info('[flagComment] un-flagging comment', {
            commentId: comment.id,
          });
          this.removeFlag(comment, authorizedUser);
          updates.push(
            this.feedService.tryRemoveEntry(
              toFeedId(flaggedCommentsOnParentFeedType(parentType), parent.id),
              this.getFlaggedCommentEntryId(comment)
            )
          );
        }
        await Promise.all([
          ...updates,
          commentRepo.update(comment.id, { flagMeta: comment.flagMeta }),
        ]);
        if (comment.postId) this.requestReIndex(comment.postId);
        return comment;
      }
    );
    if (parent instanceof PostEntity) {
      updatedComment.post = parent;
    } else if (parent instanceof ChallengeEntity) {
      updatedComment.challenge = parent;
    }
    return updatedComment;
  }

  shouldHideFlaggedComment(
    comment: CommentEntity,
    currentUserId?: string
  ): boolean {
    if (comment.flagMeta?.flags.length) {
      return comment.authorId !== currentUserId;
    }
    return false;
  }

  /**
   * Filter out comments that have been flagged except for the comment author.
   */
  filterOutFlaggedComments(
    comments: CommentEntity[],
    currentUserId?: string
  ): CommentEntity[] {
    return comments.filter(
      c => !this.shouldHideFlaggedComment(c, currentUserId)
    );
  }

  /**
   * Get visible comment count for a post. This is the count of comments that
   * are either not flagged or are authored by the current user.
   */
  async getCommentCountForUser(
    parentId: string,
    parentType: CommentParentType = CommentParentType.POST,
    currentUser?: UserEntity
  ): Promise<number> {
    let commentFeedId: string;
    switch (parentType) {
      case CommentParentType.POST:
        commentFeedId = toFeedId(FeedEntityType.COMMENT, parentId);
        break;
      case CommentParentType.CHALLENGE:
        commentFeedId = getChallengeCommentsFeedId(parentId);
        break;
    }
    const [commentsFeed, flaggedFeed] = await Promise.all([
      this.feedService.find(commentFeedId),
      this.feedService.find(
        toFeedId(flaggedCommentsOnParentFeedType(parentType), parentId)
      ),
    ]);
    if (!commentsFeed) return 0;
    if (!flaggedFeed) return commentsFeed.count;
    if (!currentUser) return commentsFeed.count - flaggedFeed.count;
    const hiddenCommentCount = flaggedFeed.page.ids.reduce((acc, id) => {
      const [authorId, _] = id.split(ID_SEPARATOR);
      if (authorId !== currentUser.id) {
        acc++;
      }
      return acc;
    }, 0);
    return commentsFeed.count - hiddenCommentCount;
  }

  async requestReIndex(postId: string): Promise<void> {
    // TODO when comments are individually indexed swap this for a request to
    // request CommentEntity incremental index which will should trigger a
    // re-index of the post.
    return retryWithBackoff({
      fn: () =>
        this.incrementalIndexStateWorker.requestIncrementalIndex({
          entityName: 'PostEntity',
          entityId: postId,
        }),
      retryCount: 3,
      throwAfterFailedRetries: false,
      logFailure: error =>
        this.logger.error('Failed to create re-index job' + error, {
          postId,
        }),
    });
  }

  private paginateCommentsPredicate({
    commentVisibilityAccessData,
    authorId,
    currentUserIsAuthor,
    currentUserId,
  }: {
    commentVisibilityAccessData?: CommentVisibilityAccessData;
    authorId: string;
    currentUserIsAuthor?: boolean;
    currentUserId?: string;
  }): FilterPaginateEntriesPredicate | undefined {
    if (!commentVisibilityAccessData) return;
    this.logger.info('commentVisibilityAccessData', {
      commentVisibilityAccessData,
    });
    if (commentVisibilityAccessData.access === CommentVisibilityAccess.AUTHOR) {
      if (currentUserIsAuthor) {
        this.logger.info('isAuthor, no need of predicates', {});
        return;
      }
      if (currentUserId) {
        this.logger.info('is not author, but is logged in', {});
        return (commentId: string) =>
          commentId.startsWith(currentUserId!) ||
          commentId.startsWith(authorId);
      }
      return (commentId: string) => commentId.startsWith(authorId);
    }
  }

  async paginateComments({
    commentVisibilityAccessData,
    authorId,
    currentUserIsAuthor,
    currentUserId,
    paginationInput,
    feedId,
    targetCommentId,
    parentType,
  }: {
    commentVisibilityAccessData?: CommentVisibilityAccessData;
    authorId: string;
    currentUserIsAuthor?: boolean;
    currentUserId?: string;
    paginationInput: PaginationInput;
    feedId: string;
    targetCommentId?: string;
    parentType: CommentParentType;
  }): Promise<PaginateCommentsResult> {
    const paginateCommentsPredicate = this.paginateCommentsPredicate({
      commentVisibilityAccessData,
      authorId,
      currentUserIsAuthor,
      currentUserId,
    });
    const response = await this.feedService.paginateEntries(
      feedId,
      paginationInput,
      paginateCommentsPredicate,
      parentType == CommentParentType.POST
    );
    const commentIds = response.ids.map(idWithAuthorId => {
      const list = idWithAuthorId.split(ID_SEPARATOR);
      if (list.length > 1) return list[1];
      return idWithAuthorId;
    });
    const comments = await this.findByIds(commentIds, {
      withAuthor: true,
    });
    const isTargetCommentDeleted = !!targetCommentId
      ? !comments.find(comment => comment.id === targetCommentId)
      : false;
    const filteredComments = this.filterOutFlaggedComments(
      comments,
      currentUserId
    );
    const isTargetFlagged = !!targetCommentId
      ? !filteredComments.find(comment => comment.id === targetCommentId)
      : false;
    let targetCommentError: string | undefined;
    if (isTargetCommentDeleted) {
      targetCommentError = 'Comment has been deleted';
    } else if (isTargetFlagged) {
      targetCommentError = 'Comment has been flagged';
    }
    return {
      comments: filteredComments,
      hasPreviousPage: response.hasPreviousItems,
      hasNextPage: response.hasMoreItems,
      targetCommentError,
    };
  }

  @WildrExceptionDecorator()
  async userIsBlockedFromCommenting({
    parentId,
    userId,
    parentType,
  }: {
    parentId: string;
    userId: string;
    parentType: CommentParentType;
  }): Promise<boolean> {
    const feed = await this.feedService.find(
      toFeedId(
        parentType === CommentParentType.CHALLENGE
          ? FeedEntityType.BLOCKED_COMMENTERS_ON_CHALLENGE
          : FeedEntityType.BLOCKED_COMMENTERS_ON_POST,
        parentId
      )
    );
    if (!feed) return false;
    return feed.hasEntry(userId);
  }

  /**
   * @deprecated use accessControlService checkMessagePostingAccess
   */
  async cannotCommentErrorMessage({
    userId,
    parentId,
    parentAuthor,
    parentAuthorId,
    parentType,
    checkForHasBlocked,
    commentPostingAccessData,
  }: {
    userId?: string;
    parentId: string;
    parentAuthor?: UserEntity;
    parentAuthorId: string;
    parentType: CommentParentType;
    checkForHasBlocked?: boolean;
    commentPostingAccessData: CommentPostingAccessData;
  }) {
    this.logger.info('cannotCommentErrorMessage', {
      userId,
      parentId,
      parentAuthorId,
      parentType,
      checkForHasBlocked,
      commentPostingAccessData,
    });
    if (!userId) return 'Login first';
    parentAuthor ??= await this.userService.findById(parentAuthorId);
    if (!parentAuthor) {
      this.logger.info('ParentAuthor not found', { parentAuthorId });
      return kSomethingWentWrong;
    }
    if (checkForHasBlocked) {
      const hasBlocked = await this.userService.hasBlocked({
        userWhoBlocked: parentAuthor,
        userIdToCheck: userId,
      });
      if (hasBlocked) {
        this.logger.warn(
          `A blocked user was able to access the comments page for this ${parentType}`,
          {
            parentId,
            blockedUser: userId,
            warnCode: kBlockedUserAbleToViewContentCode,
          }
        );
        return kSomethingWentWrong;
      }
    }
    const blockedFromCommenting = await this.userIsBlockedFromCommenting({
      parentId,
      userId,
      parentType,
    });
    if (blockedFromCommenting) {
      return (
        'The creator of this ' +
        toCommentParentTypeStr(parentType) +
        ' has blocked you from commenting'
      );
    }
    switch (commentPostingAccessData.access) {
      case CommentPostingAccess.NONE:
        return 'Comments are disabled on this post';
      case CommentPostingAccess.EVERYONE:
        return;
      case CommentPostingAccess.FOLLOWERS:
        if (userId === parentAuthorId) return;
        const userIndex = await this.feedService.findIndex(
          parentAuthor.followerFeedId ?? '',
          userId
        );
        if (userIndex === -1) {
          return 'Only the followers can add a comment';
        }
        return;
      case CommentPostingAccess.INNER_CIRCLE:
        if (userId === parentAuthorId) return;
        const index = await this.userListService.findIndex(
          innerCircleListId(parentAuthorId),
          userId
        );
        if (index === -1) {
          return 'Only inner circle can comment on this post';
        }
        return;
      case CommentPostingAccess.LIST:
        return;
    }
  }

  /**
   * @deprecated use access control service checkVisibilityAccessForMessage
   */
  async canViewCommentsStatusAndMessage({
    userId,
    parentId,
    parentAuthor,
    parentAuthorId,
    checkForBlock,
    commentVisibilityAccessData,
    messageParentType,
  }: {
    userId?: string;
    parentId: string;
    parentAuthor?: UserEntity;
    parentAuthorId: string;
    checkForBlock?: boolean;
    commentVisibilityAccessData: CommentVisibilityAccessData;
    messageParentType: MessageParentType;
  }): Promise<CanViewCommentsResult> {
    const somethingWentWrongError = {
      errorMessage: kSomethingWentWrong,
      canViewComments: false,
    };
    parentAuthor ??= await this.userService.findById(parentAuthorId);
    if (!parentAuthor) {
      this.logger.info('ParentAuthor not found', { parentAuthorId });
      return somethingWentWrongError;
    }
    if (userId && checkForBlock) {
      const hasBlocked = await this.userService.hasBlocked({
        userWhoBlocked: parentAuthor,
        userIdToCheck: userId,
      });
      if (hasBlocked) {
        this.logger.warn(
          'A blocked user was able to access the comments page for this post',
          {
            parentId: parentId,
            blockedUser: userId,
            warnCode: kBlockedUserAbleToViewContentCode,
          }
        );
        return { errorMessage: kSomethingWentWrong, canViewComments: false };
      }
    }
    switch (commentVisibilityAccessData.access) {
      case CommentVisibilityAccess.AUTHOR:
        if (userId === parentAuthorId) {
          return {
            errorMessage: `Comments on this post are only visible to you.`,
            canViewComments: true,
          };
        } else {
          return {
            errorMessage: 'Comments will only be visible to the author.',
            infoMessage:
              `The author has chosen to restrict comments on this` +
              ` ${messageParentType} so that the only comments visible to you` +
              ` are those of the creators' and your own. The creator is able` +
              ` to view all comments made by others on this ${messageParentType}.`,
            // Allow access so that the user can see their own comments. Other
            // comments will be filtered out during pagination.
            canViewComments: true,
          };
        }
      case CommentVisibilityAccess.EVERYONE:
        return { canViewComments: true };
      case CommentVisibilityAccess.FOLLOWERS:
        if (userId === parentAuthorId) return { canViewComments: true };
        const followerIndex = userId
          ? await this.feedService.findIndex(
              parentAuthor.followerFeedId ?? '',
              userId
            )
          : -1;
        if (followerIndex === -1)
          return {
            errorMessage: `Only the author's followers can view the comments on this post.`,
            canViewComments: false,
          };
        break;
      case CommentVisibilityAccess.INNER_CIRCLE:
        if (userId === parentAuthorId) return { canViewComments: true };
        const innerCircleMemberIndex = userId
          ? await this.userListService.findIndex(
              innerCircleListId(parentAuthorId),
              userId
            )
          : -1;
        if (innerCircleMemberIndex === -1) {
          return {
            errorMessage: `Only the author's inner circle can view the comments`,
            canViewComments: false,
          };
        }
        break;
      case CommentVisibilityAccess.LIST:
        return somethingWentWrongError;
    }
    return { canViewComments: true };
  }

  /**
   * @throws CannotCommentError; checks for cannotCommentErrorMessage()
   */
  async addComment({
    input,
    currentUser,
    parentId,
    parentAuthor,
    parentType,
    commentPostingAccessData,
  }: {
    input: AddCommentInput;
    currentUser: UserEntity;
    parentId: string;
    parentAuthor: UserEntity;
    parentType: CommentParentType;
    commentPostingAccessData: CommentPostingAccessData;
  }): Promise<CommentEntity> {
    const context = {
      postId: input.postId,
      challengeId: input.challengeId,
      userId: currentUser.id,
      participationType: input.participationType,
      parentId,
      parentType,
      methodName: 'addComment',
    };
    this.logger.info('Adding a comment to post', context);
    const isSuspended = this.userService.isSuspended(currentUser);
    if (isSuspended)
      throw new CannotCommentError('Suspended user can not comment');
    const cannotCommentErrorMessage = await this.cannotCommentErrorMessage({
      userId: currentUser.id,
      parentId,
      parentAuthor,
      parentAuthorId: parentAuthor.id,
      parentType,
      commentPostingAccessData: commentPostingAccessData,
      checkForHasBlocked: true,
    });
    if (cannotCommentErrorMessage)
      throw new CannotCommentError(cannotCommentErrorMessage);
    const bodyStrArr: string[] = [];
    const content = await this.contentService.getContentIO(
      input.content,
      bodyStrArr
    );
    const body = bodyStrArr.join(' ');
    if (!input.shouldBypassTrollDetection) {
      const result: string | undefined = await this.tdService.detect(body);
      if (result) {
        this.logger.info('Trolling detected for comment', context);
        throw new TrollingDetectedError(
          'Trolling detected for comment',
          result
        );
      }
    } else {
      this.logger.warn('Bypassing troll detection', context);
    }
    return await this.create({
      currentUser,
      parentId,
      content,
      body,
      negativeConfidenceValue: input.negativeConfidenceCount,
      parentType,
    });
  }

  async notifyUsersMentionedInComment({
    commentOrId,
  }: {
    commentOrId: CommentEntity | string;
  }): Promise<
    Result<
      {
        notifiedUsers: Set<string>;
      },
      NotFoundException | InternalServerErrorException
    >
  > {
    try {
      const notifiedUsers = new Set<string>();
      const comment =
        typeof commentOrId === 'string'
          ? await this.findById(commentOrId)
          : commentOrId;
      if (!comment)
        return err(
          new NotFoundException(kSomethingWentWrong, {
            methodName: 'notifyUsersMentionedInComment',
            exceptionCode: NotFoundExceptionCodes.COMMENT_NOT_FOUND,
            commentId: commentOrId,
          })
        );
      for (const { segment } of comment.content.segments) {
        if (
          segment.type === 'UserSegmentIO' &&
          segment.id !== comment.authorId
        ) {
          notifiedUsers.add(segment.id);
        }
      }
      const tasks = [];
      for (const mentionedUser of notifiedUsers) {
        tasks.push(
          this.notifyAboutMentionProducer.mentionedInComment({
            objectId: mentionedUser,
            commentId: comment.id,
          })
        );
      }
      await Promise.all(tasks);
      return ok({ notifiedUsers });
    } catch (error) {
      if (error instanceof NotFoundException) return err(error);
      return err(
        new InternalServerErrorException(
          'Error notifying users mentioned in comment: ' + error,
          {
            commentOrId,
            methodName: 'notifyUsersMentionedInComment',
          },
          error
        )
      );
    }
  }
}

export interface PaginateCommentsResult {
  comments: CommentEntity[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  targetCommentError?: string;
}

export enum CommentParentType {
  POST = 1,
  CHALLENGE = 2,
}

export const toCommentParentTypeStr = (type: CommentParentType): string => {
  switch (type) {
    case CommentParentType.POST:
      return 'post';
    case CommentParentType.CHALLENGE:
      return 'challenge';
  }
};

export const flaggedCommentsOnParentFeedType = (
  type: CommentParentType
): FeedEntityType => {
  switch (type) {
    case CommentParentType.POST:
      return FeedEntityType.FLAGGED_COMMENTS_ON_POST;
    case CommentParentType.CHALLENGE:
      return FeedEntityType.FLAGGED_COMMENTS_ON_CHALLENGE;
  }
};

export const parentEntityTargetOnCommentParentType = (
  type: CommentParentType
): EntityTarget<PostEntity | ChallengeEntity> => {
  switch (type) {
    case CommentParentType.POST:
      return PostEntity;
    case CommentParentType.CHALLENGE:
      return ChallengeEntity;
  }
};

export type CommentParent = PostEntity | ChallengeEntity;
