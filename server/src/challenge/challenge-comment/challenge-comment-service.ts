import { Inject, Injectable } from '@nestjs/common';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { AddCommentInput, Comment } from '@verdzie/server/graphql';
import {
  CommentParentType,
  CommentService,
  PaginateCommentsResult,
} from '@verdzie/server/comment/comment.service';
import { FeedService } from '@verdzie/server/feed/feed.service';
import {
  FeedEntity,
  FeedEntityType,
  FeedPageOrder,
} from '@verdzie/server/feed/feed.entity';
import {
  AddCommentResult,
  Challenge,
  FlagCommentInput,
  PaginationInput,
  PaginationOrder,
} from '@verdzie/server/generated-graphql';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import { getFirstFeedPageId } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  AppContext,
  kSomethingWentWrong,
  retryWithBackoff,
} from '@verdzie/server/common';
import { retryResultWithBackoff } from '@verdzie/server/common/retry-result-with-backoff';
import { UserService } from '@verdzie/server/user/user.service';
import { ChallengeRepository } from '@verdzie/server/challenge/challenge-repository/challenge.repository';
import { WildrExceptionDecorator } from '@verdzie/server/common/wildr-exception.decorator';
import { defaultChallengeAccessControl } from '@verdzie/server/challenge/challenge-access-control/challengeAccessControl';
import { ValidationError } from 'apollo-server-errors';
import { ID_SEPARATOR } from '@verdzie/server/common/generateId';
import { ChallengeUpdateStatsService } from '@verdzie/server/challenge/challenge-update-stats/challengeUpdateStats.service';
import { ChallengeService } from '@verdzie/server/challenge/challenge.service';
import {
  CanPostCommentResult,
  CanViewCommentsResult,
} from '@verdzie/server/post/post.service';
import { getChallengeCommentsFeedId } from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@verdzie/server/exceptions/wildr.exception';
import { err, ok, Result } from 'neverthrow';
import {
  ChallengeInteractionEnum,
  ChallengeInteractionService,
} from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.service';
import { NotifyAuthorProducer } from '@verdzie/server/worker/notify-author/notifyAuthor.producer';

@Injectable()
export class ChallengeCommentService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly repo: ChallengeRepository,
    private readonly commentService: CommentService,
    private readonly feedService: FeedService,
    private readonly userService: UserService,
    private readonly updateStatsService: ChallengeUpdateStatsService,
    private readonly challengeService: ChallengeService,
    private readonly challengeInteractionService: ChallengeInteractionService,
    private readonly notifyAuthorProducer: NotifyAuthorProducer
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  /**
   * `feedEntity.page.order = FeedPageOrder.OLDEST_FIRST;`
   * The aforementioned code is required to skip such FeedEntities
   * when reversing all old FeedEntityType.COMMENT feed, (to follow OLDEST_FIRST order)
   */
  async findOrCreateCommentFeed(challengeId: string): Promise<FeedEntity> {
    const id = getChallengeCommentsFeedId(challengeId);
    let feedEntity = await this.feedService.find(id);
    if (feedEntity) return feedEntity;
    feedEntity = new FeedEntity();
    feedEntity.id = id;
    feedEntity.page.order = FeedPageOrder.OLDEST_FIRST;
    await this.feedService.repo.save(feedEntity); //intentional use of `save` (since we are not performing this in transaction)
    return feedEntity;
  }

  gqlCommentObj(comment: CommentEntity): Comment {
    return this.commentService.toCommentObject(comment);
  }

  toGqlChallengeObject(challenge?: ChallengeEntity): Challenge | undefined {
    if (!challenge) return;
    return this.challengeService.toGqlChallengeObject(challenge);
  }

  @WildrExceptionDecorator()
  async userIsBlockedFromCommenting(
    challengeId: string,
    userId: string
  ): Promise<boolean> {
    const feed = await this.feedService.find(
      getFirstFeedPageId(
        FeedEntityType.BLOCKED_COMMENTERS_ON_CHALLENGE,
        challengeId
      )
    );
    if (!feed) return false;
    return feed.hasEntry(userId);
  }

  /**
   * @deprecated use access control service instead
   */
  async canViewCommentsStatusAndMessage(
    userId: string | undefined,
    challenge: ChallengeEntity,
    checkForBlock?: boolean
  ): Promise<CanViewCommentsResult> {
    const somethingWentWrongError = {
      errorMessage: kSomethingWentWrong,
      canViewComments: false,
    };
    if (!challenge) {
      this.logger.error('Challenge not found', {
        challengeId: challenge,
      });
      return somethingWentWrongError;
    }
    let parentAuthor = challenge?.author;
    if (!parentAuthor) {
      parentAuthor = await this.userService.findById(challenge.authorId);
      if (!parentAuthor) {
        this.logger.error('Post author not found', { postId: challenge.id });
        return somethingWentWrongError;
      }
    }
    if (!challenge.accessControl)
      challenge.accessControl = defaultChallengeAccessControl();
    return await this.commentService.canViewCommentsStatusAndMessage({
      checkForBlock,
      userId,
      parentAuthor,
      parentId: challenge.id,
      parentAuthorId: challenge.authorId,
      commentVisibilityAccessData:
        challenge.accessControl.commentVisibilityAccessData,
      messageParentType: 'challenge',
    });
  }

  /**
   * @deprecated use access control service instead
   */
  async canCommentStatusAndMessage({
    challenge,
    userId,
  }: {
    challenge: ChallengeEntity;
    userId: string | undefined;
  }): Promise<
    Result<
      CanPostCommentResult,
      NotFoundException | InternalServerErrorException
    >
  > {
    try {
      let parentAuthor = challenge?.author;
      if (!parentAuthor) {
        parentAuthor = await this.userService.findById(challenge.authorId);
        if (!parentAuthor) {
          return err(
            new NotFoundException(
              '[canCommentStatusAndMessage] Post author not found',
              { postId: challenge.id, userId }
            )
          );
        }
      }
      if (!challenge.accessControl) {
        challenge.accessControl = defaultChallengeAccessControl();
      }
      const result = await this.commentService.cannotCommentErrorMessage({
        userId,
        parentId: challenge.id,
        parentAuthor,
        parentAuthorId: challenge.authorId,
        parentType: CommentParentType.CHALLENGE,
        checkForHasBlocked: true,
        commentPostingAccessData:
          challenge.accessControl.commentPostingAccessData,
      });
      return ok({
        canPostComment: !result,
        errorMessage: result,
      });
    } catch (error) {
      return err(
        new InternalServerErrorException(
          '[canCommentStatusAndMessage] Unknown error',
          { error, challengeId: challenge.id, userId }
        )
      );
    }
  }

  async addComment({
    currentUser,
    input,
    context,
  }: {
    currentUser: UserEntity;
    input: AddCommentInput;
    context: AppContext;
  }): Promise<AddCommentResult | undefined> {
    const logContext = {
      methodName: ChallengeCommentService.prototype.addComment.name,
      userId: currentUser.id,
    };
    if (!input.challengeId) {
      return;
    }
    const challenge = await this.repo.findOne({
      id: input.challengeId,
      findOptions: { relations: [ChallengeEntity.kAuthorRelation] },
    });
    if (!challenge) {
      this.logger.error('Challenge not found', {
        id: input.challengeId,
        ...logContext,
      });
      return;
    }
    if (!challenge.author) {
      throw new ValidationError('Challenge Author not found');
    }
    const comment = await this.commentService.addComment({
      input,
      currentUser,
      parentId: challenge.id,
      parentAuthor: challenge.author,
      parentType: CommentParentType.CHALLENGE,
      commentPostingAccessData:
        challenge.accessControl?.commentPostingAccessData ??
        defaultChallengeAccessControl().commentPostingAccessData,
    });
    const commentFeed = await this.findOrCreateCommentFeed(challenge.id);
    const result = await this.feedService.tryAndPushEntry(
      commentFeed.id,
      currentUser.id + ID_SEPARATOR + comment.id
    );
    if (!result) return;
    challenge.stats = {
      ...challenge.stats,
      commentCount: (result.entity as FeedEntity).count,
    };
    context.challenges[challenge.id] = challenge;
    context.comments[comment.id] = comment;
    await Promise.all([
      this.challengeInteractionService.updateChallengeInteractionsIfAuthor({
        postOrChallenge: challenge,
        currentUser,
        objectId: comment.id,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        context,
      }),
      this.updateStatsService.jsonbSetStatsInTxT({
        id: challenge.id,
        repo: this.repo.repo,
        statsKey: 'commentCount',
        statsValue: challenge.stats.commentCount,
      }),
    ]);
    retryWithBackoff({
      fn: () =>
        this.notifyAuthorProducer.commentOnChallenge({
          commentId: comment.id,
        }),
      retryCount: 1,
      throwAfterFailedRetries: false,
      logFailure: error =>
        this.logger.error('error creating notify author on comment job', {
          error,
          ...logContext,
        }),
    });
    retryResultWithBackoff({
      fn: () =>
        this.commentService.notifyUsersMentionedInComment({
          commentOrId: comment,
        }),
      retryCount: 1,
      logFailure: ({ error }) =>
        this.logger.error(
          'error creating notify users mentioned in comment job',
          {
            error,
            ...logContext,
          }
        ),
    });
    return {
      __typename: 'AddCommentResult',
      comment: this.commentService.toCommentObject(comment),
    };
  }

  //Delete comment
  async deleteComment(
    comment: CommentEntity
  ): Promise<ChallengeEntity | undefined> {
    this.logger.info('deleteComment()...', { id: comment.id });
    if (!comment.challengeId) return;
    const challenge = await this.repo.findOne({ id: comment.challengeId });
    if (!challenge) return;
    if (!comment) {
      this.logger.error('Comment not found');
      return;
    }
    const feed = await this.feedService.tryRemoveEntries(
      getChallengeCommentsFeedId(challenge.id),
      [comment.authorId + ID_SEPARATOR + comment.id]
    );
    if (!feed) return undefined;
    await this.updateStatsService.jsonbSetStatsInTxT({
      id: challenge.id,
      repo: this.repo.repo,
      statsKey: 'commentCount',
      statsValue: feed.count,
    });
    return challenge;
  }

  async flagComment(
    flagCommentInput: FlagCommentInput,
    ctx: AppContext,
    currentUser?: UserEntity
  ) {
    return await this.commentService.flagCommentCommon({
      flagCommentInput,
      ctx,
      currentUser,
      parentType: CommentParentType.CHALLENGE,
    });
  }

  async findComments({
    challenge,
    paginationInput,
    targetCommentId,
    currentUserId,
  }: {
    challenge: ChallengeEntity;
    paginationInput: PaginationInput;
    targetCommentId?: string;
    currentUserId?: string;
  }): Promise<PaginateCommentsResult | undefined> {
    const feed = await this.feedService.find(
      getChallengeCommentsFeedId(challenge.id)
    );
    if (!paginationInput.order) {
      paginationInput.order = PaginationOrder.LATEST_FIRST;
    }
    if (!feed) {
      this.logger.info('Comment feed not found', { id: challenge.id });
      return {
        hasPreviousPage: false,
        hasNextPage: false,
        comments: [],
      };
    }
    const currentUserIsAuthor = currentUserId === challenge.authorId;
    const result = await this.commentService.paginateComments({
      commentVisibilityAccessData:
        challenge.accessControl?.commentVisibilityAccessData,
      feedId: feed.id,
      currentUserIsAuthor,
      authorId: challenge.authorId,
      targetCommentId,
      currentUserId,
      paginationInput,
      parentType: CommentParentType.CHALLENGE,
    });
    return (
      result ?? {
        comments: [],
        hasNextPage: false,
        hasPreviousPage: false,
      }
    );
  }

  async pinComment({
    commentId,
    challengeId,
    currentUser,
    context,
  }: {
    commentId: string;
    challengeId: string;
    currentUser: UserEntity;
    context: AppContext;
  }): Promise<
    Result<
      { challenge: ChallengeEntity; pinnedComment: CommentEntity },
      | NotFoundException
      | UnauthorizedException
      | InternalServerErrorException
      | BadRequestException
    >
  > {
    try {
      this.logger.info('[pinComment]', {
        commentId,
        challengeId,
        userId: currentUser.id,
      });
      const [challenge, comment] = await Promise.all([
        this.challengeService.findById({ id: challengeId }),
        this.commentService.findById(commentId),
      ]);
      if (!challenge) {
        this.logger.error('[pinComment] Challenge not found', {
          challengeId,
          userId: currentUser.id,
          commentId,
        });
        return err(new NotFoundException('Challenge not found'));
      }
      if (!comment) {
        this.logger.error('[pinComment] Comment not found', {
          challengeId,
          userId: currentUser.id,
          commentId,
        });
        return err(new NotFoundException('Comment not found'));
      }
      if (comment.challengeId !== challengeId) {
        this.logger.warn(
          '[pinComment] Comment is not a child of the challenge',
          {
            challengeId,
            userId: currentUser.id,
            commentId,
          }
        );
        return err(
          new BadRequestException(
            `You can't pin a comment to a post that it doesn't belong to`
          )
        );
      }
      if (challenge.authorId !== currentUser.id) {
        this.logger.error('[pinComment] Unauthorized, not challenge author', {
          challengeId,
          userId: currentUser.id,
          commentId,
        });
        return err(
          new UnauthorizedException(
            'Only the challenge author can pin comments'
          )
        );
      }
      await Promise.all([
        this.repo.update({
          criteria: { id: challengeId },
          partialEntity: { pinnedCommentId: commentId },
        }),
        this.challengeInteractionService.updateChallengeInteractionsIfAuthor({
          postOrChallenge: challenge,
          currentUser,
          objectId: commentId,
          interactionType: ChallengeInteractionEnum.PINNED_COMMENT,
          context,
        }),
      ]);
      challenge.pinnedCommentId = commentId;
      challenge.pinnedComment = comment;
      return ok({
        challenge,
        pinnedComment: comment,
      });
    } catch (error) {
      this.logger.error('[pinComment] Unknown error', {
        error,
        commentId,
        challengeId,
        userId: currentUser.id,
      });
      return err(
        new InternalServerErrorException('Error pinning comment', {
          error,
        })
      );
    }
  }

  async unPinComment({
    challengeId,
    currentUser,
  }: {
    challengeId: string;
    currentUser: UserEntity;
  }): Promise<
    Result<
      ChallengeEntity,
      UnauthorizedException | NotFoundException | InternalServerErrorException
    >
  > {
    try {
      this.logger.info('[unPinComment]', {
        challengeId,
        userId: currentUser.id,
      });
      const challenge = await this.challengeService.findById({
        id: challengeId,
      });
      if (!challenge) {
        this.logger.error('[unPinComment] Challenge not found', {
          challengeId,
          userId: currentUser.id,
        });
        return err(new NotFoundException('Challenge not found'));
      }
      if (!challenge.pinnedCommentId) {
        this.logger.warn('[unPinComment] Challenge has no pinned comment', {
          challengeId,
          userId: currentUser.id,
        });
      }
      if (challenge.authorId !== currentUser.id) {
        this.logger.warn('[unPinComment] Unauthorized, not challenge author', {
          challengeId,
          userId: currentUser.id,
        });
        return err(
          new UnauthorizedException(
            'Only the challenge author can unpin comments'
          )
        );
      }
      await this.repo.update({
        criteria: { id: challengeId },
        partialEntity: { pinnedCommentId: undefined },
      });
      challenge.pinnedCommentId = undefined;
      challenge.pinnedComment = undefined;
      return ok(challenge);
    } catch (error) {
      this.logger.error('[unPinComment] Unknown error', {
        error,
        challengeId,
        userId: currentUser.id,
      });
      return err(
        new InternalServerErrorException('Error unpinning comment', {
          error,
        })
      );
    }
  }

  async getCommentFromAppContext({
    commentId,
    context,
  }: {
    commentId: string;
    context: AppContext;
  }): Promise<
    Result<CommentEntity, NotFoundException | InternalServerErrorException>
  > {
    try {
      if (context.comments[commentId]) {
        return ok(context.comments[commentId]);
      }
      const comment = await this.commentService.findById(commentId);
      if (!comment) {
        this.logger.warn('[getCommentFromAppContext] Comment not found', {
          commentId,
        });
        return err(new NotFoundException('Comment not found'));
      }
      context.comments[commentId] = comment;
      return ok(comment);
    } catch (error) {
      this.logger.error('[getCommentFromAppContext] Unknown error', {
        error,
        commentId,
      });
      return err(
        new InternalServerErrorException('Error getting comment', {
          error,
        })
      );
    }
  }
}
