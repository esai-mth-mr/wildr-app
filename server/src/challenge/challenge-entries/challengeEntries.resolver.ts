import { AppContext, notEmpty } from '@verdzie/server/common';
import {
  ChallengeEntriesConnection,
  ChallengeEntryEdge,
  PaginationInput,
} from '@verdzie/server/generated-graphql';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  ChallengeEntryType,
  GetChallengeEntriesResult,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { Args, Context, ResolveField, Resolver } from '@nestjs/graphql';
import {
  WildrMethodLatencyHistogram,
  WildrSpan,
} from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { Inject, UseGuards } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ChallengeEntriesService } from '@verdzie/server/challenge/challenge-entries/challengeEntries.service';
import { ChallengeService } from '@verdzie/server/challenge/challenge.service';
import { PostService } from '@verdzie/server/post/post.service';
import { first, last } from 'lodash';
import { OptionalJwtAuthGuard } from '@verdzie/server/auth/jwt-auth.guard';

@Resolver('Challenge')
export class ChallengeEntriesResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger,
    private readonly service: ChallengeService,
    private readonly entriesService: ChallengeEntriesService,
    private readonly postService: PostService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  private async getEntries({
    ctx,
    challengeId,
    paginationInput,
    targetEntryId,
    currentUser,
    entryType,
    userToSearchForId,
  }: {
    ctx: AppContext;
    challengeId: string;
    paginationInput: PaginationInput;
    targetEntryId?: string;
    currentUser?: UserEntity;
    entryType: ChallengeEntryType;
    userToSearchForId?: string;
  }): Promise<ChallengeEntriesConnection | undefined> {
    const challenge = await this.service.getChallengeEntityFromContext(
      challengeId,
      ctx
    );
    if (!challenge) {
      this.logger.warn('[getEntries] Challenge not found', {
        methodName: 'getEntries',
        challengeId,
      });
      return;
    }
    const result: GetChallengeEntriesResult | undefined =
      await this.entriesService.getEntries({
        challenge,
        paginationInput,
        targetEntryId,
        currentUser,
        entryType,
        userToSearchForId,
        timezoneOffset: ctx.timezoneOffset,
      });
    if (!result) {
      return {
        __typename: 'ChallengeEntriesConnection',
        pageInfo: {
          __typename: 'PageInfo',
          hasNextPage: false,
          hasPreviousPage: false,
          totalCount: 0,
        },
        userToSearchForId,
        edges: [],
      };
    }
    const edges: ChallengeEntryEdge[] = [];
    for (const entry of result.entries) {
      const postEntity = entry.post;
      ctx.posts[postEntity.id] = postEntity;
      ctx.repostParentPosts[postEntity.id] = postEntity;
      const node = this.postService.toGqlPostObject(postEntity);
      if (notEmpty(node)) {
        node.isHiddenOnChallenge = entry.isHidden;
        node.isPinnedToChallenge = entry.isPinned;
        edges.push({
          __typename: 'ChallengeEntryEdge',
          cursor: postEntity.id,
          node,
        });
      }
    }
    return {
      __typename: 'ChallengeEntriesConnection',
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: result.hasMoreItems,
        hasPreviousPage: result.hasPreviousItems,
        startCursor: first(result.entries)?.post.id,
        endCursor: last(result.entries)?.post.id,
        count: result.count,
        totalCount: result.totalCount,
      },
      userToSearchForId,
      edges,
      targetEntryError: result.targetEntryError,
    };
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async allEntriesConnection(
    @Context() ctx: AppContext,
    @Args('challengeId') challengeId: string,
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('targetEntryId') targetEntryId?: string,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ChallengeEntriesConnection | undefined> {
    return await this.getEntries({
      ctx,
      challengeId,
      paginationInput,
      targetEntryId,
      currentUser,
      entryType: ChallengeEntryType.ALL,
    });
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async featuredEntriesConnection(
    @Context() ctx: AppContext,
    @Args('challengeId') challengeId: string,
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('targetEntryId') targetEntryId?: string,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ChallengeEntriesConnection | undefined> {
    return await this.getEntries({
      ctx,
      challengeId,
      paginationInput,
      targetEntryId,
      currentUser,
      entryType: ChallengeEntryType.FEATURED,
    });
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async todayEntriesConnection(
    @Context() ctx: AppContext,
    @Args('challengeId') challengeId: string,
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('targetEntryId') targetEntryId?: string,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ChallengeEntriesConnection | undefined> {
    return await this.getEntries({
      ctx,
      challengeId,
      paginationInput,
      targetEntryId,
      currentUser,
      entryType: ChallengeEntryType.TODAY,
    });
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @UseGuards(OptionalJwtAuthGuard)
  public async currentUserEntriesConnection(
    @Context() ctx: AppContext,
    @Args('challengeId') challengeId: string,
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('targetEntryId') targetEntryId?: string,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ChallengeEntriesConnection | undefined> {
    return await this.getEntries({
      ctx,
      challengeId,
      paginationInput,
      targetEntryId,
      currentUser,
      entryType: ChallengeEntryType.USER,
    });
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @UseGuards(OptionalJwtAuthGuard)
  public async userEntriesConnection(
    @Context() ctx: AppContext,
    @Args('challengeId') challengeId: string,
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('userToSearchForId') userToSearchForId: string,
    @Args('targetEntryId') targetEntryId?: string,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ChallengeEntriesConnection | undefined> {
    return await this.getEntries({
      ctx,
      challengeId,
      paginationInput,
      targetEntryId,
      currentUser,
      entryType: ChallengeEntryType.USER,
      userToSearchForId,
    });
  }
}
