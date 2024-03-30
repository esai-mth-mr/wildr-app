import { Inject, UseFilters, UseGuards } from '@nestjs/common';
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
  Comment,
  Content,
  CreateImagePostInput,
  CreateMultiMediaPostInput,
  CreatePostOutput,
  CreateTextPostInput,
  CreateVideoPostInput,
  GetPostInput,
  GetPostOutput,
  ImagePost,
  Post,
  PostCommentsConnection,
  PostCommentsEdge,
  PostContext,
  ReportPostInput,
  ReportPostOutput,
  RepostInput,
  SharePostInput,
  SharePostOutput,
  TextPost,
  User,
  VideoPost,
} from '@verdzie/server/graphql';
import { CDNPvtUrlSigner } from '@verdzie/server/upload/CDNPvtUrlSigner';
import { isString } from 'class-validator';
import { default as _ } from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Logger } from 'winston';
import { CurrentUser } from '@verdzie/server/auth/current-user';
import { GraphQLExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import { CommentService } from '@verdzie/server/comment/comment.service';
import {
  AppContext,
  getImageType,
  takenDownAccountSmartError,
  toUrl,
  WithTypename,
} from '@verdzie/server/common';
import { ContentService } from '@verdzie/server/content/content.service';
import { FeedService } from '@verdzie/server/feed/feed.service';
import {
  BlockCommenterOnPostInput,
  BlockCommenterOnPostOutput,
  Challenge,
  CommentPostingAccessControlContext,
  CommentVisibilityAccessControlContext,
  DeletePostInput,
  DeletePostOutput,
  GetPostTypesOutput,
  Image,
  ImagePostProperties,
  MultiMediaPost,
  PaginationInput,
  PaginationOrder,
  PostAccessControlContext,
  PostAccessControlData,
  PostBaseType,
  PostProperties,
  PostReactorsListConnection,
  PostStats,
  ReactionType,
  ReactOnPostInput,
  ReactOnPostOutput,
  RepostAccessControlContext,
  RepostedPostsEdge,
  RepostedPostsList,
  RepostMeta,
  RepostOutput,
  TextPostProperties,
  UsersListEdge,
  VideoPostProperties,
} from '@verdzie/server/generated-graphql';
import { S3UrlPreSigner } from '@verdzie/server/upload/s3UrlPreSigner';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { PostType } from '@verdzie/server/post/data/post-type';
import {
  CreatePostResult,
  PostService,
  RepostedPostsListResult,
} from '@verdzie/server/post/post.service';
import {
  toGqlCommentPostingAccessEnum,
  toGqlCommentVisibilityAccessEnum,
  toGqlPostVisibilityAccessEnum,
} from '@verdzie/server/post/postAccessControl';
import {
  WildrMethodLatencyHistogram,
  WildrSpan,
} from '../../opentelemetry/openTelemetry.decorators';
import { kSomethingWentWrong } from '../../../constants';
import { ValidationError } from 'apollo-server-errors';
import { canShowReposts } from '@verdzie/server/data/common';
import { FindConditions } from 'typeorm';
import { ignoreRepostsPredicate } from '../post-repository/post.predicates';
import { SmartExceptionFilter } from '../../common/smart-exception.filter';
import { ChallengeService } from '@verdzie/server/challenge/challenge.service';
import { ChallengeInteractionResult } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction-result.decorator';

const postReactorsListConnection = async (
  postOrId: PostEntity | string,
  postService: PostService,
  userService: UserService,
  reactionType: ReactionType,
  first?: number,
  after?: string,
  last?: number,
  before?: string
): Promise<PostReactorsListConnection> => {
  const [users, hasPreviousPage, hasNextPage, totalCount] =
    (await postService.getReactorsList(
      postOrId,
      reactionType,
      first ?? undefined,
      after ?? undefined,
      last ?? undefined,
      before ?? undefined
    )) ?? [[], false, false, 0];
  const edges: UsersListEdge[] =
    users
      .filter(user => user !== undefined)
      .map(user => ({
        __typename: 'UsersListEdge',
        cursor: user.id,
        node: userService.toUserObject({ user }),
      })) ?? [];
  return {
    __typename: 'PostReactorsListConnection',
    count: totalCount,
    pageInfo: {
      __typename: 'PageInfo',
      startCursor: _.first(edges)?.cursor ?? '',
      endCursor: _.last(edges)?.cursor ?? '',
      hasNextPage,
      hasPreviousPage,
    },
    edges,
  };
};

@Resolver('Post')
export class PostResolver {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger,
    protected s3UrlPresigner: S3UrlPreSigner,
    protected cdnPvtS3UrlPresigner: CDNPvtUrlSigner,
    protected postService: PostService,
    protected contentService: ContentService,
    private commentService: CommentService,
    protected userService: UserService,
    private feedService: FeedService,
    protected challengeService: ChallengeService
  ) {
    this.logger = this.logger.child({ context: 'PostResolver' });
  }

  protected async toURL(url: string, id?: string): Promise<URL> {
    return toUrl(
      url,
      this.logger,
      this.s3UrlPresigner,
      this.cdnPvtS3UrlPresigner
    );
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async repost(
    @Args('input', { type: () => RepostInput }) input: RepostInput,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser: UserEntity
  ): Promise<RepostOutput> {
    if (!currentUser.isAlive()) {
      this.logger.error('repost() user TAKEN_DOWN', {
        id: currentUser.id,
      });
      return takenDownAccountSmartError;
    }
    const result: CreatePostResult | undefined = await this.postService.repost(
      currentUser,
      input
    );
    if (result?.errorMessage) {
      return {
        __typename: 'SmartError',
        message: result.errorMessage,
      };
    }
    if (!result) {
      return {
        __typename: 'SmartError',
        message: kSomethingWentWrong,
      };
    }
    if (result.trollData) {
      const indices: number[] = [];
      const results: string[] = [];
      result.trollData!.forEach((value: string | undefined, key: number) => {
        if (value) {
          indices.push(key);
          results.push(value);
        }
      });
      return {
        __typename: 'TrollDetectorError',
        message: 'Trolling Detected',
        indices: indices,
        results: results,
      };
    }
    if (result.post && result.parentPost) {
      const repost = result.post;
      ctx.repostParentPosts[repost.id] = result.parentPost;
      ctx.repostParentPosts[result.parentPost.id] = result.parentPost;
      ctx.posts[repost.id] = repost;
      ctx.posts[result.parentPost.id] = result.parentPost;
      if (repost.author) ctx.users[repost.authorId] = repost.author;
      repost.multiPostProperties = result.parentPost.multiPostProperties;
      return {
        __typename: 'RepostResult',
        post: this.postService.toGqlPostObject(result.post),
      };
    }
    return {
      __typename: 'SmartError',
      message: kSomethingWentWrong,
    };
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new SmartExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async createMultiMediaPost(
    /** ‼️ Do not add typescript type for `input`,
     * issues with graphql-upload type: https://github.com/nestjs/graphql/issues/901
     */
    // @ts-ignore
    @Args('input', { type: () => CreateMultiMediaPostInput }) input,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser: UserEntity
  ): Promise<CreatePostOutput> {
    try {
      if (!currentUser.isAlive()) {
        this.logger.info('createMultiMediaPost() User TAKEN_DOWN', {
          id: currentUser.id,
        });
        return takenDownAccountSmartError;
      }
      const result: CreatePostResult | undefined =
        await this.postService.createMultiMediaPost(currentUser, input);
      if (!result) {
        return {
          __typename: 'SmartError',
          message: 'Something went wrong',
        };
      }
      if (result.post) {
        const post = result.post;
        ctx.posts[post.id] = post;
        return {
          __typename: 'CreatePostResult',
          post: this.postService.toGqlPostObject(post)!,
        };
      } else if (result.trollData) {
        const indices: number[] = [];
        const results: string[] = [];
        result.trollData!.forEach((value: string | undefined, key: number) => {
          if (value) {
            indices.push(key);
            results.push(value);
          }
        });
        return {
          __typename: 'TrollDetectorError',
          message: 'Trolling Detected',
          indices: indices,
          results: results,
        };
      } else if (result.errorMessage) {
        return {
          __typename: 'SmartError',
          message: result.errorMessage,
        };
      }
    } catch (e) {
      this.logger.error(
        '[createMultiMediaPost] Error while creating MultiMedia post: ' + e,
        e
      );
    }
    return {
      __typename: 'SmartError',
      message: 'Something went wrong',
    };
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async createTextPost(
    // @ts-ignore
    @Args('input', { type: () => CreateTextPostInput })
    input,
    @Context() ctx: AppContext,
    @CurrentUser() user: UserEntity
  ) {
    try {
      this.logger.debug(`INPUT = ${JSON.stringify(input)}`);
      this.logger.debug(`VISIBILITY = ${input.visibility}`);
      const post = await this.postService.createTextPost(user, input);
      if (!post) {
        return;
      }
      ctx.posts[post.id] = post;
      return {
        __typename: 'CreatePostResult',
        post: this.postService.toGqlPostObject(post),
      };
    } catch (e) {
      this.logger.error('Error while creating text post: ', e);
      throw e;
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async createImagePost(
    // ‼️ Do not add typescript type for `input`, issues with graphql-upload type
    // https://github.com/nestjs/graphql/issues/901
    // @ts-ignore
    @Args('input', { type: () => CreateImagePostInput })
    input,
    @Context() ctx: AppContext,
    @CurrentUser() user: UserEntity
  ) {
    this.logger.debug('createImagePost req received, input: ', input);
    try {
      const post = await this.postService.createImagePost(user, input);
      if (!post) {
        return {};
      }
      ctx.posts[post.id] = post;
      const result = {
        __typename: 'CreatePostResult',
        post: this.postService.toGqlPostObject(post),
      };
      this.logger.debug('createImagePost resp: ', result);
      return result;
    } catch (e) {
      this.logger.debug('Got error', e);
      throw e;
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async createVideoPost(
    // ‼️ Do not add typescript type for `input`, issues with graphql-upload type
    // https://github.com/nestjs/graphql/issues/901
    // @ts-ignore
    @Args('input', { type: () => CreateVideoPostInput })
    input,
    @Context() ctx: AppContext,
    @CurrentUser() user: UserEntity
  ) {
    this.logger.debug('createVideoPost req received, input: ', input);
    try {
      const post = await this.postService.createVideoPost(user, input);
      if (!post) {
        return;
      }
      ctx.posts[post.id] = post;
      const result = {
        __typename: 'CreatePostResult',
        post: this.postService.toGqlPostObject(post),
      };
      this.logger.debug('createVideoPost resp: ', result);
      return result;
    } catch (e) {
      this.logger.debug('Got error', e);
      throw e;
    }
  }

  @Mutation()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async sharePost(
    @Args('input', { type: () => SharePostInput }) input: SharePostInput
  ): Promise<SharePostOutput> {
    try {
      const post = this.postService.toGqlPostObject(
        await this.postService.sharePost(input.postId)
      );
      return {
        __typename: 'SharePostOutput',
        post: post,
      };
    } catch (e) {
      this.logger.debug('Error while sharing: ', e);
      throw e;
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  @ChallengeInteractionResult()
  async reactOnPost(
    @Args('input', { type: () => ReactOnPostInput }) input: ReactOnPostInput,
    @CurrentUser() currentUser: UserEntity,
    @Context() context: AppContext
  ): Promise<ReactOnPostOutput> {
    context.timeStamp = new Date();
    try {
      if (!currentUser.isAlive()) return takenDownAccountSmartError;
      const postEntity = await this.postService.reactOnPost(
        currentUser,
        input.postId,
        input.reaction,
        context
      );
      if (postEntity) {
        context.posts[input.postId] = postEntity;
      }
      const post = this.postService.toGqlPostObject(
        await this.postService.findWithReactionsFeed(input.postId)
      );
      if (!post) {
        let reactionStr = 'react on this';
        switch (input.reaction) {
          case ReactionType.REAL:
            reactionStr = 'real this';
            break;
          case ReactionType.APPLAUD:
            reactionStr = 'celebrate this';
            break;
          case ReactionType.LIKE:
            reactionStr = 'like this';
            break;
        }
        return {
          __typename: 'SmartError',
          message: `Unable to ${reactionStr} post`,
        };
      }
      return {
        __typename: 'ReactOnPostResult',
        post: post,
      };
    } catch (e: unknown) {
      this.logger.error('Error while reacting on a post: ', {
        error: e instanceof Error ? e.message : 'error',
      });
      let message = 'Unable to react on this post';
      if (e instanceof ValidationError) {
        message = e.message;
      }
      return {
        __typename: 'SmartError',
        message,
      };
    }
  }

  @Query()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getPostTypes(
    @CurrentUser() currentUser: UserEntity,
    @Args('') args?: string
  ): Promise<GetPostTypesOutput> {
    const postTypeInterestMap = await this.userService.getPostTypeInterestsMap(
      currentUser.id
    );
    let postTypeInterests;
    if (postTypeInterestMap) {
      postTypeInterests = Array.from(postTypeInterestMap.keys());
    }
    return {
      __typename: 'GetPostTypesResult',
      postTypes: Object.keys(PostType)
        .filter(e => isNaN(Number(e)))
        .filter(name => name !== 'AUDIO')
        .map(name => {
          return {
            __typename: 'PostType',
            name,
            value: PostType[name as keyof typeof PostType],
          };
        }),
      userPostTypeInterests: postTypeInterests,
    };
  }

  @Query()
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getPost(
    @Args('input') input: GetPostInput,
    @Context() context: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<GetPostOutput> {
    let predicate: FindConditions<PostEntity> | undefined;
    if (!canShowReposts(context.version)) {
      predicate = ignoreRepostsPredicate;
      this.logger.info("Can't show reposts");
    }
    const post =
      await this.postService.findWithAuthorAndParentChallengeRelation(
        input?.id ?? '',
        predicate
      );
    if (!post) {
      return {
        __typename: 'SmartError',
        message: 'Sorry, post not found',
      };
    }
    if (post.isRepost()) {
      if (!post.repostMeta?.parentPostId) {
        this.logger.info('Repost parentPostId not found', { id: post.id });
        return {
          __typename: 'SmartError',
          message: kSomethingWentWrong,
        };
      }
    }
    const cannotViewPostErrorMessage =
      await this.postService.cannotViewPostErrorMessage(
        currentUser?.id,
        post,
        true,
        true
      );
    if (cannotViewPostErrorMessage) {
      return {
        __typename: 'SmartError',
        message: cannotViewPostErrorMessage,
      };
    }
    if (post.isPrivate) {
      if (!currentUser) {
        return {
          __typename: 'SmartError',
          message: 'Please login to view this private post',
        };
      }
      if (currentUser.id !== post.authorId) {
        const followingsFeed = await this.feedService.find(
          currentUser.followingFeedId ?? ''
        );
        if (!followingsFeed) {
          return {
            __typename: 'SmartError',
            message: 'Please follow this user to view this post',
          };
        } else {
          if (!followingsFeed.page.ids.includes(post.authorId)) {
            return {
              __typename: 'SmartError',
              message: 'Please follow this user to view this post',
            };
          }
        }
      }
    }
    if (post.isRepost()) {
      const parentPost = await this.postService.findById(
        post.repostMeta!.parentPostId!
      );
      if (!context.repostParentPosts) context.repostParentPosts = {};
      context.repostParentPosts[post.id] = parentPost;
    } else {
      context.repostParentPosts[post.id] = post;
    }
    context.users[post.authorId] = post.author!;
    context.posts[post.id] = post;
    return {
      __typename: 'GetPostResult',
      post: this.postService.toGqlPostObject(post),
    };
  }

  @ResolveField()
  __resolveType(value: WithTypename) {
    return value.__typename;
  }

  @Mutation()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async reportPost(
    @Args('input', { type: () => ReportPostInput })
    input: ReportPostInput,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<ReportPostOutput> {
    try {
      if (currentUser?.isTakenDown() ?? false)
        return takenDownAccountSmartError;
      const postOrErrorMessage = await this.postService.report(
        input.postId,
        input.type,
        currentUser
      );
      if (isString(postOrErrorMessage)) {
        this.logger.error('post.resolver: Reply for reporting: ', {
          replyOrErrorMessage: postOrErrorMessage,
        });
        return {
          __typename: 'SmartError',
          message: postOrErrorMessage,
        };
      }
      ctx.posts[input.postId] = postOrErrorMessage;
      return {
        __typename: 'ReportPostResult',
        post: this.postService.toGqlPostObject(postOrErrorMessage),
      };
    } catch (e) {
      this.logger.error('Error while reporting a post: ', e);
      return {
        __typename: 'SmartError',
        message: 'Error while reporting this post',
      };
    }
  }

  @Mutation()
  @UseGuards(JwtAuthGuard)
  @UseFilters(new GraphQLExceptionFilter())
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async deletePost(
    @Args('input', { type: () => DeletePostInput })
    input: DeletePostInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<DeletePostOutput> {
    this.logger.debug('Received delete request', {
      input: input,
      userId: currentUser?.id,
      method: 'deletePost',
    });
    try {
      if (!currentUser) {
        this.logger.error('no `currentUser` found', { method: 'deletePost' });
        return {
          __typename: 'SmartError',
          message: 'Something went wrong',
        };
      }
      const postOrError = await this.postService.softDelete(
        input.postId,
        currentUser
      );
      if (isString(postOrError)) {
        this.logger.error('Error deleting post', {
          postId: input.postId,
          error: postOrError,
          method: 'deletePost',
        });
        return {
          __typename: 'SmartError',
          message: postOrError,
        };
      } else {
        this.logger.info('Deleted post', {
          postId: postOrError.id,
          method: 'deletePost',
        });
        return {
          __typename: 'DeletePostResult',
          post: this.postService.toGqlPostObject(postOrError),
        };
      }
    } catch (e) {
      this.logger.error('Exception while deleting post', {
        error: e,
        method: 'deletePost',
        postId: input.postId,
      });
      return {
        __typename: 'SmartError',
        message: 'Something went wrong',
      };
    }
  }

  @Mutation()
  @UseGuards(OptionalJwtAuthGuard)
  @UseFilters(SmartExceptionFilter)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async blockCommenterOnPost(
    @Args('input', { type: () => BlockCommenterOnPostInput })
    input: BlockCommenterOnPostInput,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<BlockCommenterOnPostOutput> {
    const result = await this.postService.blockCommenterOnPost(
      input.postId,
      input.commenterId,
      input.operation,
      currentUser
    );
    return {
      __typename: 'BlockCommenterOnPostResult',
      operation: result.blockOperationType,
      commenterId: result.commenterId,
      postId: result.postId,
    };
  }

  @ResolveField(() => PostCommentsConnection, { name: 'commentsConnection' })
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async commentsConnection(
    @Args('postId') postId: string,
    @Args('first') first: number,
    @Args('after') after: string,
    @Args('last') last: number,
    @Args('before') before: string,
    @Args('includingAndAfter') includingAndAfter: string,
    @Args('includingAndBefore') includingAndBefore: string,
    @Args('paginationInput') paginationInput: PaginationInput | undefined,
    @Args('targetCommentId') targetCommentId: string | undefined,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<PostCommentsConnection> {
    const post: PostEntity = ctx.posts[postId];
    const cannotViewComments =
      await this.postService.canViewCommentsStatusAndMessage(
        currentUser?.id,
        post,
        true
      );
    const canViewComments = cannotViewComments.canViewComments;
    if (post.isParentPostDeleted() || !canViewComments) {
      return {
        __typename: 'PostCommentsConnection',
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
    if (!paginationInput) {
      //Backward compatible pagination input
      paginationInput = {
        after,
        before,
        take: first ?? last,
        order: PaginationOrder.OLDEST_FIRST,
        includingAndBefore,
        includingAndAfter,
      };
    }
    const { comments, hasPreviousPage, hasNextPage, targetCommentError } =
      await this.postService.findComments({
        postOrId: post ?? postId,
        first,
        after,
        includingAndAfter,
        last,
        before,
        includingAndBefore,
        paginationInput,
        currentUserIsAuthor:
          currentUser !== undefined && post?.authorId === currentUser?.id,
        currentUserId: currentUser?.id,
        targetCommentId,
      });
    const edges: PostCommentsEdge[] = comments
      .filter(comment => comment !== undefined)
      .map(comment => {
        ctx.comments[comment.id] = comment;
        return {
          __typename: 'PostCommentsEdge',
          node: this.commentService.toCommentObject(comment),
          cursor: comment.id,
        };
      });
    return {
      __typename: 'PostCommentsConnection',
      pageInfo: {
        __typename: 'PageInfo',
        startCursor: _.first(edges)?.cursor ?? '',
        endCursor: _.last(edges)?.node.id ?? '',
        hasNextPage,
        hasPreviousPage,
      },
      targetCommentError,
      edges: edges ?? [],
    };
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async canComment(
    @Parent() parent: Post,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<boolean> {
    if (!currentUser) {
      this.logger.error('canComment() currentUser not found', {
        postId: parent.id,
      });
      return false;
    }
    if (!ctx.posts[parent.id]) {
      const post =
        await this.postService.findWithAuthorAndParentChallengeRelation(
          parent.id
        );
      if (!post) return false;
      ctx.posts[parent.id] = post;
      ctx.users[post.authorId] = post.author!;
    }
    const post = ctx.posts[parent.id];
    this.postService.getBackwardsCompatibleAccessControl(post);
    const cannotCommentErrorMessage =
      await this.postService.cannotCommentErrorMessage(currentUser.id, post);
    return cannotCommentErrorMessage === undefined;
  }

  @ResolveField(() => PostAccessControlData, { name: 'accessControl' })
  @UseGuards(OptionalJwtAuthGuard)
  accessControlData(
    @Parent() parent: Post,
    @Context() ctx: AppContext
  ): PostAccessControlData {
    const post = ctx.posts[parent.id];
    const result: PostAccessControlData = {
      __typename: 'PostAccessControlData',
    };
    if (post.accessControl) {
      result.postVisibility = toGqlPostVisibilityAccessEnum(
        post.accessControl.postVisibilityAccessData.access
      );
      result.commentPostingAccess = toGqlCommentPostingAccessEnum(
        post.accessControl.commentPostingAccessData.access
      );
      result.commentVisibilityAccess = toGqlCommentVisibilityAccessEnum(
        post.accessControl.commentVisibilityAccessData.access
      );
    }
    return result;
  }

  private async getPostFromGqlPostObj(
    gqlPostObject: Post,
    ctx: AppContext
  ): Promise<PostEntity | undefined> {
    if (ctx.posts[gqlPostObject.id]) return ctx.posts[gqlPostObject.id];
    const post =
      await this.postService.findWithAuthorAndParentChallengeRelation(
        gqlPostObject.id
      );
    if (!post) return;
    ctx.posts[gqlPostObject.id] = post;
    ctx.users[post.authorId] = post.author!;
  }

  @ResolveField(() => CommentVisibilityAccessControlContext, {
    name: 'commentVisibilityAccessControlContext',
  })
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async commentVisibilityAccessControlContext(
    @Parent() gqlPostObject: Post,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<CommentVisibilityAccessControlContext | undefined> {
    const post = await this.getPostFromGqlPostObj(gqlPostObject, ctx);
    if (!post) return;
    const status = await this.postService.canViewCommentsStatusAndMessage(
      currentUser?.id,
      post
    );
    const accessControl =
      this.postService.getBackwardsCompatibleAccessControl(post);
    return {
      __typename: 'CommentVisibilityAccessControlContext',
      canViewComment: status.canViewComments,
      cannotViewCommentErrorMessage: status.errorMessage,
      commentVisibilityAccess: toGqlCommentVisibilityAccessEnum(
        accessControl.commentVisibilityAccessData.access
      ),
    };
  }

  @ResolveField(() => CommentPostingAccessControlContext, {
    name: 'commentPostingAccessControlContext',
  })
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async commentPostingAccessControlContext(
    @Parent() gqlPostObject: Post,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<CommentPostingAccessControlContext | undefined> {
    const post = await this.getPostFromGqlPostObj(gqlPostObject, ctx);
    if (!post) return;
    const cannotCommentErrorMessage =
      await this.postService.cannotCommentErrorMessage(currentUser?.id, post);
    const accessControl =
      this.postService.getBackwardsCompatibleAccessControl(post);
    return {
      __typename: 'CommentPostingAccessControlContext',
      canComment: cannotCommentErrorMessage === undefined,
      cannotCommentErrorMessage,
      commentPostingAccess: toGqlCommentPostingAccessEnum(
        accessControl.commentPostingAccessData.access
      ),
    };
  }

  @ResolveField()
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async isPinnedToChallenge(
    @Parent()
    parent: Post,
    @Context()
    context: AppContext
  ): Promise<boolean | undefined> {
    if (!parent.parentChallengeId) {
      return;
    }
    if (parent.isPinnedToChallenge) {
      return parent.isPinnedToChallenge;
    }
    const isPinnedResult = await this.postService.isPinnedToChallenge({
      postId: parent.id,
      challengeId: parent.parentChallengeId,
      context,
    });
    if (isPinnedResult.isErr()) {
      // this.logger.error(isPinnedResult.error);
      return;
    }
    return isPinnedResult.value;
  }

  @ResolveField()
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async isHiddenOnChallenge(
    @Parent()
    parent: Post,
    @Context()
    context: AppContext,
    @CurrentUser()
    currentUser?: UserEntity
  ): Promise<boolean> {
    if (parent.isHiddenOnChallenge === true) {
      return true;
    }
    if (!parent.parentChallengeId) {
      return false;
    }
    const isHiddenResult =
      await this.challengeService.checkIfPostIsHiddenOnChallenge({
        challengeId: parent.parentChallengeId,
        postId: parent.id,
        context,
        currentUser,
      });
    if (isHiddenResult.isErr()) {
      this.logger.error('[isHiddenOnChallenge]', isHiddenResult.error);
      return false;
    }
    return isHiddenResult.value;
  }

  @ResolveField(() => RepostAccessControlContext, {
    name: 'repostAccessControlContext',
  })
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async repostAccessControlContext(
    @Parent() gqlPostObject: Post,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<RepostAccessControlContext | undefined> {
    const post = await this.getPostFromGqlPostObj(gqlPostObject, ctx);
    if (!post)
      return {
        __typename: 'RepostAccessControlContext',
        cannotRepostErrorMessage: 'Reposting not allowed for this post',
        canRepost: false,
      };
    const hasReposted = await this.postService.hasReposted(post, currentUser);
    const cannotRepostErrorMessage =
      this.postService.repostDenyErrorMessage(post);
    return {
      __typename: 'RepostAccessControlContext',
      cannotRepostErrorMessage,
      canRepost: cannotRepostErrorMessage === undefined,
      hasReposted,
    };
  }

  /**
   * @deprecated This context has been split it sub context,
   * check {@link commentVisibilityAccessControlContext} and
   * {@link commentPostingAccessControlContext}
   */
  @ResolveField(() => PostAccessControlContext, {
    name: 'accessControlContext',
  })
  @UseGuards(OptionalJwtAuthGuard)
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async accessControlContext(
    @Parent() gqlPostObject: Post,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<PostAccessControlContext | undefined> {
    const post = await this.getPostFromGqlPostObj(gqlPostObject, ctx);
    if (!post) return;
    const accessControl =
      this.postService.getBackwardsCompatibleAccessControl(post);
    const cannotCommentErrorMessage =
      await this.postService.cannotCommentErrorMessage(currentUser?.id, post);
    const canViewCommentsStatusAndMessage =
      await this.postService.canViewCommentsStatusAndMessage(
        currentUser?.id,
        post
      );
    return {
      __typename: 'PostAccessControlContext',
      commentVisibilityAccess: toGqlCommentVisibilityAccessEnum(
        accessControl.commentVisibilityAccessData.access
      ),
      postVisibility: toGqlPostVisibilityAccessEnum(
        accessControl.postVisibilityAccessData.access
      ),
      commentPostingAccess: toGqlCommentPostingAccessEnum(
        accessControl.commentPostingAccessData.access
      ),
      cannotCommentErrorMessage,
      cannotViewCommentErrorMessage:
        canViewCommentsStatusAndMessage.errorMessage,
      canComment: cannotCommentErrorMessage === undefined,
      canViewComment: canViewCommentsStatusAndMessage.canViewComments,
    };
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async author(
    @Parent() parent: Post,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<User | undefined> {
    if (!ctx.posts[parent.id]) {
      const post = await this.postService.findWithAuthorRelation(parent.id);
      if (!post) return undefined;
      ctx.posts[parent.id] = post;
      ctx.users[post.authorId] = post.author!;
    }
    const post = ctx.posts[parent.id];
    if (!ctx.users[post.authorId]) {
      const author =
        post.author ?? (await this.userService.findById(post.authorId));
      if (author) ctx.users[post.authorId] = author;
    }
    return this.userService.toUserObject({ user: ctx.users[post.authorId] });
  }

  @ResolveField()
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async postContext(
    @Parent() parent: Post,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<PostContext | undefined> {
    if (!currentUser || !parent) return undefined;
    const post = ctx.posts[parent.id];
    if (post?.isParentPostDeleted()) {
      this.logger.info(
        'No longer returning post context is parentPostIsDeleted'
      );
      return {};
    }
    return this.userService.getPostContext(currentUser, parent.id);
  }

  @ResolveField(() => Comment, { name: 'pinnedComment' })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async pinnedComment(
    @Parent() post: Post,
    @Context('post') postEntity?: PostEntity
  ): Promise<Comment | undefined> {
    if (postEntity?.pinnedComment)
      return this.commentService.toCommentObject(postEntity.pinnedComment);
    if (postEntity?.pinnedCommentId) {
      const comment = await this.commentService.findByIdWithAuthor(
        postEntity.pinnedCommentId
      );
      if (!comment) return undefined;
      if (comment) return this.commentService.toCommentObject(comment);
    }
    const comment = (await this.postService.findWithPinnedComment(post.id))
      ?.pinnedComment;
    if (!comment) return undefined;
    if (comment.willBeDeleted) return undefined;
    return this.commentService.toCommentObject(comment);
  }

  @ResolveField(() => PostReactorsListConnection, {
    name: 'realReactorsUserListConnection',
  })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getRealReactorsUserListConnection(
    @Args('postId') postId: string,
    @Args('first') first: number,
    @Args('after') after: string,
    @Args('last') last: number,
    @Args('before') before: string,
    @Context('post') post?: PostEntity
  ): Promise<PostReactorsListConnection> {
    return await postReactorsListConnection(
      post ?? postId,
      this.postService,
      this.userService,
      ReactionType.REAL,
      first,
      after,
      last,
      before
    );
  }

  @ResolveField(() => PostReactorsListConnection, {
    name: 'applaudReactorsUserListConnection',
  })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getApplaudReactorsUserListConnection(
    @Args('postId') postId: string,
    @Args('first') first: number,
    @Args('after') after: string,
    @Args('last') last: number,
    @Args('before') before: string,
    @Context('post') post?: PostEntity
  ): Promise<PostReactorsListConnection> {
    return await postReactorsListConnection(
      post ?? postId,
      this.postService,
      this.userService,
      ReactionType.APPLAUD,
      first,
      after,
      last,
      before
    );
  }

  @ResolveField(() => PostReactorsListConnection, {
    name: 'likeReactorsUserListConnection',
  })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async getLikeReactorsUserListConnection(
    @Args('postId') postId: string,
    @Args('first') first: number,
    @Args('after') after: string,
    @Args('last') last: number,
    @Args('before') before: string,
    @Context('post') post?: PostEntity
  ): Promise<PostReactorsListConnection> {
    return await postReactorsListConnection(
      post ?? postId,
      this.postService,
      this.userService,
      ReactionType.LIKE,
      first,
      after,
      last,
      before
    );
  }
} //end of PostResolver

@Resolver('MultiMediaPost')
export class MultiMediaPostResolver extends PostResolver {
  @ResolveField(
    () => <TextPostProperties | ImagePostProperties | VideoPostProperties>[],
    {
      name: 'properties',
    }
  )
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async properties(
    @Parent() parent: MultiMediaPost,
    @Context() ctx: AppContext
  ): Promise<
    | (TextPostProperties | ImagePostProperties | VideoPostProperties)[]
    | undefined
  > {
    let tempPost: PostEntity | undefined = ctx.posts[parent.id];
    if (!tempPost) {
      const post = await this.postService.findById(parent.id);
      if (post) {
        ctx.posts[parent.id] = post;
      } else {
        return undefined;
      }
      tempPost = post;
    }
    const post = tempPost;
    const properties: PostProperties[] = [];
    if (post.isRepost()) {
      // if(post.isParentPostDeleted()) return undefined;
      const parentPost = ctx.repostParentPosts[post.id];
      if (!parentPost) {
        return undefined;
      }
      if (parentPost.willBeDeleted !== true)
        post.multiPostProperties = parentPost.multiPostProperties;
    }
    if (post.multiPostProperties) {
      for (const property of post.multiPostProperties) {
        if (property.type === 'TextPostProperties') {
          const prop: TextPostProperties = { __typename: 'TextPostProperties' };
          prop.content = await this.contentService.resolve(
            property.content,
            property.bodyStr
          );
          properties.push(prop);
        } else if (property.type === 'ImagePostProperties') {
          const prop: ImagePostProperties = {
            __typename: 'ImagePostProperties',
          };
          prop.image = {
            __typename: 'Image',
            id: property.imageFile.id,
            source: {
              __typename: 'MediaSource',
              uri: this.toURL(property.imageFile.path, post.id),
            },
            type: getImageType(property.imageFile.type),
          };
          if (property.thumbnailFile) {
            prop.thumbnail = {
              __typename: 'Image',
              id: property.thumbnailFile.id,
              source: {
                __typename: 'MediaSource',
                uri: this.toURL(property.thumbnailFile.path, post.id),
              },
              type: getImageType(property.thumbnailFile.type),
            };
          }
          properties.push(prop);
        } else if (property.type === 'VideoPostProperties') {
          const prop: VideoPostProperties = {
            __typename: 'VideoPostProperties',
          };
          prop.video = {
            __typename: 'Video',
            id: property.videoFile.id,
            source: {
              __typename: 'MediaSource',
              uri: this.toURL(property.videoFile.path, post.id),
            },
            type: this.postService.getVideoType(property.videoFile.type),
          };
          if (property.thumbnailFile) {
            prop.thumbnail = {
              __typename: 'Image',
              id: property.thumbnailFile.id,
              source: {
                __typename: 'MediaSource',
                uri: this.toURL(property.thumbnailFile.path, post.id),
              },
              type: getImageType(property.thumbnailFile.type),
            };
          }
          properties.push(prop);
        }
      }
    } else {
      this.logger.warn('post.multiPostProperties not found');
    }
    if (properties.length === 0) {
      return undefined;
    } else {
      return properties;
    }
  }

  @ResolveField(() => Content, { name: 'caption' })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async caption(
    @Parent() parent: MultiMediaPost,
    @Context() ctx: AppContext
  ): Promise<Content | undefined> {
    if (!ctx.posts[parent.id]) {
      const post = await this.postService.findById(parent.id);
      if (post) ctx.posts[parent.id] = post;
    }
    const post = ctx.posts[parent.id];
    if (!post.caption) {
      return undefined;
    }
    return this.contentService.resolve(post.caption, post.captionBodyStr);
  }

  @ResolveField(() => Content, { name: 'parentChallenge' })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async parentChallenge(
    @Parent() parent: MultiMediaPost,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<Challenge | undefined> {
    if (!ctx.posts[parent.id]) {
      const post = await this.postService.findById(parent.id);
      if (post) ctx.posts[parent.id] = post;
    }
    const post = ctx.posts[parent.id];
    if (!post.parentChallengeId) {
      return undefined;
    }
    const challenge =
      post.parentChallenge ??
      ctx.challenges[post.parentChallengeId] ??
      (await this.challengeService.findById({ id: post.parentChallengeId }));
    if (!challenge) return undefined;
    if (!ctx.challenges[post.parentChallengeId]) {
      ctx.challenges[post.parentChallengeId] = challenge;
    }
    const gqlChallengeObj =
      this.challengeService.toGqlChallengeObject(challenge);
    gqlChallengeObj.isOwner = challenge.authorId === currentUser?.id;
    return gqlChallengeObj;
  }

  @ResolveField(() => Image, { name: 'thumbnail' })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async thumbnail(
    @Parent() parent: MultiMediaPost,
    @Context() ctx: AppContext
  ): Promise<Image | undefined> {
    let tempPost: PostEntity | undefined = ctx.posts[parent.id];
    if (!tempPost) {
      const post = await this.postService.findById(parent.id);
      if (post) ctx.posts[parent.id] = post;
      else return undefined;
      tempPost = post;
    }
    const post = tempPost;
    if (!post.thumbnailFile) return undefined;
    return {
      __typename: 'Image',
      id: post.thumbnailFile.id,
      source: {
        __typename: 'MediaSource',
        uri: this.toURL(post.thumbnailFile.path, post.id),
      },
      type: getImageType(post.thumbnailFile.type),
    };
  }

  @ResolveField(() => RepostMeta, { name: 'repostMeta' })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  public async repostMeta(
    @Parent() repost: Post,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity,
    @Args('repostedPostsPaginationInput')
    repostedPostsPaginationInput?: PaginationInput
  ): Promise<RepostMeta | undefined> {
    const parentPost = ctx.repostParentPosts[repost.id];
    if (
      !parentPost &&
      (repost.baseType === PostBaseType.REPOST ||
        repost.baseType === PostBaseType.REPOST_STORY)
    ) {
      this.logger.warn('repostMeta() ParentPost not found for Repost');
    }
    let repostedPosts: RepostedPostsList | undefined;
    if (parentPost && repostedPostsPaginationInput) {
      const result: RepostedPostsListResult =
        await this.postService.getRepostedPostsList(
          parentPost!.id,
          repostedPostsPaginationInput
        );
      const edges: RepostedPostsEdge[] = [];
      const blockedUsersList: string[] =
        await this.userService.getBlockedUsersList({
          userId: currentUser?.id,
          userEntity: currentUser,
        });
      result.posts = result.posts.filter(
        post => !blockedUsersList.includes(post.authorId)
      );
      for (const repostEntity of result.posts) {
        if (!repostEntity) continue;
        ctx.repostParentPosts[repostEntity.id] = parentPost;
        ctx.posts[repostEntity.id] = repostEntity;
        const node = this.postService.toGqlPostObject(repostEntity, parentPost);
        if (!node) {
          this.logger.info('Node is empty', { id: repostEntity?.id });
          continue;
        }
        edges.push({
          __typename: 'RepostedPostsEdge',
          cursor: repostEntity.id,
          node,
        });
      }
      repostedPosts = {
        __typename: 'RepostedPostsList',
        pageInfo: {
          __typename: 'PageInfo',
          startCursor: _.first(edges)?.node.id ?? '',
          endCursor: _.last(edges)?.node.id ?? '',
          ...result,
          hasNextPage: result.hasMoreItems,
          hasPreviousPage: result.hasPreviousItems,
        },
        edges,
      };
    }
    return {
      __typename: 'RepostMeta',
      isParentPostDeleted: parentPost === undefined,
      count: parentPost?.repostMeta?.repostCount,
      parentPost: this.postService.toGqlPostObject(parentPost),
      repostedPosts,
    };
  }

  @ResolveField(() => PostStats, { name: 'stats' })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async stats(
    @Parent() post: Post,
    @Context() ctx: AppContext,
    @CurrentUser() currentUser?: UserEntity
  ): Promise<PostStats | undefined> {
    const postEntity = ctx.posts[post.id];
    if (!postEntity || postEntity.willBeDeleted == true) {
      this.logger.debug('[stats] parent post is deleted, returning', {
        postId: post.id,
      });
      return;
    }
    return await this.postService.getStatsForUser(postEntity, currentUser);
  }
}

@Resolver('TextPost')
export class TextPostResolver extends PostResolver {
  @ResolveField(() => Content, { name: 'content' })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async content(
    @Parent() parent: TextPost,
    @Context() ctx: AppContext
  ): Promise<Content | undefined> {
    if (!ctx.posts[parent.id]) {
      const post = await this.postService.findById(parent.id);
      if (post) ctx.posts[parent.id] = post;
      else return undefined;
    }
    const post = ctx.posts[parent.id];
    if (!post) return undefined;
    if (post.properties.type !== 'TextPostProperties') {
      this.logger.error(
        'TextPostProperties not found for text post: ',
        post.id
      );
      return undefined;
    }
    return this.contentService.resolve(
      post.properties.content,
      post.captionBodyStr
    );
  }
}

@Resolver('ImagePost')
export class ImagePostResolver extends PostResolver {
  @ResolveField(() => Content, { name: 'caption' })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async caption(
    @Parent() parent: ImagePost,
    @Context() ctx: AppContext
  ): Promise<Content | undefined> {
    this.logger.debug(`ImagePostResolver Parent = ${JSON.stringify(parent)}`);
    if (!ctx.posts[parent.id]) {
      const post = await this.postService.findById(parent.id);
      if (post) ctx.posts[parent.id] = post;
    }
    const post = ctx.posts[parent.id];
    if (post.properties.type !== 'ImagePostProperties') {
      this.logger.error(
        'ImagePostProperties not found for text post: ',
        post.id
      );
      return undefined;
    }
    if (!post.properties.caption) return undefined;
    return this.contentService.resolve(
      post.properties.caption,
      post.captionBodyStr
    );
  }
}

@Resolver('VideoPost')
export class VideoPostResolver extends PostResolver {
  @ResolveField(() => Content, { name: 'caption' })
  @WildrSpan()
  @WildrMethodLatencyHistogram()
  async caption(
    @Parent() parent: VideoPost,
    @Context() ctx: AppContext
  ): Promise<Content | undefined> {
    if (!ctx.posts[parent.id]) {
      const post = await this.postService.findById(parent.id);
      if (post) ctx.posts[parent.id] = post;
    }
    const post = ctx.posts[parent.id];
    if (!post || post.properties.type !== 'VideoPostProperties') {
      this.logger.error(
        'VideoPostProperties not found for post: ',
        post?.id ?? 'undefined'
      );
      return undefined;
    }
    if (!post.properties.caption) return undefined;
    return this.contentService.resolve(
      post.properties.caption,
      post.captionBodyStr
    );
  }
}
