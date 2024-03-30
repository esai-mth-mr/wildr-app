import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  EntityManager,
  FindConditions,
  FindOneOptions,
  ObjectID,
  UpdateResult,
} from 'typeorm';
import { Logger } from 'winston';
import { CommentEntity } from '../comment/comment.entity';
import { generateId } from '@verdzie/server/common/generateId';
import { ContentIO } from '../content/content.io';
import { preserveOrderByIds } from '../data/common';
import { FeedService, toFeedId } from '../feed/feed.service';
import { AddReplyInput, ReactionType, Reply, ReportType } from '../graphql';
import { ReplyContext } from '@verdzie/server/generated-graphql';
import { ReportObjectTypeEnum } from '../report/report.entity';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { ReportProducer } from '../worker/report/report.producer';
import {
  ReplyEntity,
  ReplyEntityWithAuthor,
  ReplyEntityWithCommentAndAuthor,
  ReplyEntityWithParentComment,
} from './reply.entity';
import {
  BadRequestException,
  BadRequestExceptionCodes,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  NotFoundExceptionCodes,
  WildrException,
} from '@verdzie/server/exceptions/wildr.exception';
import { ReplyRepository } from '@verdzie/server/reply/reply.repository';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { NotifyAuthorProducer } from '@verdzie/server/worker/notify-author/notifyAuthor.producer';
import { PaginationInput } from '@verdzie/server/generated-graphql';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { AccessControlService } from '@verdzie/server/access-control/access-control.service';
import { TryAndPushItemToEntityResult } from '../entities-with-pages-common/entitiesWithPages.common';
import { WildrExceptionDecorator } from '../common/wildr-exception.decorator';
import {
  kBlockedUserAbleToViewContentCode,
  kSomethingWentWrong,
} from '../../constants';
import { Result, err, ok } from 'neverthrow';
import { AppContext, retryWithBackoff } from '@verdzie/server/common';
import { retryResultWithBackoff } from '../common/retry-result-with-backoff';
import { CommentRepository } from '@verdzie/server/comment/comment.repository';
import { ContentService } from '@verdzie/server/content/content.service';
import { TrollDetectorService } from '@verdzie/server/troll-detector/troll-detector.service';
import { withSerializationRetries } from '@verdzie/server/common/with-serialization-retries';
import {
  ChallengeInteractionEnum,
  ChallengeInteractionService,
} from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.service';
import { NotifyAboutMentionProducer } from '@verdzie/server/worker/notify-about-mention/notifyAboutMention.producer';
import { OSIncrementalIndexStateProducer } from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.producer';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';

@Injectable()
export class ReplyService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private repo: ReplyRepository,
    private feedService: FeedService,
    private userService: UserService,
    private reportWorker: ReportProducer,
    private notifyAuthorProducer: NotifyAuthorProducer,
    private accessControlService: AccessControlService,
    private commentRepository: CommentRepository,
    private contentService: ContentService,
    private trollDetectionService: TrollDetectorService,
    private challengeInteractionService: ChallengeInteractionService,
    private notifyAboutMentionProducer: NotifyAboutMentionProducer,
    private incrementalIndexStateProducer: OSIncrementalIndexStateProducer
  ) {
    this.logger = logger.child({ context: ReplyService.name });
  }

  public toReplyObject(reply: ReplyEntity): Reply {
    return {
      __typename: 'Reply',
      id: reply.id,
      ts: {
        __typename: 'Timestamps',
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      },
      author: reply.author
        ? this.userService.toUserObject({ user: reply.author })
        : undefined,
      replyStats: {
        __typename: 'ReplyStats',
        ...reply.stats,
      },
    };
  }

  public async findById(
    id: string,
    findOptions?: FindOneOptions<ReplyEntity>
  ): Promise<ReplyEntity | undefined> {
    return this.repo.findOne(id, findOptions);
  }

  async findByIdWithAuthorAndParentComment(
    id: string
  ): Promise<ReplyEntityWithCommentAndAuthor | undefined> {
    return this.repo.findOne(id, {
      relations: [ReplyEntity.kAuthorRelation, ReplyEntity.kCommentRelation],
    }) as Promise<ReplyEntityWithCommentAndAuthor>;
  }

  async findByIdWithAuthor(
    id: string
  ): Promise<ReplyEntityWithAuthor | undefined> {
    return this.repo.findOne(id, {
      relations: [ReplyEntity.kAuthorRelation],
    }) as Promise<ReplyEntityWithCommentAndAuthor>;
  }

  public async findByIdWithCommentRelation(
    id: string
  ): Promise<ReplyEntityWithParentComment | undefined> {
    return this.repo.findOne(id, {
      relations: [ReplyEntity.kCommentRelation],
    }) as Promise<ReplyEntityWithParentComment>;
  }

  async findByIdIncludingSoftDelete(
    id: string
  ): Promise<ReplyEntity | undefined> {
    return this.repo.findOneIncludingSoftDelete(id);
  }

  public async findByIds(
    ids: string[],
    relations?: string[]
  ): Promise<ReplyEntity[]> {
    if (!relations) relations = [];
    return preserveOrderByIds(
      ids,
      await this.repo.findByIds(ids, {
        relations: [ReplyEntity.kAuthorRelation, ...relations],
      })
    );
  }

  async findByIdWithCommentParent({
    replyId,
    findOptions,
  }: {
    replyId: string;
    findOptions?: FindOneOptions;
  }): Promise<{
    comment: CommentEntity;
    reply: ReplyEntity;
    parent: PostEntity | ChallengeEntity;
  }> {
    const relations = new Set([
      ReplyEntity.kCommentRelation,
      `${ReplyEntity.kCommentRelation}.${CommentEntity.kPostRelation}`,
      `${ReplyEntity.kCommentRelation}.${CommentEntity.kChallengeRelation}`,
      ...(findOptions?.relations ?? []),
    ]);
    const reply = await this.repo.findOne(replyId, {
      ...(findOptions && { findOptions }),
      relations: [...relations],
    });
    if (!reply) {
      throw new NotFoundException(`Sorry, reply not found`, { replyId });
    }
    const comment = reply.comment;
    if (!comment) {
      throw new NotFoundException(`Sorry, comment not found`, { replyId });
    }
    if (comment.post) {
      return {
        reply,
        comment,
        parent: comment.post,
      };
    } else if (comment.challenge) {
      return {
        reply,
        comment,
        parent: comment.challenge,
      };
    }
    if (comment.postId && !comment.post) {
      throw new NotFoundException(`Sorry, comment's post not found`, {
        replyId,
        commentId: comment.id,
      });
    }
    if (comment.challengeId && !comment.challenge) {
      throw new NotFoundException(`Sorry, comment's challenge not found`, {
        replyId,
        commentId: comment.id,
      });
    }
    throw new InternalServerErrorException(`Comment parent not found`, {
      commentId: comment.id,
      replyId,
    });
  }

  async create(
    currentUser: UserEntity,
    comment: CommentEntity,
    content: ContentIO,
    body: string,
    negativeConfidenceValue?: number
  ): Promise<ReplyEntity> {
    const reply: ReplyEntity = new ReplyEntity();
    reply.id = generateId();
    reply.authorId = currentUser.id;
    reply.author = currentUser;
    reply.content = content;
    reply.body = body;
    reply.comment = comment;
    reply.negativeConfidenceValue = negativeConfidenceValue;
    await this.repo.save(reply);
    reply.comment = comment;
    return reply;
  }

  build({
    authorOrId,
    content,
    body,
    negativeConfidenceValue,
    comment,
  }: {
    authorOrId: UserEntity | string;
    content: ContentIO;
    body: string;
    comment: CommentEntity;
    negativeConfidenceValue?: number;
  }) {
    const reply: ReplyEntity = new ReplyEntity();
    reply.id = generateId();
    reply.authorId =
      typeof authorOrId === 'string' ? authorOrId : authorOrId.id;
    reply.author = typeof authorOrId === 'string' ? undefined : authorOrId;
    reply.content = content;
    reply.body = body;
    reply.negativeConfidenceValue = negativeConfidenceValue;
    reply.comment = comment;
    return reply;
  }

  async save(reply: ReplyEntity): Promise<ReplyEntity> {
    return this.repo.save(reply);
  }

  async softDelete(
    replyId: string
  ): Promise<[ReplyEntityWithParentComment | undefined, string]> {
    const reply = (await this.repo.findOneIncludingSoftDelete(replyId, {
      relations: ['comment'],
    })) as ReplyEntityWithParentComment;
    if (!reply) return [undefined, 'Sorry, comment not found'];
    if (reply.willBeDeleted) return [reply, ''];
    await this.repo.update(replyId, { willBeDeleted: true });
    return [reply, ''];
  }

  @WildrExceptionDecorator()
  async findOneWithVisibilityCheck(
    replyId: string,
    currentUser?: UserEntity,
    findOptions?: FindOneOptions<ReplyEntity>
  ): Promise<{
    reply: ReplyEntity;
    comment: CommentEntity;
    parent: ChallengeEntity | PostEntity;
  }> {
    const { reply, comment, parent } = await this.findByIdWithCommentParent({
      replyId,
      findOptions,
    });
    await this.accessControlService.checkMessageVisibilityAccess({
      object: parent,
      currentUser,
      messageType: 'reply',
      parentType: parent instanceof PostEntity ? 'post' : 'challenge',
      message: reply,
    });
    return { reply, comment, parent };
  }

  async report(
    replyId: string,
    reportType: ReportType,
    currentUser?: UserEntity
  ): Promise<ReplyEntity | string> {
    if (!currentUser) {
      const reply = await this.findById(replyId);
      if (!reply) {
        this.logger.error('[reply.service] Couldnt not find reply obj');
        return 'Sorry, reply not found!';
      }
      if (reportType === ReportType.UNREPORT) {
        return 'You must log in first.';
      }
      reply?.incrementReportCount();
      await Promise.all([this.repo.save(reply)]);
      this.reportWorker.createReport({
        objectAuthorId: reply.authorId,
        objectType: ReportObjectTypeEnum.REPLY,
        objectId: replyId,
        reporterId: '',
        reportType,
        reporterComment: '',
      });
      return reply;
    }

    const reportReplyFeed = await this.feedService.find(
      currentUser.reportReplyFeedId ?? ''
    );
    if (!reportReplyFeed) {
      this.logger.error(
        "[reply.service] Current user's ReportReplyFeed not found",
        {
          userId: currentUser.id,
        }
      );
      return 'Something went wrong';
    }
    const reply = await this.repo.findOne(replyId, {
      relations: [ReplyEntity.kAuthorRelation],
    });
    if (!reply) {
      this.logger.error(
        `[reply.service] Couldnt not find Reply obj for id '${replyId}'`
      );
      return 'No reply found!';
    }
    if (reportType === ReportType.UNREPORT) {
      if (reportReplyFeed.hasEntry(reply.id)) {
        reply.decrementReportCount();
        await Promise.all([
          this.feedService.tryRemoveEntry(reportReplyFeed, reply.id),
          this.repo.save(reply),
        ]);
      } else {
        return 'This reply has already been unreported by you!';
      }
    } else {
      if (reportReplyFeed.hasEntry(reply.id)) {
        return 'You cannot report this reply again!';
      } else {
        reply.incrementReportCount();
        await Promise.all([
          this.feedService.tryUnshiftEntry(reportReplyFeed, reply.id),
          this.repo.save(reply),
        ]);
        this.reportWorker.createReport({
          objectAuthorId: reply.authorId,
          objectType: ReportObjectTypeEnum.REPLY,
          objectId: replyId,
          reporterId: currentUser.id,
          reportType,
          reporterComment: '',
        });
      }
    }
    return reply;
  }

  async deleteInTransaction(replyIds: string[]): Promise<boolean | undefined> {
    return await this.repo.repo.manager.transaction<boolean>(
      async (em: EntityManager) => {
        try {
          await em.getRepository('reply_entity').delete(replyIds);
          return true;
        } catch (err) {
          this.logger.debug(err);
          return false;
        }
      }
    );
  }

  async findWithConditions(
    where?: FindConditions<ReplyEntity>,
    shouldIncludeDeletedPosts = false
  ): Promise<ReplyEntity[]> {
    return await this.repo.find(where, shouldIncludeDeletedPosts);
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
      | FindConditions<ReplyEntity>,
    partialEntity: QueryDeepPartialEntity<ReplyEntity>
  ): Promise<UpdateResult> {
    return this.repo.update(criteria, partialEntity);
  }

  async takeDown(replyOrId: string | CommentEntity): Promise<boolean> {
    const replyId = typeof replyOrId === 'string' ? replyOrId : replyOrId.id;
    const result = await this.update(replyId, {
      state: ExistenceState.TAKEN_DOWN,
    });
    this.logger.info('takeDown', { result });
    return result.affected !== undefined;
  }

  async respawn(replyOrId: string | PostEntity): Promise<boolean> {
    const replyId = typeof replyOrId === 'string' ? replyOrId : replyOrId.id;
    const result = await this.update(replyId, { state: undefined });
    this.logger.info('respawn', { result });
    return result.affected !== undefined;
  }

  @WildrExceptionDecorator()
  async authorizeReplyReaction(
    replyId: string,
    currentUser?: UserEntity
  ): Promise<{
    reply: ReplyEntity;
    authorizedUser: UserEntity;
    comment: CommentEntity;
    parent: PostEntity | ChallengeEntity;
  }> {
    const { reply, comment, parent } = await this.findByIdWithCommentParent({
      replyId,
    });
    const authorizedUser =
      await this.accessControlService.checkMessageReactionAccess({
        object: parent,
        currentUser,
        parentType: parent instanceof PostEntity ? 'post' : 'challenge',
        messageType: 'reply',
      });
    return { reply, authorizedUser, comment, parent };
  }

  @WildrExceptionDecorator()
  async reactOnReply({
    replyId,
    reactionType,
    context,
    currentUser,
  }: {
    replyId: string;
    reactionType: ReactionType;
    context: AppContext;
    currentUser?: UserEntity;
  }): Promise<ReplyEntity> {
    const { reply, authorizedUser, comment, parent } =
      await this.authorizeReplyReaction(replyId, currentUser);
    if (currentUser) {
      const hasBlocked = await this.userService.hasBlocked({
        userWhoBlockedId: comment.authorId,
        userIdToCheck: currentUser.id,
      });
      if (hasBlocked) {
        this.logger.warn('A blocked user was able to view this post', {
          replyId,
          blockedUser: currentUser.id,
          warnCode: kBlockedUserAbleToViewContentCode,
        });
        throw new ForbiddenException(kSomethingWentWrong);
      }
    }
    if (reactionType === ReactionType.LIKE) {
      const { reply: resultingReply } = await this.addLike({
        reply,
        comment,
        currentUser: authorizedUser,
        parent,
        context,
      });
      return resultingReply;
    } else if (reactionType === ReactionType.UN_LIKE) {
      return await this.removeLike(reply, authorizedUser);
    } else {
      throw new BadRequestException('Reaction type not implemented', {
        replyId,
        reactionType,
      });
    }
  }

  /**
   * Adds a like to the reply's like reaction feed. Throws if the reply is
   * not found or any ops fail.
   */
  @WildrExceptionDecorator()
  async addLike({
    reply,
    comment,
    currentUser,
    parent,
    context,
  }: {
    reply: ReplyEntity;
    comment: CommentEntity;
    currentUser: UserEntity;
    parent: PostEntity | ChallengeEntity;
    context: AppContext;
  }): Promise<{ reply: ReplyEntity; comment: CommentEntity }> {
    await this.feedService.createIfNotExists(
      toFeedId(FeedEntityType.LIKE_REACTIONS_ON_REPLY, reply.id)
    );
    // Use transaction for lock on feed and reply
    let newLike = false;
    await this.repo.repo.manager.transaction(async manager => {
      const feedRepo = manager.getRepository(FeedEntity);
      const likeFeed = await feedRepo.findOne(
        toFeedId(FeedEntityType.LIKE_REACTIONS_ON_REPLY, reply.id)
      );
      if (!likeFeed)
        throw new NotFoundException('[addLike] Like feed not found', {
          replyId: reply.id,
        });
      const result: TryAndPushItemToEntityResult =
        await this.feedService.tryAndPushEntry(likeFeed.id, currentUser.id, {
          repo: feedRepo,
        });
      newLike = result.didAddEntry;
      this.logger.info('[addLike] updatedLikeFeed', {
        replyId: reply.id,
        didAddEntry: result.didAddEntry,
      });
      reply._stats.likeCount = (result.entity as FeedEntity).count;
      await manager.save(reply);
    });
    // Don't notify if we receive a like request when the user has already
    // liked the reply.
    if (newLike) {
      await Promise.all([
        retryWithBackoff({
          fn: () =>
            this.notifyAuthorProducer.reactionOnReply({
              reactionType: ReactionType.LIKE,
              commentId: comment.id,
              replyId: reply.id,
              subjectId: currentUser.id,
              timeStamp: new Date(),
            }),
          retryCount: 1,
          throwAfterFailedRetries: false,
          logFailure: (e: unknown) =>
            this.logger.error(
              '[addLike] Error creating author notification job ' + e,
              {
                replyId: reply.id,
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
                objectId: reply.id,
                interactionType: ChallengeInteractionEnum.REPLIED,
                context,
              }
            ),
          retryCount: 1,
          throwAfterFailedRetries: false,
          logFailure: (e: unknown) =>
            this.logger.error(
              '[addLike] Error updating challenge interactions ' + e,
              {
                replyId: reply.id,
                userId: currentUser.id,
              }
            ),
        }),
      ]);
    }
    return { reply, comment };
  }

  /**
   * Remove a like from the reply's like reaction feed. Throws if any of the
   * ops fail.
   */
  @WildrExceptionDecorator()
  async removeLike(
    replyEntity: ReplyEntity,
    userEntity: UserEntity
  ): Promise<ReplyEntity> {
    // Use transaction for lock on feed and reply
    await this.repo.repo.manager.transaction(async manager => {
      const feedRepo = manager.getRepository(FeedEntity);
      // Remove the entry from the paginated like feed
      const { entity: updatedFeed, didRemoveEntry } =
        await this.feedService.removeEntry(
          toFeedId(FeedEntityType.LIKE_REACTIONS_ON_REPLY, replyEntity.id),
          userEntity.id,
          {
            repo: feedRepo,
          }
        );
      this.logger.debug('[removeLike] updatedFeed', { didRemoveEntry });
      replyEntity._stats.likeCount = updatedFeed.count;
      await manager.save(replyEntity);
    });
    return replyEntity;
  }

  /**
   * Retrieve user specific context of a reply such as if they have liked the
   * reply.
   */
  async getContext(replyId: string, userId: string): Promise<ReplyContext> {
    const isLiked = await this.feedService.findIndex(
      toFeedId(FeedEntityType.LIKE_REACTIONS_ON_REPLY, replyId),
      userId
    );

    return {
      liked: isLiked !== -1,
    };
  }

  async getReactions(
    replyOrId: ReplyEntity | string,
    reactionType: ReactionType,
    paginationInput: PaginationInput
  ) {
    const reply =
      typeof replyOrId === 'string'
        ? await this.repo.findOne(replyOrId)
        : replyOrId;
    if (!reply) return;
    let feed: FeedEntity | undefined;
    switch (reactionType) {
      case ReactionType.LIKE:
        feed = await this.feedService.find(
          toFeedId(FeedEntityType.LIKE_REACTIONS_ON_REPLY, reply.id)
        );
        break;
      default:
        this.logger.warn('[getReactions] unsupported reaction type', {
          replyId: reply.id,
          reactionType,
        });
        return;
    }
    if (!feed) {
      this.logger.error('[getReactions] cannot find reaction feed', {
        replyId: reply.id,
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

  async addReply({
    currentUser,
    input,
    context,
  }: {
    currentUser: UserEntity;
    input: AddReplyInput;
    context: AppContext;
  }): Promise<
    Result<
      { reply: ReplyEntity; comment: CommentEntity },
      | NotFoundException
      | ForbiddenException
      | BadRequestException
      | InternalServerErrorException
    >
  > {
    try {
      const comment = await this.commentRepository.findOne(input.commentId, {
        relations: [
          CommentEntity.kPostRelation,
          CommentEntity.kChallengeRelation,
        ],
      });
      if (!comment)
        return err(
          new NotFoundException(kSomethingWentWrong, {
            commentId: input.commentId,
            userId: currentUser.id,
            exceptionCode: NotFoundExceptionCodes.COMMENT_NOT_FOUND,
          })
        );
      context.comments[comment.id] = comment;
      const parent = comment.post || comment.challenge;
      if (!parent)
        return err(
          new NotFoundException(kSomethingWentWrong, {
            commentId: input.commentId,
            userId: currentUser.id,
            exceptionCode: comment.challengeId
              ? NotFoundExceptionCodes.CHALLENGE_NOT_FOUND
              : NotFoundExceptionCodes.POST_NOT_FOUND,
          })
        );
      if (parent instanceof PostEntity) {
        context.posts[parent.id] = parent;
      } else {
        context.challenges[parent.id] = parent;
      }
      const [checkMessagePostingAccessResponse, checkReplyAccessResponse] =
        await Promise.all([
          this.accessControlService.checkMessagePostingAccess({
            currentUser,
            parent,
            messageType: 'reply',
            parentType: parent instanceof PostEntity ? 'post' : 'challenge',
          }),
          this.accessControlService.checkReplyAccess({
            commentOrId: comment,
            currentUser,
          }),
        ]);
      if (checkMessagePostingAccessResponse.isErr())
        return err(checkMessagePostingAccessResponse.error);
      if (checkReplyAccessResponse.isErr())
        return err(checkReplyAccessResponse.error);
      const bodyStringArray: string[] = [];
      const content = await this.contentService.getContentIO(
        input.content,
        bodyStringArray
      );
      const body = bodyStringArray.join(' ');
      if (!input.shouldBypassTrollDetection) {
        const result: string | undefined =
          await this.trollDetectionService.detect(body);
        if (result)
          return err(
            new BadRequestException(result, {
              exceptionCode: BadRequestExceptionCodes.TROLL_DETECTED_IN_REPLY,
              commentId: comment.id,
              userId: currentUser.id,
            })
          );
      }
      const reply = this.build({
        authorOrId: currentUser,
        comment: comment,
        content,
        body,
        negativeConfidenceValue: input.negativeConfidenceCount,
      });
      await withSerializationRetries(
        () =>
          this.repo.repo.manager.transaction(async manager => {
            const feedRepo = manager.getRepository(FeedEntity);
            const replyRepo = manager.getRepository(ReplyEntity);
            const [commentReplyFeed] = await Promise.all([
              this.feedService.tryUnshiftEntry(
                toFeedId(FeedEntityType.REPLY, comment.id),
                reply.id,
                feedRepo
              ),
              replyRepo.insert(reply),
            ]);
            const commentRepo = manager.getRepository(CommentEntity);
            await commentRepo
              .createQueryBuilder()
              .update(comment)
              .set({
                _stats: () =>
                  `jsonb_set(COALESCE(stats, '{}'), '{replyCount}', '"${commentReplyFeed?.count}"'::jsonb, true)`,
              })
              .where('id = :id', { id: comment.id })
              .execute();
          }),
        3,
        this
      )();
      context.replies[reply.id] = reply;
      await retryWithBackoff({
        fn: () =>
          this.challengeInteractionService.updateChallengeInteractionsIfAuthor({
            postOrChallenge: parent,
            currentUser,
            objectId: reply.id,
            interactionType: ChallengeInteractionEnum.REPLIED,
            context,
          }),
        retryCount: 1,
        throwAfterFailedRetries: false,
        logFailure: (e: unknown) =>
          this.logger.error('Error updating challenge interactions ' + e, {
            replyId: reply.id,
            userId: currentUser.id,
          }),
      });
      retryWithBackoff({
        fn: () =>
          this.userService.updateUserInteractionsCount(
            currentUser.id,
            comment.authorId
          ),
        retryCount: 1,
        throwAfterFailedRetries: false,
        logFailure: (e: unknown) =>
          this.logger.error(
            'Error creating update user interactions job ' + e,
            {
              replyId: reply.id,
              userId: currentUser.id,
            }
          ),
      });
      if (parent instanceof PostEntity) {
        this.requestReIndex(parent.id);
      }
      retryWithBackoff({
        fn: () =>
          this.notifyAuthorProducer.replyOnCommentJob({
            commentId: comment.id,
            subjectId: currentUser.id,
            replyId: reply.id,
            timeStamp: new Date(),
          }),
        retryCount: 0,
        throwAfterFailedRetries: false,
        logFailure: (e: unknown) =>
          this.logger.error('Error creating notify author job ' + e, {
            replyId: reply.id,
            userId: currentUser.id,
          }),
      });
      retryResultWithBackoff({
        fn: () =>
          this.notifyUsersMentionedInReply({
            replyOrId: reply,
            commentAuthorId: comment.authorId,
          }),
        retryCount: 0,
        logFailure: ({ error }) =>
          this.logger.warn(
            'error creating notify mentioned users job ' + error,
            {
              replyId: reply.id,
              userId: currentUser.id,
            }
          ),
      });
      return ok({ reply, comment, parent });
    } catch (error) {
      if (error instanceof WildrException) return err(error);
      return err(
        new InternalServerErrorException(
          kSomethingWentWrong,
          {
            reason: 'Unknown error',
            userId: currentUser.id,
            commentId: input.commentId,
            methodName: 'addReply',
          },
          error
        )
      );
    }
  }

  async requestReIndex(postId: string): Promise<void> {
    // TODO when comments are individually indexed swap this for a request to
    // request ReplyEntity incremental index which will should trigger a
    // re-index of the post.
    return retryWithBackoff({
      fn: () =>
        this.incrementalIndexStateProducer.requestIncrementalIndex({
          entityName: 'PostEntity',
          entityId: postId,
        }),
      retryCount: 3,
      throwAfterFailedRetries: false,
    });
  }

  async notifyUsersMentionedInReply({
    replyOrId,
    commentAuthorId,
  }: {
    replyOrId: ReplyEntity | string;
    commentAuthorId: string;
  }): Promise<
    Result<
      {
        notifiedUsers: Set<string>;
      },
      NotFoundException | InternalServerErrorException
    >
  > {
    try {
      const reply =
        typeof replyOrId === 'string'
          ? await this.findById(replyOrId)
          : replyOrId;
      if (!reply)
        return err(
          new NotFoundException(kSomethingWentWrong, {
            methodName: 'notifyUsersMentionedInReply',
            exceptionCode: NotFoundExceptionCodes.REPLY_NOT_FOUND,
            commentId: replyOrId,
          })
        );
      const notifiedUsers = new Set<string>();
      for (const { segment } of reply.content.segments) {
        if (
          segment.type === 'UserSegmentIO' &&
          segment.id !== reply.authorId &&
          segment.id !== commentAuthorId
        ) {
          notifiedUsers.add(segment.id);
        }
      }
      const tasks = [];
      for (const mentionedUser of notifiedUsers) {
        tasks.push(
          this.notifyAboutMentionProducer.mentionedInReply({
            objectId: mentionedUser,
            replyId: reply.id,
          })
        );
      }
      await Promise.all(tasks);
      return ok({ notifiedUsers });
    } catch (error) {
      if (error instanceof WildrException) return err(error);
      return err(
        new InternalServerErrorException(
          'Error notifying users mentioned in reply: ' + error,
          {
            replyOrId,
            methodName: 'notifyUsersMentionedInReply',
          },
          error
        )
      );
    }
  }
}
