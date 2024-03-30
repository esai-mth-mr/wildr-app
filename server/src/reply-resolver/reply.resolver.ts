import {
  Args,
  Context,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
  Query,
} from '@nestjs/graphql';
import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserService } from '@verdzie/server/user/user.service';
import { ReplyService } from '@verdzie/server/reply/reply.service';
import { ContentService } from '@verdzie/server/content/content.service';
import { CommentService } from '@verdzie/server/comment/comment.service';
import {
  CommentReplyContext,
  Content,
  DeleteReplyInput,
  DeleteReplyOutput,
  Reply,
  ReportReplyInput,
  ReportReplyOutput,
  ReactionType,
  AddReplyInput,
} from '@verdzie/server/graphql';
import {
  GetReplyInput,
  GetReplyOutput,
  ReactOnReplyInput,
  ReactOnReplyOutput,
  ReplyContext,
  ReplyReactionsConnection,
  ReplyReactionsEdge,
  PaginationInput,
  AddReplyOutput,
} from '@verdzie/server/generated-graphql';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  AppContext,
  kSomethingWentWrong,
  takenDownAccountSmartError,
} from '@verdzie/server/common';
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
import _ from 'lodash';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';
import { ReplyEntity } from '../reply/reply.entity';
import {
  BadRequestExceptionCodes,
  isUserVisibleError,
} from '@verdzie/server/exceptions/wildr.exception';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { ChallengeInteractionResult } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction-result.decorator';
import { ChallengeCommentService } from '@verdzie/server/challenge/challenge-comment/challenge-comment-service';

@Resolver('Reply')
export class ReplyResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private userService: UserService,
    private replyService: ReplyService,
    private contentService: ContentService,
    private commentService: CommentService,
    // Used by ChallengeInteractionResult decorator
    private challengeCommentService: ChallengeCommentService
  ) {
    this.logger = this.logger.child({ context: 'ReplyResolver' });
  }

  @Query()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(SmartExceptionFilter)
  async getReply(
    @Args('input') input: GetReplyInput,
    @Context() context: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<GetReplyOutput> {
    const { reply, comment, parent } =
      await this.replyService.findOneWithVisibilityCheck(
        input.id,
        currentUser,
        {
          relations: [ReplyEntity.kAuthorRelation],
        }
      );
    context.reply = reply;
    context.replies[reply.id] = reply;
    context.comments[comment.id] = comment;
    if (parent instanceof PostEntity) {
      context.posts[parent.id] = parent;
    } else {
      context.challenges[parent.id] = parent;
    }
    return {
      __typename: 'GetReplyResult',
      reply: this.replyService.toReplyObject(reply),
    };
  }

  @ResolveField()
  async commentReplyContext(
    @Parent() reply: Reply,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<CommentReplyContext | undefined> {
    if (!currentUser || !reply) return undefined;
    return this.userService.getCommentReplyContext(currentUser, reply.id);
  }

  @ResolveField(() => Content, { name: 'body' })
  async body(
    @Parent() parent: Reply,
    @Context() ctx: AppContext
  ): Promise<Content | undefined> {
    if (!ctx.replies[parent.id]) {
      const reply = await this.replyService.findById(parent.id);
      if (reply) ctx.replies[parent.id] = reply;
    }
    const reply = ctx.replies[parent.id];
    if (!reply) {
      this.logger.error('Unable to find reply: ', parent.id);
      return undefined;
    }
    return this.contentService.resolve(reply.content);
  }

  @ResolveField(() => ReplyContext, { name: 'replyContext' })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async replyContext(
    @Parent() reply: Reply,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ReplyContext | undefined> {
    if (!currentUser) {
      this.logger.warn('replyContext resolver: no currentUser', {
        replyId: reply.id,
      });
      return;
    }

    return this.replyService.getContext(reply.id, currentUser.id);
  }

  @ResolveField()
  async reactionsConnection(
    @Parent() reply: Reply,
    @Args('reactionType') reactionType: ReactionType,
    @Args('paginationInput') paginationInput: PaginationInput
  ) {
    const {
      users,
      hasNextPage = false,
      hasPreviousPage = false,
      count = 0,
    } = (await this.replyService.getReactions(
      reply.id,
      reactionType,
      paginationInput
    )) ?? {};
    if (!users) {
      this.logger.warn('[reactionsConnection] no users found');
      return;
    }
    const edges: ReplyReactionsEdge[] =
      users
        .filter(user => user)
        .map(user => ({
          __typename: 'ReplyReactionsEdge',
          cursor: user.id,
          node: this.userService.toUserObject({ user }),
        })) ?? [];
    const result: ReplyReactionsConnection = {
      __typename: 'ReplyReactionsConnection',
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
  @ChallengeInteractionResult()
  async addReply(
    @Args('input', { type: () => AddReplyInput }) input: AddReplyInput,
    @Context() context: AppContext,
    @CurrentUser() currentUser: UserEntity
  ): Promise<AddReplyOutput> {
    const addReplyResult = await this.replyService.addReply({
      currentUser,
      input,
      context,
    });
    if (addReplyResult.isErr()) {
      this.logger.error('[addReply]', addReplyResult.error);
      if (
        addReplyResult.error.debugData.exceptionCode ===
        BadRequestExceptionCodes.TROLL_DETECTED_IN_REPLY
      ) {
        return {
          __typename: 'TrollDetectorError',
          message: addReplyResult.error.message,
        };
      }
      return {
        __typename: 'SmartError',
        message: isUserVisibleError(addReplyResult.error)
          ? addReplyResult.error.message
          : kSomethingWentWrong,
      };
    }
    return {
      __typename: 'AddReplyResult',
      reply: this.replyService.toReplyObject(addReplyResult.value.reply),
      comment: this.commentService.toCommentObject(
        addReplyResult.value.comment
      ),
    };
  }

  @Mutation()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  async reportReply(
    @Args('input', { type: () => ReportReplyInput })
    input: ReportReplyInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ReportReplyOutput> {
    try {
      if (currentUser) {
        if (!currentUser.isAlive()) return takenDownAccountSmartError;
      }
      const replyOrErrorMessage = await this.replyService.report(
        input.replyId,
        input.type,
        currentUser
      );
      if (isString(replyOrErrorMessage)) {
        this.logger.error('post.resolver: Reply for reporting: ', {
          replyOrErrorMessage: replyOrErrorMessage,
        });
        return {
          __typename: 'SmartError',
          message: replyOrErrorMessage,
        };
      }
      return {
        __typename: 'ReportReplyResult',
        reply: this.replyService.toReplyObject(replyOrErrorMessage),
      };
    } catch (e) {
      this.logger.error('Error while reporting a reply: ', e);
      return {
        __typename: 'SmartError',
        message: 'Error while reporting this comment',
      };
      // throw e;
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  async deleteReply(
    @Args('input', { type: () => DeleteReplyInput })
    input: DeleteReplyInput
  ): Promise<DeleteReplyOutput> {
    try {
      const [reply, errorMessage] = await this.replyService.softDelete(
        input.replyId
      );
      if (!reply) {
        return {
          __typename: 'SmartError',
          message: errorMessage,
        };
      }
      await this.commentService.deleteReply(reply.id, reply.comment);
      return {
        __typename: 'DeleteReplyResult',
        isSuccessful: true,
      };
    } catch (e) {
      this.logger.debug('Error while deleting a comment: ', e);
      throw e;
    }
  }

  @Mutation()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @ChallengeInteractionResult()
  async reactOnReply(
    @Args('input', { type: () => ReactOnReplyInput })
    input: ReactOnReplyInput,
    @Context() context: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ReactOnReplyOutput> {
    const reply = await this.replyService.reactOnReply({
      replyId: input.replyId,
      reactionType: input.reaction,
      currentUser,
      context,
    });
    return {
      __typename: 'ReactOnReplyResult',
      reply: this.replyService.toReplyObject(reply),
    };
  }
}
