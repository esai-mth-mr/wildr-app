import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Inject, UseFilters, UseGuards } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ChallengeService } from '@verdzie/server/challenge/challenge.service';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '@verdzie/server/auth/jwt-auth.guard';
import {
  WildrMethodLatencyHistogram,
  WildrSpan,
} from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import {
  Challenge,
  ChallengeAuthorInteractionConnection,
  ChallengeCommentEdge,
  ChallengeCommentsConnection,
  ChallengeCover,
  ChallengeCurrentUserContext,
  ChallengeLeaderboardConnection,
  ChallengeParticipantsConnection,
  ChallengeParticipantsEdge,
  ChallengePreviewParticipants,
  ChallengeStats,
  ChallengeTrollDetectionError,
  Comment,
  CommentPostingAccessControlContext,
  CommentVisibilityAccessControlContext,
  Content,
  CreateChallengeOutput,
  EditChallengeOutput,
  GetChallengeInput,
  GetChallengeOutput,
  GetJoinedChallengesInput,
  GetJoinedChallengesOutput,
  GetMyChallengesInput,
  GetMyChallengesOutput,
  JoinChallengeInput,
  JoinChallengeOutput,
  LeaveChallengeInput,
  LeaveChallengeOutput,
  PaginationInput,
  PinChallengeEntryInput,
  PinChallengeEntryOutput,
  PostCategory,
  ReportChallengeInput,
  ReportChallengeOutput,
} from '@verdzie/server/generated-graphql';
import {
  AppContext,
  kSomethingWentWrong,
  somethingWentWrongSmartError,
} from '@verdzie/server/common';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import {
  CreateChallengeInput,
  EditChallengeInput,
  User,
} from '@verdzie/server/graphql';
import { default as _ } from 'lodash';
import { PostService } from '@verdzie/server/post/post.service';
import { ChallengeParticipantMeta } from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { ChallengeParticipantsService } from '@verdzie/server/challenge/challenge-participants/challengeParticipants.service';
import { SmartExceptionFilter } from '@verdzie/server/common/smart-exception.filter';
import { ChallengeInteractionService } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.service';
import { ChallengeCommentService } from '@verdzie/server/challenge/challenge-comment/challenge-comment-service';
import { ChallengeCoverService } from '@verdzie/server/challenge/challengeCover.service';
import { ChallengePostEntryService } from '@verdzie/server/challenge/challenge-post-entry/challengePostEntry.service';
import { ChallengeLeaderboardService } from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.service';
import {
  isUserVisibleError,
  NotFoundException,
} from '@verdzie/server/exceptions/wildr.exception';
import {
  toGqlCommentPostingAccessEnum,
  toGqlCommentVisibilityAccessEnum,
} from '@verdzie/server/post/postAccessControl';
import { defaultChallengeAccessControl } from '@verdzie/server/challenge/challenge-access-control/challengeAccessControl';
import { toPostCategoryTypeLabel } from '@verdzie/server/post-category/postCategory.entity';
import { isChallengeParticipant } from '@verdzie/server/challenge/userJoinedChallenges.helper';

@Resolver('Challenge')
export class ChallengeResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger,
    private readonly service: ChallengeService,
    private readonly coverService: ChallengeCoverService,
    private readonly userService: UserService,
    private readonly postService: PostService,
    private readonly participantsService: ChallengeParticipantsService,
    private readonly challengeCommentService: ChallengeCommentService,
    private readonly challengeInteractionService: ChallengeInteractionService,
    private readonly challengePostEntryService: ChallengePostEntryService,
    private readonly challengeLeaderboardService: ChallengeLeaderboardService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Query()
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getChallenge(
    @Args('input') input: GetChallengeInput,
    @Context() context: AppContext
  ): Promise<GetChallengeOutput> {
    const challenge = await this.service.findWithAuthorRelation(input.id);
    if (!challenge) {
      return {
        __typename: 'SmartError',
        message: 'Challenge not found',
      };
    }
    context.challenges[challenge.id] = challenge;
    if (challenge.author) context.users[challenge.authorId] = challenge.author;
    return {
      __typename: 'GetChallengeResult',
      challenge: this.service.toGqlChallengeObject(challenge),
    };
  }

  @Query()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getJoinedChallenges(
    @CurrentUser() currentUser: UserEntity,
    @Args('input') input: GetJoinedChallengesInput
  ): Promise<GetJoinedChallengesOutput> {
    const challenges = await this.service.findJoinedChallenges({
      currentUser,
      ...(input.challengeState && { challengeState: input.challengeState }),
    });
    return {
      __typename: 'GetJoinedChallengesResult',
      challenges: challenges
        .filter(Boolean)
        .map(challenge => this.service.toGqlChallengeObject(challenge)),
    };
  }

  @Query()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getMyChallenges(
    @CurrentUser() currentUser: UserEntity,
    @Args('input') input: GetMyChallengesInput
  ): Promise<GetMyChallengesOutput> {
    const paginateChallengesResult =
      await this.service.paginateJoinedChallenges({
        currentUser,
        paginationInput: input.paginationInput,
      });
    if (paginateChallengesResult.isErr()) {
      this.logger.error(paginateChallengesResult.error);
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
    return {
      __typename: 'GetMyChallengesResult',
      pageInfo: {
        __typename: 'PageInfo',
        ...paginateChallengesResult.value.pageInfo,
      },
      edges: paginateChallengesResult.value.items.map(challenge => ({
        cursor: challenge.id,
        node: this.service.toGqlChallengeObject(challenge),
      })),
    };
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async isOwner(
    @Parent() parent: Challenge,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<boolean | undefined> {
    const challenge = ctx.challenges[parent.id];
    return challenge
      ? challenge?.authorId === currentUser?.id
      : parent.author?.id === currentUser?.id;
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async author(
    @Parent() parent: Challenge,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<User | undefined> {
    const challenge = await this.service.getChallengeEntityFromContext(
      parent.id,
      ctx,
      true
    );
    if (!challenge) {
      this.logger.warn('Challenge not found', {
        fxtName: 'author',
        id: parent.id,
      });
      return;
    }
    challenge.author ??= await this.userService.findById(challenge.authorId);
    if (!challenge.author) {
      this.logger.warn('No author found for challenge', {
        id: parent.id,
        fxtName: 'author',
      });
      return;
    }
    return this.userService.toUserObject({
      user: challenge.author,
    });
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async cover(
    @Parent() parent: Challenge,
    @Context() ctx: AppContext
  ): Promise<ChallengeCover | undefined> {
    const challenge = await this.service.getChallengeEntityFromContext(
      parent.id,
      ctx
    );
    if (!challenge) {
      this.logger.warn('Challenge not found', {
        fxtName: 'cover',
        id: parent.id,
      });
      return;
    }
    return await this.coverService.getGqlCover(challenge);
  }

  private getFirstNameOrHandle(user: UserEntity): string {
    if (user.name.length === 0) return user.handle;
    return _.first(user.name.split(' ')) ?? user.handle;
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async previewParticipants(
    @Parent() parent: Challenge,
    @Context() ctx: AppContext
  ): Promise<ChallengePreviewParticipants | undefined> {
    const challenge = await this.service.getChallengeEntityFromContext(
      parent.id,
      ctx
    );
    if (!challenge) {
      this.logger.warn('Challenge not found', {
        fxtName: 'previewParticipants',
        id: parent.id,
      });
      return;
    }
    const participants: UserEntity[] | undefined = (
      await this.service.getPreviewParticipants(challenge)
    )?.filter(Boolean);
    if (!participants || participants.length === 0) return;
    let displayText = '';
    if (participants.length === 1) {
      displayText = this.getFirstNameOrHandle(participants[0]);
    } else if (participants.length === 2) {
      displayText =
        this.getFirstNameOrHandle(participants[0]) +
        ' and ' +
        this.getFirstNameOrHandle(participants[1]);
    } else if (
      participants.length === 3 &&
      challenge.stats.participantCount === 3
    ) {
      displayText =
        this.getFirstNameOrHandle(participants[0]) +
        ', ' +
        this.getFirstNameOrHandle(participants[1]) +
        ' and ' +
        this.getFirstNameOrHandle(participants[2]);
    } else {
      displayText =
        this.getFirstNameOrHandle(participants[0]) +
        ', ' +
        this.getFirstNameOrHandle(participants[1]) +
        ' and ' +
        (challenge.stats.participantCount - 2) +
        ' others';
    }
    return {
      __typename: 'ChallengePreviewParticipants',
      participants: participants.map(participant => {
        return this.userService.toUserObject({ user: participant });
      }),
      displayText,
    };
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async currentUserContext(
    @Parent() parent: Challenge,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ChallengeCurrentUserContext | undefined> {
    const challenge = await this.service.getChallengeEntityFromContext(
      parent.id,
      ctx
    );
    if (!challenge) {
      this.logger.warn('Challenge not found', {
        fxtName: 'currentUserContext',
        id: parent.id,
      });
      return;
    }
    if (!currentUser) {
      return {
        __typename: 'ChallengeCurrentUserContext',
        hasJoined: false,
        isOwner: false,
      };
    }
    return {
      __typename: 'ChallengeCurrentUserContext',
      isOwner: currentUser.id === challenge.authorId,
      hasJoined: isChallengeParticipant({
        user: currentUser,
        challengeId: challenge.id,
      }),
    };
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async description(
    @Parent() parent: Challenge,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<Content | undefined> {
    const challenge = await this.service.getChallengeEntityFromContext(
      parent.id,
      ctx
    );
    if (!challenge) {
      this.logger.warn('Challenge not found', {
        fxtName: 'description',
        id: parent.id,
      });
      return;
    }
    return await this.service.getGqlDescription(challenge);
  }

  @ResolveField(() => ChallengeStats, { name: 'stats' })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async stats(
    @Parent() parentChallenge: Challenge,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ChallengeStats | undefined> {
    const challenge = await this.service.getChallengeEntityFromContext(
      parentChallenge.id,
      ctx
    );
    if (!challenge) return;
    return await this.service.getStatsForUser(challenge, currentUser);
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async commentsConnection(
    @Parent() parent: Challenge,
    @Context() ctx: AppContext,
    @Args('challengeId') challengeId: string,
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('targetCommentId') targetCommentId?: string,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ChallengeCommentsConnection | undefined> {
    const challenge = await this.service.getChallengeEntityFromContext(
      challengeId,
      ctx
    );
    if (!challenge) {
      this.logger.warn('Challenge not found', {
        fxtName: 'discussionConnection',
        id: parent.id,
      });
      return;
    }
    const cannotViewComments =
      await this.challengeCommentService.canViewCommentsStatusAndMessage(
        currentUser?.id,
        challenge,
        true
      );
    const canViewComments = cannotViewComments.canViewComments;
    if (!canViewComments) {
      return {
        __typename: 'ChallengeCommentsConnection',
        pageInfo: {
          __typename: 'PageInfo',
          startCursor: '',
          endCursor: '',
          hasNextPage: false,
          hasPreviousPage: false,
        },
        edges: [],
      };
    }
    const result = await this.challengeCommentService.findComments({
      challenge,
      paginationInput,
      targetCommentId,
      currentUserId: currentUser?.id,
    });
    if (!result) return;
    const comments = result?.comments;
    const edges: ChallengeCommentEdge[] = comments
      .filter(comment => comment !== undefined)
      .map(comment => {
        ctx.comments[comment.id] = comment;
        return {
          __typename: 'ChallengeCommentEdge',
          node: this.challengeCommentService.gqlCommentObj(comment),
          cursor: comment.id,
        };
      });
    return {
      __typename: 'ChallengeCommentsConnection',
      pageInfo: {
        __typename: 'PageInfo',
        startCursor: _.first(edges)?.cursor ?? '',
        endCursor: _.last(edges)?.node.id ?? '',
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
      },
      targetCommentError: result.targetCommentError,
      edges: edges ?? [],
    };
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async participantsConnection(
    @Parent() parent: Challenge,
    @Context() ctx: AppContext,
    @Args('challengeId') challengeId: string,
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('targetParticipantId') targetParticipantId?: string,
    @Args('isRequestingFriendParticipants')
    isRequestingFriendParticipants?: boolean,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ChallengeParticipantsConnection | undefined> {
    const challenge = await this.service.getChallengeEntityFromContext(
      challengeId,
      ctx
    );
    if (!challenge) {
      this.logger.warn('Challenge not found', {
        fxtName: 'discussionConnection',
        id: parent.id,
      });
      return;
    }
    const result = await this.participantsService.findParticipants({
      challenge,
      paginationInput,
      isRequestingFriendParticipants,
      currentUser,
    });
    if (!result.participantsInfoMap) {
      return {
        __typename: 'ChallengeParticipantsConnection',
        pageInfo: {
          __typename: 'PageInfo',
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
    const edges: ChallengeParticipantsEdge[] = [];
    // A map guarantees the keys to be iterated in order of insertion
    // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Objects_and_maps_compared)
    for (const entry of result.participantsInfoMap) {
      const userId = entry[0];
      const participantMeta: ChallengeParticipantMeta = entry[1];
      if (!participantMeta.userEntity) continue;
      ctx.users[userId] = participantMeta.userEntity;
      const post = participantMeta.postEntity;
      if (post) {
        ctx.posts[post.id] = post;
      }
      edges.push({
        __typename: 'ChallengeParticipantsEdge',
        cursor: userId,
        node: {
          __typename: 'ChallengeParticipant',
          entryCount: participantMeta.entryCount ?? 0,
          isCreator: userId === challenge.authorId,
          isFriend: participantMeta.isFriend ?? false,
          user: this.userService.toUserObject({
            user: participantMeta.userEntity,
          }),
          post: this.postService.toGqlPostObject(post),
        },
      });
    }
    return {
      __typename: 'ChallengeParticipantsConnection',
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
        startCursor: _.first(edges)?.cursor,
        endCursor: _.last(edges)?.cursor,
        count: edges.length,
      },
      edges,
    };
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async authorInteractionsConnection(
    @Parent() parent: Challenge,
    @Context() context: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ChallengeAuthorInteractionConnection | undefined> {
    if (!currentUser) {
      return;
    }
    if (!context.timezoneOffset) {
      this.logger.warn('[authorInteractionsConnection] No timezone provided');
      return;
    }
    const challengeInteractions =
      await this.challengeInteractionService.getChallengeAuthorInteractionsForToday(
        {
          challengeId: parent.id,
          currentUser,
          timezoneOffset: context.timezoneOffset,
        }
      );
    return {
      __typename: 'ChallengeAuthorInteractionConnection',
      interactionCount: challengeInteractions.length,
    };
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async leaderboardConnection(
    @Context() ctx: AppContext,
    @Args('challengeId') challengeId: string,
    @Args('paginationInput') paginationInput: PaginationInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ChallengeLeaderboardConnection> {
    const challengeEntity = await this.service.getChallengeEntityFromContext(
      challengeId,
      ctx
    );
    if (!challengeEntity) {
      this.logger.warn('[leaderboardConnection] challenge not found', {
        fxtName: 'leaderboardConnection',
        id: challengeId,
      });
      return {
        __typename: 'ChallengeLeaderboardConnection',
        pageInfo: {
          __typename: 'PageInfo',
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: '',
        },
      };
    }
    const challengeParticipants =
      await this.challengeLeaderboardService.paginateLeaderboardParticipants({
        challenge: challengeEntity,
        paginationInput,
        currentUser,
      });
    const edges = challengeParticipants.rawEdges.map(rawEdge => {
      return {
        cursor: rawEdge.user.id,
        node: {
          post: this.postService.toGqlPostObject(rawEdge.post),
          user: this.userService.toUserObject({ user: rawEdge.user }),
          isCreator: rawEdge.isCreator,
          entryCount: rawEdge.entryCount,
        },
      };
    });
    return {
      __typename: 'ChallengeLeaderboardConnection',
      edges,
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: challengeParticipants.hasNextPage,
        hasPreviousPage: challengeParticipants.hasPreviousPage,
        startCursor: _.first(edges)?.cursor,
        endCursor: _.last(edges)?.cursor,
        count: edges.length,
      },
    };
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @UseFilters(SmartExceptionFilter)
  public async pinnedComment(
    @Parent() parent: Challenge,
    @Context() context: AppContext
  ): Promise<Comment | undefined> {
    if (!parent.pinnedCommentId) return;
    const result = await this.challengeCommentService.getCommentFromAppContext({
      commentId: parent.pinnedCommentId,
      context,
    });
    if (result.isErr()) {
      this.logger.warn('Pinned comment not found', {
        methodName: 'pinnedComment',
        error: result.error,
      });
      return;
    }
    return this.challengeCommentService.gqlCommentObj(result.value);
  }

  @ResolveField(() => CommentVisibilityAccessControlContext, {
    name: 'commentVisibilityAccessControlContext',
  })
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async commentVisibilityAccessControlContext(
    @Parent() challengeObject: Challenge,
    @Context() context: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<CommentVisibilityAccessControlContext | undefined> {
    const challenge = await this.service.getChallengeEntityFromContext(
      challengeObject.id,
      context
    );
    if (!challenge) {
      this.logger.warn(
        '[commentVisibilityAccessControlContext] challenge not found',
        {
          methodName: 'commentVisibilityAccessControlContext',
          id: challengeObject.id,
        }
      );
      return;
    }
    const status =
      await this.challengeCommentService.canViewCommentsStatusAndMessage(
        currentUser?.id ?? '',
        challenge
      );
    return {
      __typename: 'CommentVisibilityAccessControlContext',
      canViewComment: status.canViewComments,
      cannotViewCommentErrorMessage: status.errorMessage,
      commentVisibilityAccess: toGqlCommentVisibilityAccessEnum(
        challenge.accessControl?.commentVisibilityAccessData.access ??
          defaultChallengeAccessControl().commentVisibilityAccessData.access
      ),
    };
  }

  @ResolveField(() => CommentPostingAccessControlContext, {
    name: 'commentPostingAccessControlContext',
  })
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async commentPostingAccessControlContext(
    @Parent() challengeObject: Challenge,
    @Context() context: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<CommentPostingAccessControlContext | undefined> {
    const challenge = await this.service.getChallengeEntityFromContext(
      challengeObject.id,
      context
    );
    if (!challenge) return;
    const canCommentResult =
      await this.challengeCommentService.canCommentStatusAndMessage({
        userId: currentUser?.id,
        challenge,
      });
    if (canCommentResult.isErr()) {
      this.logger.error(canCommentResult.error.message, {
        methodName: 'commentPostingAccessControlContext',
        challengeId: challenge.id,
        userId: currentUser?.id,
        error: canCommentResult.error,
      });
      return;
    }
    return {
      __typename: 'CommentPostingAccessControlContext',
      canComment: canCommentResult.value.canPostComment,
      cannotCommentErrorMessage: canCommentResult.value.errorMessage,
      commentPostingAccess: toGqlCommentPostingAccessEnum(
        challenge.accessControl?.commentPostingAccessData.access ??
          defaultChallengeAccessControl().commentPostingAccessData.access
      ),
    };
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async categories(
    @Parent() challenge: Challenge,
    @Context() context: AppContext
  ): Promise<PostCategory[]> {
    const getCategoriesResult = await this.service.getCategories({
      challengeOrId: challenge.id,
      context,
    });
    if (getCategoriesResult.isErr()) {
      this.logger.error('[categories] ', getCategoriesResult.error);
      return [];
    }
    return getCategoriesResult.value.map(category => ({
      __typename: 'PostCategory',
      id: category.id,
      value: category.name,
      type: toPostCategoryTypeLabel(category.type),
    }));
  }

  @Mutation('editChallenge')
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @UseFilters(SmartExceptionFilter)
  @UseGuards(JwtAuthGuard)
  public async editChallenge(
    // @ts-ignore
    @Args('input', { type: () => EditChallengeInput }) input,
    @CurrentUser() currentUser: UserEntity
  ): Promise<EditChallengeOutput> {
    const result = await this.service.editChallenge(input, currentUser);
    if (result.isOk()) {
      const value = result.value;
      if (typeof value === ChallengeTrollDetectionError.name) {
        return value;
      } else {
        return value;
      }
    }
    this.logger.warn('[editChallenge] Error editing challenge', result.error);
    return {
      __typename: 'SmartError',
      message: result.error.message,
    };
  }

  @Mutation('createChallenge')
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @UseFilters(SmartExceptionFilter)
  @UseGuards(JwtAuthGuard)
  public async createChallenge(
    // @ts-ignore
    @Args('input', { type: () => CreateChallengeInput }) input,
    @CurrentUser() currentUser: UserEntity,
    @Context() context: AppContext
  ): Promise<CreateChallengeOutput> {
    const result = await this.service.createChallenge(input, currentUser);
    if (!result) return somethingWentWrongSmartError;
    if (result.errorMessage)
      return { __typename: 'SmartError', message: result.errorMessage };
    if (result?.trollDetection) {
      return this.service.toChallengeTrollDetectionError(result.trollDetection);
    }
    if (!result.createdChallenge) return somethingWentWrongSmartError;
    const challenge = result.createdChallenge.challenge;
    context.challenges[challenge.id] = challenge;
    context.user = result.createdChallenge.creator;
    return {
      __typename: 'CreateChallengeResult',
      creator: this.userService.toUserObject({
        user: result.createdChallenge.creator,
        isCurrentUserRequestingTheirDetails: true,
      }),
      challenge: this.service.toGqlChallengeObject(challenge),
    };
  }

  @Mutation('joinChallenge')
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @UseGuards(JwtAuthGuard)
  public async joinChallenge(
    // @ts-ignore
    @Args('input', { type: () => JoinChallengeInput }) input,
    @CurrentUser() currentUser: UserEntity,
    @Context() context: AppContext
  ): Promise<JoinChallengeOutput> {
    try {
      let challenge = await this.service.getChallengeEntityFromContext(
        input.id,
        context
      );
      if (challenge) {
        challenge = await this.service.joinChallenge(challenge, currentUser);
        context.challenges[challenge.id] = challenge;
        return {
          __typename: 'JoinChallengeResult',
          challenge: this.service.toGqlChallengeObject(challenge),
        };
      }
    } catch (e) {
      this.logger.error(e);
    }
    return somethingWentWrongSmartError;
  }

  @Mutation('pinChallengeEntry')
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @UseGuards(JwtAuthGuard)
  public async pinEntry(
    // @ts-ignore
    @Args('input', { type: () => PinChallengeEntryInput })
    input: PinChallengeEntryInput,
    @CurrentUser() currentUser: UserEntity,
    @Context() context: AppContext
  ): Promise<PinChallengeEntryOutput> {
    const challenge = await this.service.getChallengeEntityFromContext(
      input.challengeId,
      context
    );
    if (!challenge) {
      this.logger.error('Challenge not found', { id: input.challengeId });
      return somethingWentWrongSmartError;
    }
    const post = await this.postService.findById(input.entryId);
    if (!post) {
      this.logger.error('Challenge Entry not found', { id: input.entryId });
      return somethingWentWrongSmartError;
    }
    const result = await this.challengePostEntryService.pinUnpinEntry({
      challenge,
      currentUser,
      pinUnpinFlag: input.flag,
      post,
    });
    if (!result) return somethingWentWrongSmartError;
    if (result.errorMessage) {
      return {
        __typename: 'SmartError',
        message: result.errorMessage,
      };
    }
    context.posts[post.id] = post;
    return {
      __typename: 'PinChallengeEntryResult',
      challenge: this.service.toGqlChallengeObject(challenge),
      entry: this.postService.toGqlPostObject(post),
    };
  }

  @Mutation('leaveChallenge')
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  public async leaveChallenge(
    @Args('input', { type: () => LeaveChallengeInput })
    input: LeaveChallengeInput,
    @CurrentUser() currentUser: UserEntity,
    @Context() context: AppContext
  ): Promise<LeaveChallengeOutput> {
    const challenge = await this.service.getChallengeEntityFromContext(
      input.id,
      context
    );
    if (!challenge) throw new NotFoundException('Challenge not found');
    const updatedChallenge = await this.service.leaveChallenge({
      challenge,
      currentUser,
    });
    return {
      __typename: 'LeaveChallengeResult',
      challenge: this.service.toGqlChallengeObject(updatedChallenge),
    };
  }

  @Mutation('reportChallenge')
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  public async reportChallenge(
    @Args('input', { type: () => GetChallengeInput })
    input: ReportChallengeInput,
    @CurrentUser() currentUser: UserEntity,
    @Context() context: AppContext
  ): Promise<ReportChallengeOutput> {
    const reportChallengeResult = await this.service.reportChallenge({
      currentUser,
      challengeId: input.challengeId,
      reportType: input.type,
      context,
    });
    if (reportChallengeResult.isErr()) {
      this.logger.error('[reportChallenge] ', reportChallengeResult.error);
      if (isUserVisibleError(reportChallengeResult.error)) {
        return {
          __typename: 'SmartError',
          message: reportChallengeResult.error.message,
        };
      }
      return somethingWentWrongSmartError;
    }
    return {
      __typename: 'ReportChallengeResult',
      challenge: this.service.toGqlChallengeObject(reportChallengeResult.value),
    };
  }
}
