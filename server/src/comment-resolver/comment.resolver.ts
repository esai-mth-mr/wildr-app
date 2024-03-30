import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  BadRequestException,
  Inject,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CommentService } from '@verdzie/server/comment/comment.service';
import { UserService } from '@verdzie/server/user/user.service';
import { ReplyService } from '@verdzie/server/reply/reply.service';
import { ContentService } from '@verdzie/server/content/content.service';
import { PostService } from '@verdzie/server/post/post.service';
import {
  AddCommentInput,
  Comment,
  CommentContext,
  CommentRepliesEdge,
  Content,
  DeleteCommentInput,
  DeleteCommentOutput,
  PostCommentContext,
  ReactOnCommentInput,
  ReportCommentInput,
  ReportCommentOutput,
  UpdateCommentParticipationInput,
  User,
} from '@verdzie/server/graphql';
import {
  AddCommentOutput,
  AddCommentResult,
  CommentReactionsConnection,
  CommentReactionsEdge,
  CommentRepliesConnection,
  FlagCommentInput,
  FlagCommentOutput,
  GetCommentInput,
  GetCommentOutput,
  ReactionType,
  ReactOnCommentOutput,
  UpdateCommentParticipationOutput,
  PaginationInput,
  PinCommentInput,
  PinCommentOutput,
} from '@verdzie/server/generated-graphql';
import {
  AppContext,
  somethingWentWrongSmartError,
  takenDownAccountSmartError,
} from '@verdzie/server/common';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import { default as _ } from 'lodash';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '@verdzie/server/auth/jwt-auth.guard';
import { GraphQLExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import { isString } from 'class-validator';
import {
  WildrMethodLatencyHistogram,
  WildrSpan,
} from '../opentelemetry/openTelemetry.decorators';
import { kCommentNotFound, kSomethingWentWrong } from '../../constants';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';
import {
  CannotCommentError,
  TrollingDetectedError,
} from '@verdzie/server/exceptions/ValidationException';
import { ChallengeCommentService } from '@verdzie/server/challenge/challenge-comment/challenge-comment-service';
import {
  NotFoundException,
  UnauthorizedException,
} from '@verdzie/server/exceptions/wildr.exception';
import { ChallengeInteractionResult } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction-result.decorator';

@Resolver('Comment')
export class CommentResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private commentService: CommentService,
    private userService: UserService,
    private replyService: ReplyService,
    private contentService: ContentService,
    private postService: PostService,
    // Used by ChallengeInteractionResult decorator
    private challengeCommentService: ChallengeCommentService
  ) {
    this.logger = this.logger.child({ context: 'CommentResolver' });
  }

  @Query()
  @UseGuards(OptionalJwtAuthGuard) // Required for currentUser context
  @UseFilters(SmartExceptionFilter)
  async getComment(
    @Args('input', { type: () => GetCommentInput }) input: GetCommentInput,
    @Context() context: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<GetCommentOutput> {
    const comment = await this.commentService.findOneWithAuthorization(
      input.id,
      currentUser,
      {
        relations: [CommentEntity.kAuthorRelation],
      }
    );
    context.comments[comment.id] = comment;
    return {
      __typename: 'GetCommentResult',
      comment: this.commentService.toCommentObject(comment),
    };
  }

  @ResolveField()
  async repliesConnection(
    @Args('commentId') commentId: string,
    @Args('first') first: number,
    @Args('after') after: string,
    @Args('last') last: number,
    @Args('before') before: string,
    @Args('includingAndAfter') includingAndAfter: string,
    @Args('includingAndBefore') includingAndBefore: string,
    @Args('paginationInput') paginationInput: PaginationInput | undefined,
    @Args('targetReplyId') targetReplyId: string | undefined,
    @Context() ctx: AppContext,
    @Context('comment') comment?: CommentEntity
  ): Promise<CommentRepliesConnection> {
    this.logger.info('repliesConnection() -> includingAndBefore', {
      includingAndBefore,
    });
    const { replies, hasNextPage, hasPreviousPage, targetReplyError } =
      (await this.commentService.findReplies({
        commentOrId: comment ?? commentId,
        last,
        before,
        first,
        after,
        includingAndAfter,
        includingAndBefore,
        targetReplyId,
      })) ?? [[], false, false];
    replies.forEach(reply => {
      ctx.replies[reply.id] = reply;
    });
    const edges: CommentRepliesEdge[] =
      replies.map(entry => ({
        __typename: 'CommentRepliesEdge',
        node: this.replyService.toReplyObject(entry),
        cursor: entry.id,
      })) ?? [];
    return {
      __typename: 'CommentRepliesConnection',
      pageInfo: {
        __typename: 'PageInfo',
        startCursor: _.first(edges)?.cursor ?? '',
        endCursor: _.last(edges)?.node.id ?? '',
        hasNextPage: hasPreviousPage,
        hasPreviousPage: hasNextPage,
      },
      edges,
      targetReplyError,
    };
  }

  /**
   * @deprecated use commentContext instead
   */
  @ResolveField()
  async postCommentContext(
    @Parent() comment: Comment,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<PostCommentContext | undefined> {
    if (!currentUser || !comment) return undefined;
    return this.userService.getPostCommentContext(currentUser, comment.id);
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async commentContext(
    @Parent() comment: Comment,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<CommentContext | undefined> {
    if (!currentUser) {
      this.logger.warn('commentContext resolver: no currentUser', {
        commentId: comment.id,
      });
      return;
    }
    return this.commentService.getContext(comment.id, currentUser.id);
  }

  @ResolveField(() => User, { name: 'author' })
  async author(
    @Parent() parent: Comment,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<User | undefined> {
    if (!ctx.comments[parent.id]) {
      const comment = await this.commentService.findByIdWithAuthor(parent.id);
      if (comment) ctx.comments[parent.id] = comment;
      if (comment?.author) ctx.users[comment.authorId] = comment.author;
    }
    const comment = ctx.comments[parent.id];
    if (!comment) return undefined;
    if (!ctx.users[comment.authorId]) {
      ctx.users[comment.authorId] =
        comment.author ??
        ((await this.userService.findById(comment.authorId)) as UserEntity);
    }
    return this.userService.toUserObject({ user: ctx.users[comment.authorId] });
  }

  //Comment Resolver
  @ResolveField(() => Content, { name: 'body' })
  async body(
    @Parent() parent: Comment,
    @Context() ctx: AppContext
  ): Promise<Content | undefined> {
    if (!ctx.comments[parent.id]) {
      const comment = await this.commentService.findById(parent.id);
      if (comment) ctx.comments[parent.id] = comment;
    }
    const comment = ctx.comments[parent.id];
    if (!comment) {
      this.logger.error('Unable to find comment: ', parent.id);
      return undefined;
    }
    return this.contentService.resolve(comment.content, comment.body);
  }

  @ResolveField()
  async reactionsConnection(
    @Parent() parent: Comment,
    @Args('reactionType') reactionType: ReactionType,
    @Args('paginationInput') paginationInput: PaginationInput
  ) {
    const {
      users,
      hasNextPage = false,
      hasPreviousPage = false,
      count = 0,
    } = (await this.commentService.getReactions(
      parent.id,
      reactionType,
      paginationInput
    )) ?? {};
    if (!users) {
      this.logger.warn('[reactionsConnection] no users found');
      return;
    }
    const edges: CommentReactionsEdge[] =
      users
        .filter(user => user)
        .map(user => ({
          __typename: 'CommentReactionsEdge',
          cursor: user.id,
          node: this.userService.toUserObject({ user }),
        })) ?? [];
    const result: CommentReactionsConnection = {
      __typename: 'CommentReactionsConnection',
      count,
      edges,
      pageInfo: {
        __typename: 'PageInfo',
        startCursor: _.first(edges)?.cursor ?? '',
        endCursor: _.last(edges)?.cursor ?? '',
        hasNextPage,
        hasPreviousPage,
      },
    };
    return result;
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async updateCommentParticipation(
    @Args('input', { type: () => UpdateCommentParticipationInput })
    input: UpdateCommentParticipationInput
  ): Promise<UpdateCommentParticipationOutput> {
    try {
      const comment = await this.commentService.updateParticipation(
        input.commentId,
        input.type
      );
      if (!comment) {
        this.logger.info('Comment not found');
        return {
          __typename: 'SmartError',
          message: 'Unable to update the comment participation type',
        };
      }
      return {
        __typename: 'UpdateCommentParticipationResult',
        comment: this.commentService.toCommentObject(comment),
      };
    } catch (e) {
      this.logger.debug(
        'Error while updating participation type of a comment: ',
        e
      );
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async deleteComment(
    @Args('input', { type: () => DeleteCommentInput })
    input: DeleteCommentInput,
    @Context() ctx: AppContext
  ): Promise<DeleteCommentOutput> {
    try {
      const deletedComment = await this.commentService.softDelete(
        input.commentId
      );
      if (!deletedComment) {
        return {
          __typename: 'SmartError',
          message: kCommentNotFound,
        };
      }
      if (deletedComment.postId) {
        const post = await this.postService.deleteComment(deletedComment);
        if (post) {
          ctx.posts[post.id] = post;
          return {
            __typename: 'DeleteCommentResult',
            isSuccessful: true,
            post: this.postService.toGqlPostObject(post),
          };
        }
      } else if (deletedComment.challengeId) {
        const challenge = await this.challengeCommentService.deleteComment(
          deletedComment
        );
        if (challenge) {
          ctx.challenges[challenge.id] = challenge;
          return {
            __typename: 'DeleteCommentResult',
            isSuccessful: true,
            challenge:
              this.challengeCommentService.toGqlChallengeObject(challenge),
          };
        }
      }
      return {
        __typename: 'DeleteCommentResult',
        isSuccessful: false,
      };
    } catch (e) {
      this.logger.debug('Error while deleting a comment: ', e);
      return {
        __typename: 'DeleteCommentResult',
        isSuccessful: false,
      };
    }
  }

  @Mutation()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async reportComment(
    @Args('input', { type: () => ReportCommentInput })
    input: ReportCommentInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ReportCommentOutput> {
    try {
      if (currentUser) {
        if (!currentUser.isAlive()) return takenDownAccountSmartError;
      }
      const commentOrErrorMessage = await this.commentService.report(
        input.commentId,
        input.type,
        currentUser
      );
      if (isString(commentOrErrorMessage)) {
        this.logger.error('post.resolver: found comment for reporting: ', {
          commentOrErrorMessage,
        });
        return {
          __typename: 'SmartError',
          message: commentOrErrorMessage,
        };
      }
      return {
        __typename: 'ReportCommentResult',
        comment: this.commentService.toCommentObject(commentOrErrorMessage),
      };
    } catch (e) {
      this.logger.error('Error while reporting a comment: ', e);
      return {
        __typename: 'SmartError',
        message: 'Error while reporting this comment',
      };
    }
  }

  @Mutation()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @ChallengeInteractionResult()
  async reactOnComment(
    @Args('input', { type: () => ReactOnCommentInput })
    input: ReactOnCommentInput,
    @Context() context: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ReactOnCommentOutput> {
    const comment = await this.commentService.reactOnComment({
      commentId: input.commentId,
      reactionType: input.reaction,
      context,
      currentUser,
    });
    return {
      __typename: 'ReactOnCommentResult',
      comment: this.commentService.toCommentObject(comment),
    };
  }

  @Mutation()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async flagComment(
    @Args('input', { type: () => FlagCommentInput })
    input: FlagCommentInput,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<FlagCommentOutput> {
    this.logger.info('[flagComment] flagging comment', {
      commentId: input.commentId,
      currentUserId: currentUser?.id,
    });
    const comment = await this.commentService.flagComment(
      input,
      ctx,
      currentUser
    );
    if (!comment) {
      return somethingWentWrongSmartError;
    }
    this.logger.info('[flagComment] comment flagged', {
      commentId: comment.id,
    });
    return {
      __typename: 'FlagCommentResult',
      comment: this.commentService.toCommentObject(comment),
      parentPost: this.postService.toGqlPostObject(comment.post),
      parentChallenge: this.challengeCommentService.toGqlChallengeObject(
        comment.challenge
      ),
    };
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @ChallengeInteractionResult()
  async addComment(
    @Args('input', { type: () => AddCommentInput }) input: AddCommentInput,
    @CurrentUser() currentUser: UserEntity,
    @Context() ctx: AppContext
  ): Promise<AddCommentOutput> {
    try {
      if (!currentUser.isAlive()) {
        this.logger.info('[addComment] User taken down', {
          id: currentUser.id,
        });
        return takenDownAccountSmartError;
      }
      if (input.challengeId === undefined && input.postId === undefined) {
        this.logger.error('[addComment] Both challenge and post ids are null');
        return somethingWentWrongSmartError;
      }
      const result: AddCommentResult | undefined = input.postId
        ? await this.postService.addComment(currentUser, input, ctx)
        : await this.challengeCommentService.addComment({
            currentUser,
            input,
            context: ctx,
          });
      if (!result) return somethingWentWrongSmartError;
      return result;
    } catch (error) {
      this.logger.error('[addComment] Error while commenting: ', {
        userId: currentUser.id,
        postId: input.postId,
        errorMessage: `${error}` ?? '<none>',
        error,
      });
      if (error instanceof CannotCommentError) {
        return {
          __typename: 'SmartError',
          message: error.message,
        };
      } else if (error instanceof TrollingDetectedError) {
        return {
          __typename: 'TrollDetectorError',
          data: error.result,
          message: 'Trolling detected',
        };
      }
      return {
        __typename: 'SmartError',
        message: 'This content may have been deleted',
      };
    }
  }

  private async pinCommentOnChallenge({
    challengeId,
    commentId,
    currentUser,
    context,
  }: {
    challengeId: string;
    commentId: string;
    currentUser: UserEntity;
    context: AppContext;
  }): Promise<PinCommentOutput> {
    const result = await this.challengeCommentService.pinComment({
      challengeId,
      commentId,
      currentUser,
      context,
    });
    if (result.isErr()) {
      this.logger.error(
        '[pinCommentOnChallenge] ' + result.error,
        result.error
      );
      if (
        result.error instanceof NotFoundException ||
        result.error instanceof UnauthorizedException ||
        result.error instanceof BadRequestException
      ) {
        return {
          __typename: 'SmartError',
          message: result.error.message,
        };
      }
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
    context.challenges[result.value.challenge.id] = result.value.challenge;
    context.comments[result.value.pinnedComment.id] =
      result.value.pinnedComment;
    return {
      __typename: 'PinCommentResult',
    };
  }

  private async unPinCommentOnChallenge({
    challengeId,
    currentUser,
    context,
  }: {
    challengeId: string;
    currentUser: UserEntity;
    context: AppContext;
  }): Promise<PinCommentOutput> {
    const result = await this.challengeCommentService.unPinComment({
      challengeId,
      currentUser,
    });
    if (result.isErr()) {
      this.logger.error(
        '[unPinCommentOnChallenge] ' + result.error,
        result.error
      );
      if (
        result.error instanceof NotFoundException ||
        result.error instanceof UnauthorizedException
      ) {
        return {
          __typename: 'SmartError',
          message: result.error.message,
        };
      }
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
    context.challenges[result.value.id] = result.value;
    return {
      __typename: 'PinCommentResult',
    };
  }

  private async pinCommentOnPost({
    postId,
    commentId,
    currentUser,
    context,
  }: {
    postId: string;
    commentId: string;
    currentUser: UserEntity;
    context: AppContext;
  }): Promise<PinCommentOutput> {
    const result = await this.postService.pinComment({
      postId,
      commentId,
      currentUser,
      context,
    });
    if (result.isErr()) {
      this.logger.error('[pinCommentOnPost] ' + result.error, result.error);
      if (
        result.error instanceof NotFoundException ||
        result.error instanceof UnauthorizedException ||
        result.error instanceof BadRequestException
      ) {
        return {
          __typename: 'SmartError',
          message: result.error.message,
        };
      }
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
    context.posts[result.value.post.id] = result.value.post;
    context.comments[result.value.pinnedComment.id] =
      result.value.pinnedComment;
    return {
      __typename: 'PinCommentResult',
      post: this.postService.toGqlPostObject(result.value.post),
    };
  }

  private async unPinCommentOnPost({
    postId,
    currentUser,
    context,
  }: {
    postId: string;
    currentUser: UserEntity;
    context: AppContext;
  }): Promise<PinCommentOutput> {
    const result = await this.postService.unPinComment({
      postId,
      currentUser,
    });
    if (result.isErr()) {
      this.logger.error('[unPinCommentOnPost] ' + result.error, result.error);
      if (
        result.error instanceof NotFoundException ||
        result.error instanceof UnauthorizedException
      ) {
        return {
          __typename: 'SmartError',
          message: result.error.message,
        };
      }
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
    context.posts[result.value.id] = result.value;
    return {
      __typename: 'PinCommentResult',
      post: this.postService.toGqlPostObject(result.value),
    };
  }

  @Mutation()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @ChallengeInteractionResult()
  async pinComment(
    @Args('input')
    input: PinCommentInput,
    @CurrentUser() currentUser: UserEntity,
    @Context() context: AppContext
  ): Promise<PinCommentOutput> {
    if (input.challengeId) {
      if (input.commentId) {
        return this.pinCommentOnChallenge({
          currentUser,
          commentId: input.commentId,
          challengeId: input.challengeId,
          context,
        });
      } else {
        return this.unPinCommentOnChallenge({
          currentUser,
          challengeId: input.challengeId,
          context,
        });
      }
    } else if (input.postId) {
      if (input.commentId) {
        return this.pinCommentOnPost({
          currentUser,
          commentId: input.commentId,
          postId: input.postId,
          context,
        });
      } else {
        return this.unPinCommentOnPost({
          currentUser,
          postId: input.postId,
          context,
        });
      }
    } else {
      this.logger.error(
        '[pinComment] Unable to pin comment, neither challengeId nor postId is provided',
        {
          input,
        }
      );
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
  }
}
