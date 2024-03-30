import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PaginateEntriesResponse } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';
import {
  backwardCompatiblePostAccessControl,
  defaultPostAccessControl,
  fromGqlPostAccessControl,
  PostAccessControl,
  PostVisibilityAccess,
  RepostAccess,
} from '@verdzie/server/post/postAccessControl';
import {
  PostBaseType,
  toGqlPostBaseType,
} from '@verdzie/server/post/postBaseType.enum';
import { toGqlPostKind } from '@verdzie/server/post/postType.enum';
import { innerCircleListId } from '@verdzie/server/user-list/userList.helpers';
import { UserListService } from '@verdzie/server/user-list/userList.service';
import { DistributeAnnotatedPostProducer } from '@verdzie/server/worker/distribute-annotated-post/distributeAnnotatedPost.producer';
import { NotifyAboutMentionProducer } from '@verdzie/server/worker/notify-about-mention/notifyAboutMention.producer';
import { NotifyAboutRepostProducer } from '@verdzie/server/worker/notify-about-repost/notifyAboutRepost.producer';
import { RepostParentDeletedProducer } from '@verdzie/server/worker/repost-parent-deleted/repostParentDeleted.producer';
import { ValidationError } from 'apollo-server-errors';
import { default as _ } from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { FindConditions, ObjectID, UpdateResult } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Logger } from 'winston';
import {
  kBlockedUserAbleToViewContentCode,
  kSomethingWentWrong,
} from '../../constants';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import {
  CommentParentType,
  CommentService,
  PaginateCommentsResult,
} from '@verdzie/server/comment/comment.service';
import {
  AppContext,
  getImageType,
  isSubset,
  retryWithBackoff,
  toUrl,
  updateUserIdPageIndexMap,
} from '@verdzie/server/common';
import { generateId, ID_SEPARATOR } from '@verdzie/server/common/generateId';
import { WildrExceptionDecorator } from '@verdzie/server/common/wildr-exception.decorator';
import { ContentIO } from '@verdzie/server/content/content.io';
import { ContentService } from '@verdzie/server/content/content.service';
import { preserveOrderByIds } from '@verdzie/server/data/common';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  WildrException,
} from '@verdzie/server/exceptions/wildr.exception';
import {
  FeedEntity,
  FeedEntityType,
  GlobalPostsFeedTypesBasedOnPostTypes,
  UserProfilePrivatePubPostsBasedOnPostTypes,
  UserProfilePrivatePubStoriesBasedOnPostTypes,
  UserProfilePubPostsBasedOnPostTypes,
  UserProfilePubStoriesBasedOnPostTypes,
} from '@verdzie/server/feed/feed.entity';
import {
  FeedService,
  GLOBAL_ALL_POSTS_FEED_ID,
  RemoveFeedEntryResult,
  toFeedId,
} from '@verdzie/server/feed/feed.service';
import {
  AddCommentResult,
  BlockOperationType,
  CommenterScope,
  PaginationInput,
  PostKind,
  PostStats,
  PostVisibility,
  SensitiveStatus as GqlSensitiveStatus,
} from '@verdzie/server/generated-graphql';
import {
  AddCommentInput,
  CreateImagePostInput,
  CreateMultiMediaPostInput,
  CreateTextPostInput,
  CreateVideoPostInput,
  ImagePost,
  MultiMediaPost,
  Post,
  PostPropertiesInput,
  ReactionType,
  ReportType,
  RepostInput,
  TextPost,
  VideoPost,
  VideoType,
} from '@verdzie/server/graphql';
import { OpenSearchIndexService } from '@verdzie/server/open-search/open-search-index/openSearchIndex.service';
import { ReportObjectTypeEnum } from '@verdzie/server/report/report.entity';
import { TrollDetectorService } from '@verdzie/server/troll-detector/troll-detector.service';
import { CDNPvtUrlSigner } from '@verdzie/server/upload/CDNPvtUrlSigner';
import { S3UrlPreSigner } from '@verdzie/server/upload/s3UrlPreSigner';
import { UploadService } from '@verdzie/server/upload/upload.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserService } from '@verdzie/server/user/user.service';
import { DistributePostsProducer } from '@verdzie/server/worker/distribute-post/distributePosts.producer';
import { NotifyAuthorProducer } from '@verdzie/server/worker/notify-author/notifyAuthor.producer';
import { ReportProducer } from '@verdzie/server/worker/report/report.producer';
import { UserScoreDataRelatedActionEnum } from '@verdzie/server/worker/score-data/scoreData.producer';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { SensitiveStatus } from '@verdzie/server/post/data/sensitive-status';
import {
  PostFindOptions,
  PostRepository,
} from '@verdzie/server/post/post-repository/post.repository';
import {
  ImagePostProperties,
  TextPostProperties,
  VideoPostProperties,
} from '@verdzie/server/post/postProperties';
import { OSIncrementalIndexStateProducer } from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.producer';
import {
  ChallengeAccessControlService,
  RestrictedChallengeEntryError,
} from '@verdzie/server/challenge/challenge-access-control/challengeAccessControl.service';
import { ChallengePostEntryService } from '@verdzie/server/challenge/challenge-post-entry/challengePostEntry.service';
import {
  ChallengeInteractionEnum,
  ChallengeInteractionService,
} from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.service';
import { ChallengeLeaderboardService } from '@verdzie/server/challenge/challenge-leaderboard/challenge-leaderboard.service';
import { ChallengeCleanupProducer } from '@verdzie/server/worker/challenge-cleanup/challenge-cleanup.producer';
import { err, ok, Result } from 'neverthrow';
import {
  fromChallengeParticipantPostEntryStr,
  getChallengePinnedEntriesFeedId,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.service.helper';
import { isChallengeParticipant } from '@verdzie/server/challenge/userJoinedChallenges.helper';
import { AddOrRemovePostsFromFeedProducer } from '@verdzie/server/worker/add-remove-posts-feed/addOrRemovePostsFromFeed.producer';

const CAPTION_TROLL_DETECTION_INDEX = 999;

@Injectable()
export class PostService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    public repo: PostRepository,
    private userService: UserService,
    @Inject(forwardRef(() => FeedService))
    private readonly feedService: FeedService,
    private readonly commentService: CommentService,
    private readonly uploadService: UploadService,
    private readonly contentService: ContentService,
    private readonly searchIndexService: OpenSearchIndexService,
    private readonly tdService: TrollDetectorService,
    private readonly distributePostsWorker: DistributePostsProducer,
    private readonly notifyAuthorWorker: NotifyAuthorProducer,
    private readonly s3UrlPresigner: S3UrlPreSigner,
    private readonly cdnPvtS3UrlPresigner: CDNPvtUrlSigner,
    private readonly reportWorker: ReportProducer,
    private readonly distributeAnnotatedPostWorker: DistributeAnnotatedPostProducer,
    private readonly notifyAboutMentionWorker: NotifyAboutMentionProducer,
    private readonly userListService: UserListService,
    private readonly notifyAboutRepostWorker: NotifyAboutRepostProducer,
    private readonly repostParentDeletedWorker: RepostParentDeletedProducer,
    private readonly incrementalIndexStateWorker: OSIncrementalIndexStateProducer,
    private readonly challengeACService: ChallengeAccessControlService,
    private readonly challengePostEntryService: ChallengePostEntryService,
    private readonly challengeInteractionService: ChallengeInteractionService,
    private readonly challengeLeaderboardService: ChallengeLeaderboardService,
    private readonly challengeCleanupProducer: ChallengeCleanupProducer,
    private readonly addOrRemovePostsFromFeedWorker: AddOrRemovePostsFromFeedProducer
  ) {
    this.logger = this.logger.child({ context: 'PostService' });
  }

  async findWithConditions(
    where?: FindConditions<PostEntity>,
    shouldIncludeDeletedPosts = false
  ): Promise<PostEntity[]> {
    return await this.repo.find(where, shouldIncludeDeletedPosts);
  }

  getVideoType(mimetype: string): VideoType {
    switch (mimetype) {
      case 'video/mp4':
        return VideoType['MP4'];
      case 'video/quicktime':
        return VideoType['MOV'];
      default:
        return VideoType['MP4'];
    }
  }

  getPostType(postKind: PostKind): number {
    switch (postKind) {
      case PostKind.AUDIO:
        return 1;
      case PostKind.IMAGE:
        return 2;
      case PostKind.TEXT:
        return 3;
      case PostKind.VIDEO:
        return 4;
      case PostKind.MULTI_MEDIA:
        return 5;
    }
  }

  getCommenterScopeValue(commenterScope: CommenterScope): number {
    switch (commenterScope) {
      case CommenterScope.NONE:
        return -1;
      case CommenterScope.FOLLOWING:
        return 1;
      default:
        return 0;
    }
  }

  toGqlCommenterScopeValue(value: number): CommenterScope {
    switch (value) {
      case -1:
        return CommenterScope.NONE;
      case 1:
        return CommenterScope.FOLLOWING;
      default:
        return CommenterScope.ALL;
    }
  }

  getGqlPostObject(post: PostEntity): Post {
    const gqlPost: Post = {
      id: post.id,
      ts: {
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        expiry: post.expiry,
      },
      parentChallengeId: post.parentChallengeId,
      isPrivate: post.isPrivate,
      baseType: toGqlPostBaseType(post.getBaseType()),
    };
    gqlPost.willBeDeleted = post.willBeDeleted;
    gqlPost.sensitiveStatus = this.toGqlSensitiveStatus(post.sensitiveStatus);
    return gqlPost;
  }

  async getStatsForUser(
    post: PostEntity,
    currentUser?: UserEntity
  ): Promise<PostStats> {
    const baseStats = {
      likeCount: post.likeReactionFeed?.count ?? post.stats?.likeCount ?? 0,
      realCount: post.realReactionFeed?.count ?? post.stats?.realCount ?? 0,
      applauseCount:
        post.applaudReactionFeed?.count ?? post.stats?.applauseCount ?? 0,
      shareCount: post.stats?.shareCount ?? 0,
      repostCount: post.stats?.repostCount ?? 0,
      commentCount: post.stats?.commentCount ?? 0,
      reportCount: post.stats?.reportCount ?? 0,
      hasHiddenComments: post.stats?.hasHiddenComments ?? false,
    };
    if (post.stats.hasHiddenComments) {
      baseStats.commentCount = await this.getCommentCountForUser(
        post.id,
        currentUser
      );
    }
    return baseStats;
  }

  toGqlSensitiveStatus(
    sensitiveStatus?: SensitiveStatus
  ): GqlSensitiveStatus | undefined {
    switch (sensitiveStatus) {
      case SensitiveStatus.NSFW:
        return GqlSensitiveStatus.NSFW;
    }
    return undefined;
  }

  toSensitiveStatus(
    sensitiveStatus?: GqlSensitiveStatus
  ): SensitiveStatus | undefined {
    switch (sensitiveStatus) {
      case GqlSensitiveStatus.NSFW:
        return SensitiveStatus.NSFW;
    }
    return undefined;
  }

  getGqlMultiMediaPostObject(
    post: PostEntity,
    parentPost?: PostEntity
  ): MultiMediaPost {
    const gqlPostObj = this.getGqlPostObject(post);
    const multiMediaGqlPostObj: MultiMediaPost = {
      __typename: 'MultiMediaPost',
      ...gqlPostObj,
    };
    if (post.isRepost()) {
      if (!parentPost) {
        multiMediaGqlPostObj.repostMeta = {
          __typename: 'RepostMeta',
          count: 0,
          isParentPostDeleted: true,
        };
      }
      multiMediaGqlPostObj.repostMeta = {
        __typename: 'RepostMeta',
        count: parentPost?.repostMeta?.repostCount,
      };
    }
    return multiMediaGqlPostObj;
  }

  getTextPostObject(post: PostEntity): TextPost {
    return {
      __typename: 'TextPost',
      ...this.getGqlPostObject(post),
    };
  }

  toURL(url: string): Promise<URL> {
    this.logger.debug('URL', { url });
    return toUrl(
      url,
      this.logger,
      this.s3UrlPresigner,
      this.cdnPvtS3UrlPresigner
    );
  }

  getImagePostObject(post: PostEntity, props: ImagePostProperties): ImagePost {
    const imagePost: ImagePost = {
      __typename: 'ImagePost',
      ...this.getGqlPostObject(post),
      image: {
        __typename: 'Image',
        id: props.imageFile.id,
        source: {
          __typename: 'MediaSource',
          uri: this.toURL(props.imageFile.path),
        },
        type: getImageType(props.imageFile.type),
      },
    };
    if (props.thumbnailFile) {
      imagePost.thumbnail = {
        __typename: 'Image',
        id: props.thumbnailFile.id,
        source: {
          __typename: 'MediaSource',
          uri: this.toURL(props.thumbnailFile.path),
        },
        type: getImageType(props.thumbnailFile.type),
      };
    }
    return imagePost;
  }

  getVideoPostObject(post: PostEntity, props: VideoPostProperties): VideoPost {
    const videoPost: VideoPost = {
      __typename: 'VideoPost',
      ...this.getGqlPostObject(post),
      video: {
        __typename: 'Video',
        id: props.videoFile.id,
        source: {
          __typename: 'MediaSource',
          uri: this.toURL(props.videoFile.path),
        },
        type: this.getVideoType(props.videoFile.type),
      },
      parentChallenge: undefined,
    };
    if (props.thumbnailFile) {
      videoPost.thumbnail = {
        __typename: 'Image',
        id: props.thumbnailFile.id,
        source: {
          __typename: 'MediaSource',
          uri: this.toURL(props.thumbnailFile.path),
        },
        type: getImageType(props.thumbnailFile.type),
      };
    }
    return videoPost;
  }

  toGqlPostObject(
    post?: PostEntity,
    parentPost?: PostEntity
  ): Post | undefined {
    if (!post) return undefined;
    if (post.multiPostProperties.length > 0 || post.isRepost()) {
      return this.getGqlMultiMediaPostObject(post, parentPost);
    }
    switch (post.properties.type) {
      case 'TextPostProperties':
        return this.getTextPostObject(post);
      case 'ImagePostProperties':
        return this.getImagePostObject(post, post.properties);
      case 'VideoPostProperties':
        return this.getVideoPostObject(post, post.properties);
      case 'UnknownPostProperties':
        return undefined;
    }
  }

  printError(message: string, ...meta: any) {
    this.logger.error(message, { ...meta });
  }

  print(message: string, ...meta: any) {
    this.logger.debug(message, { ...meta });
  }

  getExpiryTime(expirationHourCount: number): Date | undefined {
    switch (expirationHourCount) {
      case 0:
        return;
      default:
        const targetDate = new Date();
        targetDate.setHours(targetDate.getHours() + expirationHourCount);
        return targetDate;
    }
  }

  findMentionedUsersAndNotifyThem(post: PostEntity): string[] {
    this.logger.info('findMentionedUsersAndNotifyThem');
    const caption: ContentIO | undefined = post.caption;
    const props: (
      | TextPostProperties
      | ImagePostProperties
      | VideoPostProperties
    )[] = post.multiPostProperties;
    const userIdPageIndexMap: Map<string, number> = new Map();
    if (caption) {
      updateUserIdPageIndexMap(userIdPageIndexMap, caption.segments, 0);
    }
    for (let index = 0; index < props.length; index++) {
      const prop = props[index];
      if (prop.type === 'TextPostProperties') {
        const segments = prop.content.segments;
        updateUserIdPageIndexMap(userIdPageIndexMap, segments, index);
      }
    }
    userIdPageIndexMap.forEach(async (pageIndex: number, objectId: string) => {
      this.logger.info('notifying()');
      if (objectId !== post.authorId) {
        await this.notifyAboutMentionWorker.mentionedInPost({
          postId: post.id,
          objectId,
          pageIndex,
        });
      }
    }, Error());
    return [...userIdPageIndexMap.keys()];
  }

  async findMentionedUsersInCommentAndNotifyThem(comment: CommentEntity) {
    const mentionedUserIdPageIndexMap: Map<string, number> = new Map();
    updateUserIdPageIndexMap(
      mentionedUserIdPageIndexMap,
      comment.content.segments,
      0
    );
    const mentionedUserIds = mentionedUserIdPageIndexMap.keys();
    for (const mentionedUserId of mentionedUserIds) {
      if (mentionedUserId === comment.authorId) {
        this.logger.info('mentionedUserId === commentAuthorId', {});
        continue;
      }
      await this.notifyAboutMentionWorker.mentionedInComment({
        commentId: comment.id,
        objectId: mentionedUserId,
      });
    }
  }

  async hasReposted(
    postEntity: PostEntity,
    currentUser?: UserEntity
  ): Promise<boolean> {
    if (postEntity.isRepost()) return false;
    if (
      !postEntity.repostMeta?.repostedPostsFeedId ||
      !postEntity.repostMeta?.repostAuthorsFeedId
    )
      return false;
    if (!currentUser) return false;
    const index = await this.feedService.findIndex(
      toFeedId(FeedEntityType.REPOST_AUTHORS, postEntity.id),
      currentUser.id
    );
    return index > -1;
  }

  repostDenyErrorMessage(postEntity: PostEntity): string | undefined {
    if (postEntity.isRepost()) {
      return 'A repost can not be reposted';
    }
    if (postEntity.isPrivate) {
      return 'A private post can not be reposted';
    }
    if (!postEntity.accessControl && postEntity.isPrivate) {
      return 'The author has restricted reposting this post';
    }
    const parentPostAccessControl =
      postEntity.accessControl ?? backwardCompatiblePostAccessControl();
    if (
      parentPostAccessControl.repostAccessData?.access === RepostAccess.NONE
    ) {
      return 'The author has restricted reposting this post';
    }
  }

  async repost(
    repostAuthor: UserEntity,
    input: RepostInput
  ): Promise<CreatePostResult | undefined> {
    const parentPost = await this.repo.findById(input.postId, {
      relations: [PostEntity.kAuthorRelation],
    });
    if (!parentPost) {
      this.logger.error('[repost()] post not found', { id: input.postId });
      return { errorMessage: 'Post no longer exist' };
    }
    if (
      parentPost.getBaseType() === PostBaseType.STORY &&
      !input.expirationHourCount
    ) {
      this.logger.error('[repost()] A story cannot be reposted as a Post', {
        id: input.postId,
      });
      return {
        errorMessage: 'A story cannot be reposted as a Post',
      };
    }
    const hasBlocked = await this.userService.hasBlocked({
      userWhoBlocked: parentPost.author,
      userWhoBlockedId: parentPost.authorId,
      userIdToCheck: repostAuthor.id,
    });
    if (hasBlocked) {
      this.logger.warn('A blocked user was able to view this post', {
        postId: parentPost.id,
        blockedUserId: repostAuthor.id,
        warnCode: kBlockedUserAbleToViewContentCode,
      });
      throw new ForbiddenException(kSomethingWentWrong);
    }
    const hasReposted = await this.hasReposted(parentPost, repostAuthor);
    if (hasReposted) {
      return {
        errorMessage: 'You have already reposted this post',
      };
    }
    const repostDenyErrorMessage = this.repostDenyErrorMessage(parentPost);
    if (repostDenyErrorMessage) {
      return {
        errorMessage: repostDenyErrorMessage,
      };
    }
    if (parentPost.parentChallengeId) {
      const userIsChallengeParticipant = isChallengeParticipant({
        user: repostAuthor,
        challengeId: parentPost.parentChallengeId,
      });
    }
    let repost = PostEntity.createRepost(parentPost);
    repost.authorId = repostAuthor.id;
    repost.author = repostAuthor;
    //Check for Troll
    if (input.caption) {
      const captionBodyStrArr: string[] = [];
      const captionContentIO: ContentIO | undefined =
        await this.contentService.getContentIO(
          input.caption,
          captionBodyStrArr
        );
      let captionBodyStr: string | undefined = captionBodyStrArr.join('');
      if (captionBodyStr.length == 0) captionBodyStr = undefined;
      if (captionBodyStr) {
        if (input.shouldBypassTrollDetection) {
          this.logger.warn('Bypassing troll detection', {
            authorId: repostAuthor.id,
          });
        } else {
          const trollData: Map<number, string | undefined> = new Map();
          const result: string | undefined = await this.tdService.detect(
            captionBodyStr
          );
          if (result) {
            trollData.set(CAPTION_TROLL_DETECTION_INDEX, result);
            if (trollData.size > 0) return { trollData };
          }
        }
        repost.caption = captionContentIO;
        repost.captionBodyStr = captionBodyStr;
      }
    }
    if (input.expirationHourCount) repost.baseType = PostBaseType.REPOST_STORY;
    if (repost.baseType === PostBaseType.REPOST) {
      const commentFeed = await this.feedService.create(
        FeedEntityType.COMMENT,
        repost.id
      );
      repost.commentFeedId = commentFeed.id;
    }
    if (input.expirationHourCount) {
      repost.expiry = this.getExpiryTime(input.expirationHourCount);
      repost.baseType = PostBaseType.REPOST_STORY;
    }
    let accessControl: PostAccessControl | undefined = fromGqlPostAccessControl(
      input.accessControl
    );
    if (!accessControl) {
      this.logger.warn('[repost()] access control not found in the input');
      accessControl = defaultPostAccessControl();
    }
    repost.accessControl = accessControl;
    repost.isPrivate =
      accessControl.postVisibilityAccessData.access !==
      PostVisibilityAccess.EVERYONE;
    repost.parentChallengeId = parentPost.parentChallengeId;
    repost = await this.repo.repository.manager.transaction<PostEntity>(
      async entityManager => {
        const repostedPostsFeedId = toFeedId(
          FeedEntityType.REPOSTED_POSTS,
          parentPost.id
        );
        this.logger.info('repostedPostsFeedId = ', { repostedPostsFeedId });
        let repostedPostsFeed: FeedEntity | undefined = _.first(
          await entityManager.find(FeedEntity, { id: repostedPostsFeedId })
        );
        if (!repostedPostsFeed) {
          this.logger.info('CREATING REPOSTED FEED');
          repostedPostsFeed = new FeedEntity();
          repostedPostsFeed.id = repostedPostsFeedId;
          await entityManager.insert(FeedEntity, repostedPostsFeed);
        }
        const result = await this.feedService.tryAndPushEntry(
          repostedPostsFeed.id,
          repost.id,
          { repo: entityManager.getRepository(FeedEntity) }
        );
        repostedPostsFeed = result.entity as FeedEntity;
        const repostAuthorsFeedId = toFeedId(
          FeedEntityType.REPOST_AUTHORS,
          parentPost.id
        );
        this.logger.info('repostsAuthorFeedId = ', { repostAuthorsFeedId });
        let repostsAuthorFeed: FeedEntity | undefined = _.first(
          await entityManager.find(FeedEntity, { id: repostAuthorsFeedId })
        );
        if (!repostsAuthorFeed) {
          this.logger.info('CREATING REPOST AUTHORS FEED');
          repostsAuthorFeed = new FeedEntity();
          repostsAuthorFeed.id = repostAuthorsFeedId;
          await entityManager.insert(FeedEntity, repostsAuthorFeed);
        }
        await this.feedService.tryAndPushEntry(
          repostAuthorsFeedId,
          repost.authorId,
          { repo: entityManager.getRepository(FeedEntity) }
        );
        parentPost.repostMeta = {
          repostCount: repostedPostsFeed.count,
          repostedPostsFeedId,
          repostAuthorsFeedId,
        };
        repost.repostMeta = {
          parentPostId: parentPost.id,
        };
        await entityManager.insert(PostEntity, repost);
        await entityManager.update(
          PostEntity,
          { id: parentPost.id },
          {
            repostMeta: {
              repostCount: repostedPostsFeed.count,
              repostedPostsFeedId,
              repostAuthorsFeedId,
            },
          }
        );
        return repost;
      }
    );
    const postKind = toGqlPostKind(repost.type);
    await this.distributePost({
      post: repost,
      postKind,
      author: repostAuthor,
      userIdsToSkip: [parentPost.authorId],
      shouldDistributePostInBatchesUsingWorker: true,
    });
    await this.addOpenSearchEntry(repost, postKind, repost.captionBodyStr);
    if (repost.authorId !== parentPost.authorId)
      await this.notifyAboutRepostWorker.notify({
        repostId: repost.id,
        parentPostId: parentPost.id,
      });
    await this.userService.updateUserScoreData({
      userId: parentPost.authorId,
      action: UserScoreDataRelatedActionEnum.REC_POST_REPOST,
    });
    return { post: repost, parentPost };
  }

  async createMultiMediaPost(
    author: UserEntity,
    input: CreateMultiMediaPostInput,
    shouldDistributePostInBatchesUsingWorker = true
  ): Promise<CreatePostResult | undefined> {
    if (input.challengeId) {
      const restrictedChallengeEntryErrorResult =
        await this.challengeACService.restrictedChallengeEntryError(
          input.challengeId,
          author.id
        );
      if (restrictedChallengeEntryErrorResult.isErr()) {
        if (
          restrictedChallengeEntryErrorResult.error instanceof
          InternalServerErrorException
        )
          throw restrictedChallengeEntryErrorResult.error;
        throw new ForbiddenException(
          restrictedChallengeEntryErrorResult.error.errorMessage
        );
      }
    }
    let textPosts = 0;
    let imagePosts = 0;
    let videoPosts = 0;
    let postKind = PostKind.MULTI_MEDIA;
    this.print('[createMultiMediaPost]');
    if (!input.properties) {
      throw new ValidationError('A multi post must contain properties');
    }
    const bodyStrings: string[] = [];
    const indices: number[] = [];
    const props: (
      | TextPostProperties
      | ImagePostProperties
      | VideoPostProperties
    )[] = [];
    const pendingPropertiesToProcess: Map<number, PostPropertiesInput> =
      new Map();
    for (let index = 0; index < input.properties.length; index++) {
      const property = input.properties[index];
      if (property.textInput) {
        textPosts++;
        let negativeConfidenceValue: number | undefined;
        if (input.negativeResults) {
          if (input.negativeIndices?.includes(index)) {
            negativeConfidenceValue = input.negativeResults[index] ?? undefined;
          }
        }
        const bodyStrArr: string[] = [];
        const textProperties: TextPostProperties = {
          type: 'TextPostProperties',
          content: await this.contentService.getContentIO(
            property.textInput.content,
            bodyStrArr
          ),
          bodyStr: bodyStrArr.join(''),
          negativeConfidenceValue,
        };
        props.push(textProperties);
        bodyStrings.push(textProperties.bodyStr!);
        indices.push(index);
      } else if (property.imageInput) {
        pendingPropertiesToProcess.set(index, property);
      } else if (property.videoInput) {
        pendingPropertiesToProcess.set(index, property);
      }
    }
    let captionBodyStr = '';
    let captionContentIO: ContentIO | undefined;
    if (input.caption) {
      const captionBodyStrArr: string[] = [];
      captionContentIO = await this.contentService.getContentIO(
        input.caption,
        captionBodyStrArr
      );
      captionBodyStr = captionBodyStrArr.join('');
      if (captionBodyStr.length > 0) {
        bodyStrings.push(captionBodyStr);
        indices.push(CAPTION_TROLL_DETECTION_INDEX);
      }
    }
    if (!input.shouldBypassTrollDetection) {
      const jobs: Promise<string | undefined>[] = [];
      bodyStrings.forEach(body => {
        jobs.push(this.tdService.detect(body));
      });
      const trollData: Map<number, string | undefined> = new Map();
      const results: (string | undefined)[] = await Promise.all(jobs);
      if (results.length > 0) {
        results.forEach((result, index) => {
          if (result) {
            this.print('Adding value');
            trollData.set(indices[index], result);
          }
        });
        if (trollData.size > 0) return { trollData };
      }
    } else {
      this.logger.warn('Bypassing troll detection', {
        authorId: author.id,
      });
    }
    for (const [index, property] of pendingPropertiesToProcess) {
      if (property.imageInput) {
        this.logger.debug('Uploading image post ');
        imagePosts++;
        const imagePostPropertiesInput = property.imageInput;
        const [file, thumbnailFile] = await Promise.all([
          this.uploadService.uploadFile(
            imagePostPropertiesInput.image,
            input.visibility
          ),
          this.uploadService.uploadFile(
            imagePostPropertiesInput.thumbnail,
            input.visibility
          ),
        ]);
        props.splice(index, 0, {
          type: 'ImagePostProperties',
          imageFile: {
            id: file.id,
            path: file.path,
            type: file.mimetype.toLocaleLowerCase(),
          },
          thumbnailFile: {
            id: thumbnailFile.id,
            path: thumbnailFile.path,
            type: thumbnailFile.mimetype.toLocaleLowerCase(),
          },
        });
      } else if (property.videoInput) {
        videoPosts++;
        const videoPostPropertiesInput = property.videoInput;
        const file = await this.uploadService.uploadFile(
          videoPostPropertiesInput.video,
          input.visibility
        );
        const thumbnailFile = await this.uploadService.uploadFile(
          videoPostPropertiesInput.thumbnail,
          input.visibility
        );
        props.splice(index, 0, {
          type: 'VideoPostProperties',
          videoFile: {
            id: file.id,
            path: file.path,
            type: file.mimetype.toLocaleLowerCase(),
          },
          thumbnailFile: {
            id: thumbnailFile.id,
            path: thumbnailFile.path,
            type: thumbnailFile.mimetype.toLocaleLowerCase(),
          },
        });
      }
    }
    if (props.length === 0) {
      throw new ValidationError(
        '`crateMultiMediaPost()` Invalid property found'
      );
    }
    const post = new PostEntity();
    post.multiPostProperties = props;
    if (captionContentIO) {
      post.caption = captionContentIO;
      if (input.negativeResults) {
        if (input.negativeIndices?.includes(CAPTION_TROLL_DETECTION_INDEX)) {
          const captionNegativeConfidenceCountIndex =
            input.negativeIndices.indexOf(CAPTION_TROLL_DETECTION_INDEX);
          if (
            captionNegativeConfidenceCountIndex > -1 &&
            input.negativeResults!.length > captionNegativeConfidenceCountIndex
          ) {
            if (input.negativeResults![captionNegativeConfidenceCountIndex]) {
              post.captionNegativeConfidenceValue =
                input.negativeResults![captionNegativeConfidenceCountIndex]!;
            }
          }
          this.logger.info('Post got negative confidence', {
            captionConfidence: post.captionNegativeConfidenceValue,
          });
        }
      }
    }
    post.captionBodyStr = captionBodyStr;
    if (input.thumbnail) {
      const thumbnailFile = input?.thumbnail
        ? await this.uploadService.uploadFile(input.thumbnail, input.visibility)
        : undefined;
      if (thumbnailFile) {
        post.thumbnailFile = {
          id: thumbnailFile.id,
          path: thumbnailFile.path,
          type: thumbnailFile.mimetype.toLowerCase(),
        };
      }
    }
    if (textPosts > 0 || imagePosts > 0 || videoPosts > 0) {
      if (textPosts > 0 && imagePosts == 0 && videoPosts == 0) {
        postKind = PostKind.TEXT;
      } else if (imagePosts > 0 && textPosts == 0 && videoPosts == 0) {
        postKind = PostKind.IMAGE;
      } else if (videoPosts > 0 && textPosts == 0 && imagePosts == 0) {
        postKind = PostKind.VIDEO;
      }
    }
    return {
      post: await this.createAndDistributePost({
        author,
        post,
        postKind,
        visibility: input.visibility,
        commenterScope: input.commenterScope,
        expirationHours: input.expirationHourCount,
        body: bodyStrings.join(' '),
        accessControl: fromGqlPostAccessControl(input.accessControl),
        shouldDistributePostInBatchesUsingWorker,
        challengeId: input.challengeId,
      }),
    };
  }

  private async createAndDistributePost(
    args: CreateAndDistributePostArgs
  ): Promise<PostEntity | undefined> {
    const author: UserEntity = args.author;
    const post: PostEntity = args.post;
    const postKind: PostKind = args.postKind;
    const commenterScope: CommenterScope =
      args.commenterScope ?? CommenterScope.ALL;
    const expirationHours = args.expirationHours ?? 0;
    const accessControl: PostAccessControl =
      args.accessControl ??
      backwardCompatiblePostAccessControl(args.visibility, args.commenterScope);
    try {
      this.logger.debug(' createPost()');
      post.id = generateId();
      post.author = author;
      const commentFeed = await this.feedService.create(
        FeedEntityType.COMMENT,
        post.id
      );
      post.authorId = author.id;
      post.commentFeedId = commentFeed.id;
      post.type = this.getPostType(postKind);
      post.commentScopeType = this.getCommenterScopeValue(commenterScope);
      post.expiry = this.getExpiryTime(expirationHours);
      if (post.expiry) post.baseType = PostBaseType.STORY;
      post.accessControl = accessControl;
      post.isPrivate =
        accessControl.postVisibilityAccessData.access !==
        PostVisibilityAccess.EVERYONE;
      try {
        if (args.challengeId) {
          await this.addPostToChallenge({
            challengeId: args.challengeId,
            currentUser: author,
            post,
          });
        }
        await this.repo.save(post);
      } catch (error) {
        if (args.challengeId) {
          retryWithBackoff({
            fn: async () => {
              this.challengeCleanupProducer.cleanupAfterPostDeletion({
                challengeId: args.challengeId ?? '',
                postId: post.id,
                userId: author.id,
              });
            },
            retryCount: 3,
            throwAfterFailedRetries: true,
          });
        }
        throw error;
      }
      this.requestReIndex(post.id);
      await this.distributePost(args);
      await this.addOpenSearchEntry(post, postKind, args.body);
      return post;
    } catch (e) {
      this.logger.error(e);
      return;
    }
  }

  @WildrExceptionDecorator()
  private async addPostToChallenge({
    challengeId,
    currentUser,
    post,
  }: {
    challengeId: string;
    currentUser: UserEntity;
    post: PostEntity;
  }) {
    const addPostToChallengeEntriesResult =
      await this.challengePostEntryService.addEntry({
        post,
        challengeId,
      });
    if (!addPostToChallengeEntriesResult.didAddEntry) {
      throw new InternalServerErrorException(
        '[addPostToChallenge] Failed to add entry to challenge',
        {
          challengeId,
          userId: currentUser.id,
        }
      );
    }
    const [
      updateChallengeLeaderboardResult,
      updateJoinedChallengeEntryPostResult,
    ] = await Promise.all([
      this.challengeLeaderboardService.updateChallengeLeaderboard({
        challengeIdOrChallenge: challengeId,
        participantId: currentUser.id,
        latestEntryId: post.id,
        entryCount: addPostToChallengeEntriesResult.entryCount,
      }),
      this.userService.updateJoinedChallengeEntryPostInTxt({
        userId: currentUser.id,
        challengeId,
        post,
      }),
    ]);
    if (updateChallengeLeaderboardResult.error) {
      throw new InternalServerErrorException(
        '[addPostToChallenge] ' + updateChallengeLeaderboardResult.error,
        {
          challengeId,
          userId: currentUser.id,
          error: updateChallengeLeaderboardResult.error,
        }
      );
    }
    if (updateJoinedChallengeEntryPostResult.isErr()) {
      this.logger.warn(
        '[addPostToChallenge] ' + updateJoinedChallengeEntryPostResult.error,
        {
          challengeId,
          userId: currentUser.id,
          error: updateJoinedChallengeEntryPostResult.error,
        }
      );
    }
    if (updateJoinedChallengeEntryPostResult.isErr()) {
      throw new InternalServerErrorException(
        '[addPostToChallenge] ' + updateJoinedChallengeEntryPostResult.error,
        {
          challengeId,
          userId: currentUser.id,
        },
        updateJoinedChallengeEntryPostResult.error
      );
    }
    post.parentChallengeId = challengeId;
  }

  private async distributePost(args: CreateAndDistributePostArgs) {
    const author: UserEntity = args.author;
    const post: PostEntity = args.post;
    const visibility: PostVisibility = args.visibility ?? PostVisibility.ALL;
    const accessControl: PostAccessControl =
      args.accessControl ??
      backwardCompatiblePostAccessControl(args.visibility, args.commenterScope);
    const expirationHours = (args.expirationHours = 0);
    const feedTypes = [];
    //The following if-else clause will put the post/story in a feed that
    // will be visible on the Author's profile page (not on their feed)
    if (post.expiry) {
      //Put in PrivateAndPublic Feed by default
      feedTypes.push(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_STORIES);
      feedTypes.push(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS); //TODO: REMOVE THIS
      feedTypes.push(UserProfilePrivatePubStoriesBasedOnPostTypes[post.type]);
      feedTypes.push(UserProfilePrivatePubPostsBasedOnPostTypes[post.type]); //TODO: REMOVE THIS IN THE FUTURE!!
      //Make it available to public if it's not private
      if (!post.isPrivate) {
        //Put the story in their public feed (so non-followers can also see it)
        feedTypes.push(FeedEntityType.USER_PROFILE_PUB_ALL_STORIES);
        feedTypes.push(FeedEntityType.USER_PROFILE_PUB_ALL_POSTS); //TODO: REMOVE THIS IN THE FUTURE!!
        //Put them in specific story-type pub feed
        feedTypes.push(UserProfilePubStoriesBasedOnPostTypes[post.type]);
        feedTypes.push(UserProfilePrivatePubPostsBasedOnPostTypes[post.type]); //TODO: REMOVE THIS IN THE FUTURE!!
      }
    } else {
      feedTypes.push(FeedEntityType.USER_PROFILE_PVT_PUB_ALL_POSTS);
      feedTypes.push(UserProfilePrivatePubPostsBasedOnPostTypes[post.type]);
      if (!post.isPrivate) {
        this.logger.debug(' isPublic');
        feedTypes.push(FeedEntityType.USER_PROFILE_PUB_ALL_POSTS);
        feedTypes.push(UserProfilePubPostsBasedOnPostTypes[post.type]);
      }
    }
    const feedIds = feedTypes.map(type => toFeedId(type, author.id));
    await Promise.all(
      feedIds.map(id => this.feedService.tryUnshiftEntry(id, post.id))
    );
    this.logger.info('Successfully updated USER_PROFILE__ posts');
    if (expirationHours === 0)
      await this.userService.incrementPostCount(author);
    if (!post.isRepost()) {
      //A Repost is not shared in the global feed
      await this.feedService.tryUnshiftEntry(
        await this.feedService.getUnannotatedPostsFeed(),
        post.id
      );
    }
    const userIdsToSkip = this.findMentionedUsersAndNotifyThem(post);
    userIdsToSkip.push(...(args.userIdsToSkip ?? []));
    if (args.shouldDistributePostInBatchesUsingWorker === true)
      await this.distributePostsWorker.distributePostInBatches({
        postId: post.id,
        shouldNotify: true,
        postVisibility: visibility,
        userIdsToSkip,
        accessControl,
      });
    this.logger.debug('Finished creating post', {
      completedAt: Date.now(),
      postId: post.id,
    });
    if (process.env.SHOULD_ADD_ALL_POSTS_TO_GLOBAL_FEED === 'true') {
      await this.feedService.tryUnshiftEntry(GLOBAL_ALL_POSTS_FEED_ID, post.id);
      await this.feedService.tryUnshiftEntry(
        toFeedId(GlobalPostsFeedTypesBasedOnPostTypes[post.type], ''),
        post.id
      );
    }
  }

  async addOpenSearchEntry(
    post: PostEntity,
    postKind: PostKind,
    body?: string
  ) {
    const content = body ?? post.captionBodyStr;
    let thumbUrl = '';
    if (
      post.properties.type === 'ImagePostProperties' ||
      post.properties.type === 'VideoPostProperties'
    ) {
      thumbUrl = post.properties.thumbnailFile?.path ?? '';
    }
    if (content.length == 0) {
      this.logger.warn('Skipped indexing post, no content found', {
        postId: post.id,
      });
    } else {
      await this.searchIndexService.indexPostContent(
        post.id,
        content,
        thumbUrl,
        `${postKind}`
      );
    }
  }

  async createTextPost(
    author: UserEntity,
    input: CreateTextPostInput
  ): Promise<PostEntity | undefined> {
    if (!input?.content) {
      throw new ValidationError('Text post must contain body');
    }
    const post = new PostEntity();
    const bodyStrArr: string[] = [];
    const properties: TextPostProperties = {
      type: 'TextPostProperties',
      content: await this.contentService.getContentIO(
        input.content,
        bodyStrArr
      ),
    };
    post.captionBodyStr = bodyStrArr.join(' ');
    post.properties = properties;
    this.print(`input.visibility = ${input.visibility}`);
    return this.createAndDistributePost({
      author,
      post,
      postKind: PostKind.TEXT,
      visibility: input.visibility,
      commenterScope: input.commenterScope,
      expirationHours: input.expirationHourCount,
    });
  }

  async createImagePost(
    author: UserEntity,
    input: CreateImagePostInput
  ): Promise<PostEntity | undefined> {
    const imageFile = await this.uploadService.uploadFile(
      input.image,
      input.visibility
    );
    const thumbnailFile = input?.thumbnail
      ? await this.uploadService.uploadFile(input.thumbnail, input.visibility)
      : undefined;
    const post = new PostEntity();
    const properties: ImagePostProperties = {
      type: 'ImagePostProperties',
      imageFile: {
        id: imageFile.id,
        path: imageFile.path,
        type: imageFile.mimetype.toLowerCase(),
      },
    };
    const bodyStrArr: string[] = [];
    if (input.content) {
      properties.caption = await this.contentService.getContentIO(
        input.content,
        bodyStrArr
      );
    }
    if (thumbnailFile) {
      properties.thumbnailFile = {
        id: thumbnailFile.id,
        path: thumbnailFile.path,
        type: thumbnailFile.mimetype.toLowerCase(),
      };
    }
    post.captionBodyStr = bodyStrArr.join(' ');

    post.properties = properties;
    return this.createAndDistributePost({
      author,
      post,
      postKind: PostKind.IMAGE,
      visibility: input.visibility,
      commenterScope: input.commenterScope,
      expirationHours: input.expirationHourCount,
    });
  }

  async createVideoPost(
    author: UserEntity,
    input: CreateVideoPostInput
  ): Promise<PostEntity | undefined> {
    const file = await this.uploadService.uploadFile(
      input.video,
      input.visibility
    );
    const thumbnailFile = input?.thumbnail
      ? await this.uploadService.uploadFile(input.thumbnail, input.visibility)
      : undefined;
    this.logger.debug('createVideoPost for file: ', file);
    const post = new PostEntity();
    post.properties = <VideoPostProperties>{
      type: 'VideoPostProperties',
      videoFile: {
        id: file.id,
        path: file.path,
        type: file.mimetype.toLowerCase(),
      },
    };
    const bodyStrArr: string[] = [];
    if (input.content) {
      post.properties.caption = await this.contentService.getContentIO(
        input.content,
        bodyStrArr
      );
    }
    if (thumbnailFile) {
      post.properties.thumbnailFile = {
        id: thumbnailFile.id,
        path: thumbnailFile.path,
        type: thumbnailFile.mimetype.toLowerCase(),
      };
    }
    post.captionBodyStr = bodyStrArr.join(' ');

    return this.createAndDistributePost({
      author,
      post,
      postKind: PostKind.VIDEO,
      visibility: input.visibility,
      commenterScope: input.commenterScope,
      expirationHours: input.expirationHourCount,
    });
  }

  async findComments({
    postOrId,
    first,
    after,
    includingAndAfter,
    last,
    before,
    includingAndBefore,
    paginationInput,
    currentUserIsAuthor,
    currentUserId,
    targetCommentId,
  }: {
    postOrId: PostEntity | string;
    first?: number;
    after?: string;
    includingAndAfter?: string;
    last?: number;
    before?: string;
    includingAndBefore?: string;
    paginationInput?: PaginationInput;
    currentUserIsAuthor?: boolean;
    currentUserId?: string;
    targetCommentId?: string;
  }): Promise<PaginateCommentsResult> {
    if (!paginationInput) {
      //Backward compatible pagination input
      paginationInput = {
        after,
        before,
        take: first ?? last,
        includingAndAfter,
        includingAndBefore,
      };
    }
    this.logger.debug('paginationInput', { paginationInput });
    const post =
      typeof postOrId === 'string'
        ? await this.repo.findById(postOrId)
        : postOrId;
    if (!post) {
      this.logger.info('No post found', { postOrId });
      return {
        comments: [],
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
    const commentsFeed = await this.feedService.find(post.commentFeedId);
    if (!commentsFeed) {
      this.logger.info('No comments feed found', { post });
      return {
        comments: [],
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
    return await this.commentService.paginateComments({
      commentVisibilityAccessData:
        post.accessControl?.commentVisibilityAccessData,
      feedId: commentsFeed.id,
      currentUserIsAuthor,
      authorId: post.authorId,
      targetCommentId,
      currentUserId,
      paginationInput,
      parentType: CommentParentType.POST,
    });
  }

  async findWithAuthorRelation(
    id: string,
    predicate?: FindConditions<PostEntity>
  ): Promise<PostEntity | undefined> {
    return this.repo.findById(id, {
      relations: [PostEntity.kAuthorRelation],
      predicate,
    });
  }

  async findWithAuthorAndParentChallengeRelation(
    id: string,
    predicate?: FindConditions<PostEntity>
  ): Promise<PostEntity | undefined> {
    return this.repo.findById(id, {
      relations: [
        PostEntity.kAuthorRelation,
        PostEntity.kParentChallengeRelation,
      ],
      predicate,
    });
  }

  async findWithRelations(
    id: string,
    relations: string[]
  ): Promise<PostEntity | undefined> {
    return this.repo.findById(id, { relations });
  }

  async findWithReactionsFeed(id: string): Promise<PostEntity | undefined> {
    return this.repo.findById(id, {
      relations: [
        PostEntity.kRealReactionFeedRelation,
        PostEntity.kApplaudReactionFeedRelation,
        PostEntity.kLikeReactionFeedRelation,
      ],
    });
  }

  async findById(
    id: string,
    predicate?: FindConditions<PostEntity> | undefined
  ): Promise<PostEntity | undefined> {
    return this.repo.findById(id, { predicate });
  }

  async findByIdIncludingSoftDelete(
    id: string
  ): Promise<PostEntity | undefined> {
    return this.repo.findById(id, {
      shouldSkipSuspendedPosts: false,
      shouldSkipDeletedPosts: false,
    });
  }

  async findWithPinnedComment(id: string): Promise<PostEntity | undefined> {
    return this.repo.findById(id, {
      relations: [PostEntity.kPinnedCommentRelation],
    });
  }

  async findAllWithAuthorRelations(ids: string[]): Promise<PostEntity[]> {
    return preserveOrderByIds(
      ids,
      await this.repo.findByIds(ids, {
        relations: [PostEntity.kAuthorRelation],
      })
    );
  }

  async findAllNonExpired(
    ids: string[],
    relations?: string[],
    predicate?: FindConditions<PostEntity>
  ): Promise<PostEntity[]> {
    try {
      return preserveOrderByIds(
        ids,
        await this.repo.findByIds(ids, { relations }, predicate)
      );
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }

  async findAllIds(): Promise<string[]> {
    return _.map(await this.repo.find(), (post: PostEntity) => post.id);
  }

  async findByIds(
    ids: string[],
    options: PostFindOptions,
    shouldPreserveOrder = false
  ): Promise<PostEntity[] | undefined> {
    const result = await this.repo.findByIds(ids, options);
    if (shouldPreserveOrder) {
      return preserveOrderByIds(ids, result);
    }
    return result;
  }

  async parseAllUrls(posts: PostEntity[]): Promise<PostEntity[]> {
    for (let post of posts) {
      post = await this.parseUrls(post);
    }
    return posts;
  }

  async parseUrls(post: PostEntity): Promise<PostEntity> {
    for (const prop of post.multiPostProperties) {
      if (prop.type === 'TextPostProperties') continue;
      if (prop.thumbnailFile) {
        prop.thumbnailFile.path = (
          await this.toURL(prop.thumbnailFile.path)
        ).toString();
      }
      if (prop.type === 'ImagePostProperties') {
        prop.imageFile.path = (
          await this.toURL(prop.imageFile.path)
        ).toString();
      }
      if (prop.type === 'VideoPostProperties') {
        prop.videoFile.path = (
          await this.toURL(prop.videoFile.path)
        ).toString();
      }
    }
    return post;
  }

  getFeedType(reactionType: ReactionType) {
    switch (reactionType) {
      case ReactionType.REAL:
      case ReactionType.UN_REAL:
        return FeedEntityType.REAL_REACTIONS_ON_POST;
      case ReactionType.APPLAUD:
      case ReactionType.UN_APPLAUD:
        return FeedEntityType.APPLAUD_REACTIONS_ON_POST;
      case ReactionType.LIKE:
      case ReactionType.UN_LIKE:
        return FeedEntityType.LIKE_REACTIONS_ON_POST;
      default:
        throw new Error('Invalid reaction type');
    }
  }

  getReactionFeedIdPropertyName(reactionType: ReactionType) {
    switch (reactionType) {
      case ReactionType.REAL:
      case ReactionType.UN_REAL:
        return 'realReactionFeedId';
      case ReactionType.APPLAUD:
      case ReactionType.UN_APPLAUD:
        return 'applaudReactionFeedId';
      case ReactionType.LIKE:
      case ReactionType.UN_LIKE:
        return 'likeReactionFeedId';
      default:
        throw new Error('Invalid reaction type');
    }
  }

  getReactionFeedPropertyName(reactionType: ReactionType) {
    switch (reactionType) {
      case ReactionType.REAL:
      case ReactionType.UN_REAL:
        return 'realReactionFeed';
      case ReactionType.APPLAUD:
      case ReactionType.UN_APPLAUD:
        return 'applaudReactionFeed';
      case ReactionType.LIKE:
      case ReactionType.UN_LIKE:
        return 'likeReactionFeed';
      default:
        throw new Error('Invalid reaction type');
    }
  }

  getReactionStatPropertyName(reactionType: ReactionType) {
    switch (reactionType) {
      case ReactionType.REAL:
      case ReactionType.UN_REAL:
        return 'realCount';
      case ReactionType.APPLAUD:
      case ReactionType.UN_APPLAUD:
        return 'applauseCount';
      case ReactionType.LIKE:
      case ReactionType.UN_LIKE:
        return 'likeCount';
      default:
        throw new Error('Invalid reaction type');
    }
  }

  private async addReaction(
    reactionType: ReactionType,
    post: PostEntity,
    currentUser: UserEntity,
    reactorsReactionFeed: FeedEntity,
    context: AppContext
  ) {
    this.logger.info('[addReaction] adding reaction to post', {
      postId: post.id,
    });
    const [reactionFeed] = await Promise.all([
      this.feedService.tryUnshiftEntry(
        toFeedId(this.getFeedType(reactionType), post.id),
        currentUser.id
      ),
      this.feedService.tryUnshiftEntry(reactorsReactionFeed, post.id),
    ]);
    if (!reactionFeed) throw new Error('Reaction feed not found');
    this.logger.info('[addReaction] updating post reaction count', {
      postId: post.id,
    });
    post.setReactionCount(reactionType, reactionFeed._count);
    post[this.getReactionFeedPropertyName(reactionType)] = reactionFeed;
    post[this.getReactionFeedIdPropertyName(reactionType)] = reactionFeed.id;
    await this.repo.repository
      .createQueryBuilder()
      .update(PostEntity)
      .set({
        _stats: () =>
          // COALESCE is required because jsonb_set will not act upon null
          // columns
          `jsonb_set(COALESCE(stats, '{}'), '{${this.getReactionStatPropertyName(
            reactionType
          )}}', '"${reactionFeed._count}"'::jsonb, true)`,
        [this.getReactionFeedIdPropertyName(reactionType)]: reactionFeed.id,
      })
      .where('id = :id', { id: post.id })
      .execute();
    await this.challengeInteractionService.updateChallengeInteractionsIfAuthor({
      postOrChallenge: post,
      currentUser,
      objectId: post.id,
      interactionType: ChallengeInteractionEnum.REACTED_TO_ENTRY,
      context,
    });
    return post;
  }

  private async removeReaction(
    reactionType: ReactionType,
    post: PostEntity,
    currentUser: UserEntity,
    reactorsReactionFeed: FeedEntity
  ) {
    this.logger.info('[removeReaction] removing reaction from post', {
      postId: post.id,
    });

    const [reactionFeed] = await Promise.all([
      this.feedService.tryRemoveEntry(
        toFeedId(this.getFeedType(reactionType), post.id),
        currentUser.id
      ),
      this.feedService.tryRemoveEntry(reactorsReactionFeed, post.id),
    ]);

    if (reactionFeed) {
      this.logger.info('[removeReaction] updating post reaction count', {
        postId: post.id,
      });

      post.setReactionCount(reactionType, reactionFeed._count);
      post[this.getReactionFeedPropertyName(reactionType)] = reactionFeed;
      post[this.getReactionFeedIdPropertyName(reactionType)] = reactionFeed.id;

      await this.repo.repository
        .createQueryBuilder()
        .update(PostEntity)
        .set({
          _stats: () =>
            // COALESCE is required because jsonb_set will not act upon null
            // columns
            `jsonb_set(COALESCE(stats, '{}'), '{${this.getReactionStatPropertyName(
              reactionType
            )}}', '${reactionFeed?._count}'::jsonb, true)`,
          [this.getReactionFeedIdPropertyName(reactionType)]: reactionFeed.id,
        })
        .where('id = :id', { id: post.id })
        .execute();
    }

    return post;
  }

  async reactOnPost(
    currentUser: UserEntity,
    id: string,
    reactionType: ReactionType,
    context: AppContext
  ): Promise<PostEntity | undefined> {
    const [reactorsLikeReactionFeed, post] = await Promise.all([
      this.feedService.find(currentUser.likeReactionOnPostFeedId ?? ''),
      this.repo.findById(id, {
        relations: [
          PostEntity.kAuthorRelation,
          `${PostEntity.kAuthorRelation}.${UserEntity.kActivityStreamRelation}`,
          PostEntity.kRealReactionFeedRelation,
          PostEntity.kApplaudReactionFeedRelation,
          PostEntity.kLikeReactionFeedRelation,
        ],
      }),
    ]);
    if (!reactorsLikeReactionFeed) {
      this.logger.error(
        `[reactOnPost] ${reactionType} Feed not found, returning`,
        {
          userId: currentUser.id,
        }
      );
      return undefined;
    }
    if (!post) {
      this.logger.error(
        '[reactOnPost] post not found with ActivityStreamRelations'
      );
      return undefined;
    }
    if (post.isParentPostDeleted()) {
      throw new ValidationError('Can no longer react on this post');
    }
    if (post.author) {
      const hasBlocked = await this.userService.hasBlocked({
        userWhoBlocked: post.author,
        userIdToCheck: currentUser.id,
      });
      if (hasBlocked) {
        this.logger.warn(
          '[reactOnPost] A blocked user was able to view this post',
          {
            postId: post.id,
            blockedUser: currentUser.id,
            warnCode: kBlockedUserAbleToViewContentCode,
          }
        );
        throw new ValidationError(kSomethingWentWrong);
      }
    }
    const scoreDataRelatedActions: UserScoreDataRelatedActionEnum[] = [];
    switch (reactionType) {
      case ReactionType.LIKE:
        if (!reactorsLikeReactionFeed.hasEntry(post.id)) {
          scoreDataRelatedActions.push(
            UserScoreDataRelatedActionEnum.REC_LIKE_REACTION
          );
          await this.addReaction(
            reactionType,
            post,
            currentUser,
            reactorsLikeReactionFeed,
            context
          );
          if (post.authorId !== currentUser.id) {
            this.notifyAuthorWorker.reactionOnPost({
              reactionType,
              postId: post.id,
              subjectId: currentUser.id,
              timeStamp: context.timeStamp!,
            });
          }
          this.userService.updateUserInteractionsCount(
            currentUser.id,
            post.authorId
          );
          this.userService.updatePostTypeInteractionCount(currentUser.id, [
            post.type,
          ]);
          if (post.categoryIds)
            this.userService.updateCategoryInteractionCount(
              currentUser.id,
              post.categoryIds
            );
        }
        break;
      case ReactionType.UN_LIKE:
        if (reactorsLikeReactionFeed.hasEntry(post.id)) {
          scoreDataRelatedActions.push(
            UserScoreDataRelatedActionEnum.REC_UN_LIKE_REACTION
          );
          await this.removeReaction(
            ReactionType.LIKE,
            post,
            currentUser,
            reactorsLikeReactionFeed
          );
        }
        break;
    }
    for (const action of scoreDataRelatedActions) {
      this.userService.updateUserScoreData({
        userId: post!.authorId,
        action: action,
      });
    }
    this.requestReIndex(post.id);
    return post;
  }

  async pinComment({
    postId,
    commentId,
    currentUser,
    context,
  }: {
    postId: string;
    commentId: string;
    currentUser: UserEntity;
    context: AppContext;
  }): Promise<
    Result<
      { post: PostEntity; pinnedComment: CommentEntity },
      | NotFoundException
      | UnauthorizedException
      | InternalServerErrorException
      | BadRequestException
    >
  > {
    try {
      this.logger.info('[pinComment]', {
        postId,
        commentId,
        userId: currentUser.id,
      });
      const [post, comment] = await Promise.all([
        this.findById(postId),
        this.commentService.findById(commentId),
      ]);
      if (!post) {
        this.logger.error('[pinComment] post not found', {
          postId,
          commentId,
          userId: currentUser.id,
        });
        return err(new NotFoundException('Post not found'));
      }
      if (!comment) {
        this.logger.error('[pinComment] comment not found', {
          postId,
          commentId,
          userId: currentUser.id,
        });
        return err(new NotFoundException('Comment not found'));
      }
      if (post.authorId !== currentUser.id) {
        this.logger.warn('[pinComment] user is not author of post', {
          postId,
          commentId,
          userId: currentUser.id,
        });
        return err(
          new UnauthorizedException(
            'Only the creator of the post can pin a comment'
          )
        );
      }
      if (comment.postId !== postId) {
        this.logger.warn('[pinComment] comment is not a child of post', {
          postId,
          commentId,
          userId: currentUser.id,
        });
        return err(
          new BadRequestException(
            `You can't pin a comment to a post that it doesn't belong to`
          )
        );
      }
      if (post.pinnedCommentId === commentId) {
        this.logger.info('[pinComment] comment is already pinned', {
          postId,
          commentId,
          userId: currentUser.id,
        });
        return ok({ post, pinnedComment: comment });
      }
      await Promise.all([
        this.repo.update(postId, { pinnedCommentId: commentId }),
        this.challengeInteractionService.updateChallengeInteractionsIfAuthor({
          postOrChallenge: post,
          currentUser,
          objectId: comment.id,
          interactionType: ChallengeInteractionEnum.PINNED_COMMENT,
          context,
        }),
      ]);
      post.pinnedComment = comment;
      this.requestReIndex(postId);
      return ok({ post, pinnedComment: comment });
    } catch (error) {
      this.logger.error('[pinComment] error', {
        postId,
        commentId,
        userId: currentUser.id,
        error,
      });
      return err(new InternalServerErrorException('Unknown error', { error }));
    }
  }

  async unPinComment({
    postId,
    currentUser,
  }: {
    postId: string;
    currentUser: UserEntity;
  }): Promise<
    Result<
      PostEntity,
      NotFoundException | UnauthorizedException | InternalServerErrorException
    >
  > {
    try {
      const post = await this.repo.findById(postId);
      if (!post) {
        this.logger.error('[unPinComment] Post not found', {
          postId,
          userId: currentUser.id,
        });
        return err(new NotFoundException('Post not found'));
      }
      if (!post.pinnedComment) {
        this.logger.warn('[unPinComment] Post does not have pinned comment', {
          postId,
          userId: currentUser.id,
        });
      }
      if (post.authorId !== currentUser.id) {
        this.logger.error('[unPinComment] User is not the author of the post', {
          postId,
          userId: currentUser.id,
        });
        return err(
          new UnauthorizedException(
            'Only the challenge creator can unpin a comment'
          )
        );
      }
      await this.repo.update(postId, { pinnedCommentId: undefined });
      post.pinnedCommentId = null;
      post.pinnedComment = undefined;
      return ok(post);
    } catch (error) {
      this.logger.error('[unPinComment] Unknown error', {
        error,
        postId,
        userId: currentUser.id,
      });
      return err(
        new InternalServerErrorException('Error unpinning comment', {
          error,
        })
      );
    }
  }

  /**
   * Checks whether author of the post has blocked the user
   */
  async cannotViewPostErrorMessage(
    userId: string | undefined,
    postOrId: PostEntity | string,
    checkForBlock?: boolean,
    checkForBlockOnEitherSide?: boolean
  ): Promise<string | undefined> {
    const post =
      typeof postOrId === 'string'
        ? await this.findWithAuthorRelation(postOrId)
        : postOrId;
    if (!post) {
      this.logger.error('Post not found', { postId: postOrId });
      return kSomethingWentWrong;
    }
    let postAuthor = post?.author;
    if (!postAuthor) {
      postAuthor = await this.userService.findById(post.authorId);
      if (!postAuthor) {
        this.logger.error('Post author not found', { postId: post.id });
        return kSomethingWentWrong;
      }
    }
    if (userId && checkForBlock) {
      if (checkForBlockOnEitherSide) {
        const hasBlockedOnEitherSide =
          await this.userService.hasBlockedFromEitherSide({
            userA: postAuthor,
            userBId: userId,
          });
        if (hasBlockedOnEitherSide) return kSomethingWentWrong;
      } else {
        const hasBlocked = await this.userService.hasBlocked({
          userWhoBlocked: postAuthor,
          userIdToCheck: userId,
        });
        if (hasBlocked) {
          return kSomethingWentWrong;
        }
      }
    }
    if (!post.accessControl) {
      post.accessControl = this.getBackwardsCompatibleAccessControl(post);
    }
    switch (post.accessControl.postVisibilityAccessData.access) {
      case PostVisibilityAccess.EVERYONE:
        return;
      case PostVisibilityAccess.FOLLOWERS:
        if (userId === postAuthor.id) return;
        const followerIndex = userId
          ? await this.feedService.findIndex(
              postAuthor.followerFeedId ?? '',
              userId
            )
          : -1;
        if (followerIndex === -1) {
          return 'Only the followers can view this post';
        }
        return;
      case PostVisibilityAccess.INNER_CIRCLE:
        if (userId === postAuthor.id) return;
        const innerCircleMemberIndex = userId
          ? await this.userListService.findIndex(
              innerCircleListId(postAuthor.id),
              userId
            )
          : -1;
        if (innerCircleMemberIndex === -1) {
          return 'This post is no longer available';
        }
        return;
      case PostVisibilityAccess.LIST:
        break;
    }
  }

  /**
   * Checks whether author of the post has blocked the user
   *
   * @deprecated use AccessControlService.checkVisibilityAccessForMessage
   * instead
   */
  async canViewCommentsStatusAndMessage(
    userId: string | undefined,
    parentPostOrId: PostEntity | string,
    checkForBlock?: boolean
  ): Promise<CanViewCommentsResult> {
    const somethingWentWrongError = {
      errorMessage: kSomethingWentWrong,
      canViewComments: false,
    };
    const post =
      typeof parentPostOrId === 'string'
        ? await this.findWithAuthorRelation(parentPostOrId)
        : parentPostOrId;
    if (!post) {
      this.logger.error('Post not found', { postId: parentPostOrId });
      return somethingWentWrongError;
    }
    let postAuthor = post?.author;
    if (!postAuthor) {
      postAuthor = await this.userService.findById(post.authorId);
      if (!postAuthor) {
        this.logger.error('Post author not found', { postId: post.id });
        return somethingWentWrongError;
      }
    }
    if (!post.accessControl)
      post.accessControl = this.getBackwardsCompatibleAccessControl(post);
    return await this.commentService.canViewCommentsStatusAndMessage({
      checkForBlock,
      userId,
      parentAuthor: postAuthor,
      parentId: post.id,
      parentAuthorId: post.authorId,
      commentVisibilityAccessData:
        post.accessControl.commentVisibilityAccessData,
      messageParentType: 'post',
    });
  }

  getBackwardsCompatibleAccessControl(post: PostEntity): PostAccessControl {
    let accessControl = post.accessControl;
    //Backward compatibility?
    if (!accessControl) {
      accessControl = backwardCompatiblePostAccessControl(
        post.isPrivate ? PostVisibility.FOLLOWERS : PostVisibility.ALL,
        this.toGqlCommenterScopeValue(post.commentScopeType)
      );
    }
    post.accessControl = accessControl;
    return accessControl;
  }

  async addComment(
    currentUser: UserEntity,
    input: AddCommentInput,
    ctx: AppContext
  ): Promise<AddCommentResult | undefined> {
    const context = {
      postId: input.postId,
      challengeId: input.challengeId,
      userId: currentUser.id,
      participationType: input.participationType,
      methodName: 'addComment',
    };
    const post = await this.repo.findById(input.postId!, {
      relations: [
        PostEntity.kAuthorRelation,
        `${PostEntity.kAuthorRelation}.${UserEntity.kActivityStreamRelation}`,
      ],
    });
    if (post === undefined) {
      throw new ValidationError('Post not found');
    }
    if (post.isParentPostDeleted()) {
      throw new ValidationError('Can no longer comment on this post');
    }
    const comment = await this.commentService.addComment({
      currentUser,
      parentId: post.id,
      parentAuthor: post.author!,
      commentPostingAccessData:
        post.accessControl?.commentPostingAccessData ??
        defaultPostAccessControl().commentPostingAccessData,
      parentType: CommentParentType.POST,
      input,
    });
    const feed = await this.feedService.tryUnshiftEntry(
      post.commentFeedId,
      currentUser.id + ID_SEPARATOR + comment.id
    );
    if (!feed) return undefined;
    post.stats = { ...post.stats, commentCount: feed.count };
    const results = await Promise.allSettled([
      this.repo.update(post.id, { _stats: post.stats }),
      this.challengeInteractionService.updateChallengeInteractionsIfAuthor({
        postOrChallenge: post,
        currentUser,
        objectId: comment.id,
        interactionType: ChallengeInteractionEnum.COMMENTED,
        context: ctx,
      }),
      this.userService.updateUserInteractionsCount(
        currentUser.id,
        post.authorId
      ),
      this.userService.updatePostTypeInteractionCount(currentUser.id, [
        post.type,
      ]),
      post.categoryIds &&
        this.userService.updateCategoryInteractionCount(
          currentUser.id,
          post.categoryIds
        ),
      this.notifyAuthorWorker.commentOnPostJob({
        commentId: comment.id,
        postId: post.id,
        subjectId: currentUser.id,
        timeStamp: ctx.timeStamp!,
      }),
      this.findMentionedUsersInCommentAndNotifyThem(comment),
    ]);
    results.forEach(result => {
      if (result.status === 'rejected') {
        this.logger.error(
          'Error updating post stats: ' + result.reason.message,
          { error: result.reason, ...context }
        );
      }
    });
    this.requestReIndex(post.id);
    ctx.posts[post.id] = post;
    ctx.comments[comment.id] = comment;
    return {
      __typename: 'AddCommentResult',
      post: this.toGqlPostObject(post),
      comment: this.commentService.toCommentObject(comment),
    };
  }

  async deleteComment(comment: CommentEntity): Promise<PostEntity | undefined> {
    this.logger.info('deleteComment()...', { id: comment.id });
    if (!comment.postId) return;
    const post = await this.findById(comment.postId);
    if (!post) return;
    if (!comment) {
      this.logger.error('Comment not found');
      return;
    }
    const feed = await this.feedService.tryRemoveEntries(post.commentFeedId, [
      comment.id, //backwards compatibility
      comment.authorId + ID_SEPARATOR + comment.id,
    ]);
    if (!feed) return undefined;
    post.stats = { ...post.stats, commentCount: feed.count };
    await this.save(post);
    this.requestReIndex(post.id);
    return post;
  }

  async sharePost(id: string): Promise<PostEntity | undefined> {
    const post = await this.findWithAuthorRelation(id);
    if (!post) return Promise.resolve(undefined);
    post.incrementShares();
    const updatedPost = await this.repo.save(post);
    this.requestReIndex(post.id);
    return updatedPost;
  }

  async report(
    postId: string,
    reportTypeVal: ReportType,
    currentUser?: UserEntity
  ): Promise<PostEntity | string> {
    const reportType: ReportType = ReportType[
      reportTypeVal
    ] as unknown as ReportType;
    if (currentUser) {
      const reportPostFeed = await this.feedService.find(
        currentUser.reportPostFeedId ?? ''
      );
      if (!reportPostFeed) {
        this.logger.error('Cannot report, reportPostFeed not found', {
          userId: currentUser.id,
        });
        return 'Something went wrong';
      }
      const post = await this.findWithPinnedComment(postId);
      if (!post) {
        this.logger.error('Cannot report, post not found', {
          postId,
          userId: currentUser.id,
        });
        return 'Sorry, post not found';
      }
      this.logger.debug(
        `${typeof reportType} reportType = ${reportType} ->  ${reportType.valueOf()} -> ${
          ReportType.UNREPORT
        }`
      );
      if (reportType.valueOf() === ReportType.UNREPORT) {
        if (reportPostFeed.hasEntry(postId)) {
          post.decrementReportCount();
          await Promise.all([
            this.feedService.tryRemoveEntry(reportPostFeed, postId),
            this.repo.save(post),
          ]);
          return post;
        } else {
          return 'This post has already been unreported by you!';
        }
      } else {
        if (reportPostFeed.hasEntry(postId)) {
          return 'You cannot report this post again!';
        } else {
          post.incrementReportCount();
          await Promise.all([
            this.feedService.tryUnshiftEntry(reportPostFeed, postId),
            this.repo.save(post),
          ]);
          this.logger.debug('CREATING REPORT');
          await this.reportWorker.createReport({
            objectAuthorId: post.authorId,
            objectType: ReportObjectTypeEnum.POST,
            objectId: postId,
            reporterId: currentUser.id,
            reportType,
            reporterComment: '',
          });
          this.requestReIndex(postId);
          await this.addOrRemovePostsFromFeedWorker.removePostsIdsFromPostFeeds(
            {
              postIds: [postId],
              ownerId: currentUser.id,
            }
          );
        }
      }
      return post;
    } else {
      //Anonymous Report
      const post = await this.findById(postId);
      if (!post) {
        this.logger.error('Cannot report post, post not found', { postId });
        return 'Sorry, post not found';
      }
      if (reportType === ReportType.UNREPORT) {
        return 'You must log in first.';
      }
      this.reportWorker.createReport({
        objectAuthorId: post.authorId,
        objectType: ReportObjectTypeEnum.POST,
        objectId: postId,
        reporterId: '',
        reportType,
        reporterComment: '',
      });
      post.incrementReportCount();
      this.requestReIndex(postId);
      return post;
    }
  }

  async save(post: PostEntity) {
    await this.repo.save(post);
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
      | FindConditions<PostEntity>,
    partialEntity: QueryDeepPartialEntity<PostEntity>
  ): Promise<UpdateResult> {
    return this.repo.update(criteria, partialEntity);
  }

  async getRepostedPostsList(
    postId: string,
    paginationInput: PaginationInput
  ): Promise<RepostedPostsListResult> {
    const feedId = toFeedId(FeedEntityType.REPOSTED_POSTS, postId);
    const response: PaginateEntriesResponse =
      await this.feedService.paginateEntries(feedId, paginationInput);
    const posts: PostEntity[] =
      (await this.findByIds(response.ids, {}, true)) ?? [];
    return {
      posts,
      ...response,
    };
  }

  async getReactorsList(
    postOrId: PostEntity | string,
    reactionType: ReactionType,
    first?: number,
    after?: string,
    last?: number,
    before?: string
  ): Promise<[UserEntity[], boolean, boolean, number] | undefined> {
    const post =
      typeof postOrId === 'string'
        ? await this.repo.findById(postOrId)
        : postOrId;
    if (!post) return undefined;
    let feed: FeedEntity | undefined;
    switch (reactionType) {
      case ReactionType.REAL:
        this.print(' REAL ');
        feed = await this.feedService.find(post.realReactionFeedId ?? '');
        break;
      case ReactionType.APPLAUD:
        feed = await this.feedService.find(post.applaudReactionFeedId ?? '');
        break;
      case ReactionType.LIKE:
        feed = await this.feedService.find(post.likeReactionFeedId ?? '');
        break;
      default:
        return;
    }
    if (!feed) {
      this.logger.warn('Cannot find reaction feed', {
        postId: post.id,
        reactionType,
      });
      return undefined;
    }
    const [page, hasNextPage, hasPreviousPage] = await this.feedService.getPage(
      {
        feedOrId: feed,
        first,
        after,
        last,
        before,
      }
    );
    const users = await this.userService.findAllById(page.ids);
    return [users, hasNextPage, hasPreviousPage, feed.count];
  }

  async softDelete(
    postId: string,
    currentUser: UserEntity
  ): Promise<PostEntity | string> {
    this.logger.debug('Deleting post', { postId, userId: currentUser.id });
    const post = await this.repo.findById(postId, {
      relations: [],
      shouldSkipDeletedPosts: false,
      shouldSkipSuspendedPosts: false,
    });
    if (!post) {
      this.logger.error('Cannot delete post, post not found', {
        postId,
        userId: currentUser.id,
      });
      return 'Sorry, post not found';
    }
    if (currentUser.id !== post.authorId) {
      return 'Only the author of this post can delete it';
    }
    const author = await this.userService.findById(post.authorId);
    if (!author) {
      this.logger.error('Author not found for post', {
        postId: post.id,
        authorId: post.authorId,
      });
      return 'Something went wrong';
    }
    if (post.willBeDeleted) return post;
    let parentPost: PostEntity | undefined;
    if (post.isRepost()) {
      if (post.repostMeta?.parentPostId) {
        parentPost = await this.findById(post.repostMeta.parentPostId);
      }
    }
    post.willBeDeleted = true;
    await this.repo.repository.manager.transaction<void>(
      async entityManager => {
        await entityManager.update(
          PostEntity,
          { id: post.id },
          { willBeDeleted: true }
        );
        author.decrementPostCount();
        await entityManager.update(
          UserEntity,
          { id: post.authorId },
          { _stats: author.getStats() }
        );
        await entityManager.update(
          UserEntity,
          { id: post.authorId },
          { _stats: author.getStats() }
        );
        //DECREMENT REPOST COUNT
        if (!parentPost) return;
        const result: RemoveFeedEntryResult =
          await this.feedService.removeEntry(
            toFeedId(FeedEntityType.REPOSTED_POSTS, parentPost.id),
            post.id,
            { repo: entityManager.getRepository(FeedEntity) }
          );
        await this.feedService.removeEntry(
          toFeedId(FeedEntityType.REPOST_AUTHORS, parentPost.id),
          post.authorId,
          { repo: entityManager.getRepository(FeedEntity) }
        );
        if (parentPost.repostMeta) {
          await entityManager.update(
            PostEntity,
            { id: parentPost.id },
            {
              repostMeta: {
                repostCount: result.entity?.count,
                repostedPostsFeedId: toFeedId(
                  FeedEntityType.REPOSTED_POSTS,
                  parentPost.id
                ),
              },
            }
          );
        }
      }
    );
    if (!post.isRepost()) {
      await this.repostParentDeletedWorker.onParentPostDeleted({
        parentPostId: post.id,
      });
    }
    if (post.parentChallengeId) {
      await this.challengeCleanupProducer.cleanupAfterPostDeletion({
        postId: post.id,
        challengeId: post.parentChallengeId,
        userId: post.authorId,
      });
    }
    this.requestReIndex(post.id);
    return post;
  }

  async hardDelete(post: PostEntity) {
    await this.repo.repository.remove(post);
    this.requestReIndex(post.id);
  }

  async getWillBeDeletedPosts(take = 10): Promise<PostEntity[]> {
    return await this.repo.repository.find({
      take,
      where: { willBeDeleted: true },
    });
  }

  async addCategories(
    categories: string[],
    post: PostEntity,
    shouldDistributeRightAway = false
  ): Promise<PostEntity> {
    try {
      if (!post.categoryIds) {
        post.categoryIds = [];
      }
      post.categoryIds.push(...categories);
      await this.repo.save(post);
      await this.feedService.removeFromAnnotationsPendingPostsFeed(post.id);
      if (process.env.DIST_ANTD_POSTS_ASAP === 'true') {
        await this.distributeAnnotatedPostWorker.distributeAnnotatedPost({
          postId: post.id,
        });
      } else {
        await this.feedService.addToAnnotatedUndistributedPostsFeed(post.id); //for cron to pick it up
      }
      if (!post.isPrivate) {
        const whiteListedCategoriesStr = process.env.CATEGORIES;
        if (whiteListedCategoriesStr) {
          const whiteListedCategories = whiteListedCategoriesStr.split(',');
          if (
            isSubset(categories, whiteListedCategories) ||
            shouldDistributeRightAway
          ) {
            await this.feedService.tryUnshiftEntry(
              GLOBAL_ALL_POSTS_FEED_ID,
              post.id
            );
            await this.feedService.tryUnshiftEntry(
              toFeedId(GlobalPostsFeedTypesBasedOnPostTypes[post.type], ''),
              post.id
            );
          } else {
            this.logger.info('Not a subset');
          }
        } else {
          this.logger.error(
            'No CATEGORIES found in env file. Could not' +
              ' distribute post to GLOBAL_FEED',
            { postId: post.id }
          );
        }
      }
      this.requestReIndex(post.id);
      return post;
    } catch (e) {
      this.logger.error(e);
      return post;
    }
  }

  async takeDownPosts(postIds: string[]): Promise<boolean> {
    const result = await this.update(postIds, {
      state: ExistenceState.TAKEN_DOWN,
    });
    postIds.map(postId => this.requestReIndex(postId));
    this.logger.info('takeDownPosts', { result });
    return true;
  }

  async takeDown(postOrId: string | PostEntity): Promise<boolean> {
    const postId = typeof postOrId === 'string' ? postOrId : postOrId.id;
    const result = await this.update(postId, {
      state: ExistenceState.TAKEN_DOWN,
    });
    this.requestReIndex(postId);
    this.logger.info('takeDown', { result });
    return result.affected !== undefined;
  }

  async respawn(postOrId: string | PostEntity): Promise<boolean> {
    const postId = typeof postOrId === 'string' ? postOrId : postOrId.id;
    const result = await this.update(postId, { state: undefined });
    this.requestReIndex(postId);
    this.logger.info('respawn', { result });
    return result.affected !== undefined;
  }

  async respawnPosts(postIds: string[]): Promise<boolean> {
    const result = await this.update(postIds, { state: undefined });
    postIds.map(postId => this.requestReIndex(postId));
    this.logger.info('Respawned posts', { result });
    return result.affected !== undefined;
  }

  async changeSensitiveStatus(
    postOrId: string | PostEntity,
    status?: SensitiveStatus
  ): Promise<boolean> {
    const postId = typeof postOrId === 'string' ? postOrId : postOrId.id;
    const result = await this.update(postId, { sensitiveStatus: status });
    this.requestReIndex(postId);
    this.logger.info('changeSensitiveStatus', { result });
    return result.affected !== undefined;
  }

  @WildrExceptionDecorator()
  async blockCommenterOnPost(
    postId: string,
    commenterId: string,
    blockOperationType: BlockOperationType,
    currentUser?: UserEntity
  ): Promise<{
    postId: string;
    commenterId: string;
    blockOperationType: BlockOperationType;
  }> {
    this.logger.info('[blockCommenterOnPost]', {
      postId,
      commenterId,
      blockOperationType,
    });
    if (!currentUser)
      throw new UnauthorizedException('You must be logged in to block users', {
        commenterId,
        postId,
      });
    if (currentUser.id === commenterId)
      throw new BadRequestException('You cannot block yourself', {
        userId: currentUser?.id,
        commenterId,
        postId,
      });
    const post = await this.repo.findById(postId);
    if (!post)
      throw new NotFoundException('Post not found', {
        userId: currentUser?.id,
        commenterId,
        postId,
      });
    if (post.authorId !== currentUser.id)
      throw new ForbiddenException(
        `Only the post author can block users from commenting`,
        {
          userId: currentUser?.id,
          commenterId,
          postId,
        }
      );
    if (blockOperationType === BlockOperationType.BLOCK) {
      // TODO use paginated feeds when race conditions are resolved
      await this.feedService.tryUnshiftEntry(
        toFeedId(FeedEntityType.BLOCKED_COMMENTERS_ON_POST, postId),
        commenterId
      );
    } else if (blockOperationType === BlockOperationType.UN_BLOCK) {
      // TODO use paginated feeds when race conditions are resolved
      await this.feedService.tryRemoveEntry(
        toFeedId(FeedEntityType.BLOCKED_COMMENTERS_ON_POST, postId),
        commenterId
      );
    } else {
      throw new BadRequestException('Block operation type not implemented', {
        blockOperationType,
        postId,
        commenterId,
      });
    }
    return {
      blockOperationType,
      commenterId,
      postId,
    };
  }

  @WildrExceptionDecorator()
  async userIsBlockedFromCommenting(
    postId: string,
    userId: string
  ): Promise<boolean> {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.BLOCKED_COMMENTERS_ON_POST, postId)
    );
    if (!feed) return false;
    return feed.hasEntry(userId);
  }

  @WildrExceptionDecorator()
  async getCommentCountForUser(
    postId: string,
    currentUser?: UserEntity
  ): Promise<number> {
    return this.commentService.getCommentCountForUser(
      postId,
      CommentParentType.POST,
      currentUser
    );
  }

  async requestReIndex(postId: string): Promise<void> {
    return retryWithBackoff({
      fn: () =>
        this.incrementalIndexStateWorker.requestIncrementalIndex({
          entityName: 'PostEntity',
          entityId: postId,
        }),
      retryCount: 3,
      throwAfterFailedRetries: false,
      logFailure: error =>
        this.logger.error('Error creating re-index request job' + error, {
          postId,
        }),
    });
  }

  /**
   * @deprecated use access control service instead
   */
  async cannotCommentErrorMessage(
    currentUserId: string | undefined,
    post: PostEntity,
    checkForHasBlocked?: boolean
  ) {
    return await this.commentService.cannotCommentErrorMessage({
      userId: currentUserId,
      parentAuthor: post.author,
      parentAuthorId: post.authorId,
      parentType: CommentParentType.POST,
      parentId: post.id,
      commentPostingAccessData:
        post.accessControl?.commentPostingAccessData ??
        defaultPostAccessControl().commentPostingAccessData,
      checkForHasBlocked,
    });
  }

  async isPinnedToChallenge({
    postId,
    challengeId,
    context,
  }: {
    postId: string;
    challengeId: string;
    context: AppContext;
  }): Promise<Result<boolean, InternalServerErrorException>> {
    try {
      if (!context.challengePinnedPosts[challengeId]) {
        context.challengePinnedPosts[challengeId] = [];
        const challengePinnedPostsFeed =
          await this.feedService.getAllEntriesFromEveryPage({
            feedId: getChallengePinnedEntriesFeedId(challengeId),
          });
        for (const id of challengePinnedPostsFeed.stitchedIdsList) {
          const entry = fromChallengeParticipantPostEntryStr(id);
          if (entry?.postId) {
            context.challengePinnedPosts[challengeId].push(entry.postId);
          }
        }
      }
      return ok(context.challengePinnedPosts[challengeId].includes(postId));
    } catch (error) {
      if (error instanceof WildrException) return err(error);
      return err(
        new InternalServerErrorException(
          'Error check if post is pinned to challenge: ' + error,
          {
            postId,
            challengeId,
            service: this.constructor.name,
            methodName: 'isPinnedToChallenge',
          },
          error
        )
      );
    }
  }
}

export const getFilteredPosts = async (
  feedId: string,
  feedEntity: FeedEntity,
  logger: Logger,
  feedService: FeedService,
  postService: PostService,
  first?: number,
  after?: string,
  last?: number,
  before?: string,
  predicate?: FindConditions<PostEntity>
): Promise<[PostEntity[], boolean, boolean]> => {
  let hasFoundRequiredNumberOfPosts = false;
  let foundPostsCount = 0;
  let _hasPreviousPage = false;
  let _hasNextPage = false;
  let _posts: PostEntity[] = [];
  let afterCursor = after;
  let infiniteLoopCheckCounter = 0;
  while (!hasFoundRequiredNumberOfPosts) {
    infiniteLoopCheckCounter += 1;
    if (infiniteLoopCheckCounter == 50) {
      logger.error('RAN INTO INFINITE LOOP');
      break;
    }
    const [page, hasPreviousPage, hasNextPage] = await feedService.getPage({
      feedOrId: feedEntity,
      first,
      after: afterCursor,
      last,
      before,
    });
    _hasPreviousPage = hasPreviousPage;
    _hasNextPage = hasNextPage;
    afterCursor = _.last(page.ids) ?? '';
    const posts: PostEntity[] =
      (
        await postService.findAllNonExpired(
          page.ids,
          [
            PostEntity.kAuthorRelation,
            PostEntity.kLikeReactionFeedRelation,
            PostEntity.kParentChallengeRelation,
          ],
          predicate
        )
      ).filter(p => p !== undefined) ?? [];
    if (posts.length == 0 && !hasNextPage) {
      hasFoundRequiredNumberOfPosts = true;
      break;
    }
    foundPostsCount += posts.length;
    hasFoundRequiredNumberOfPosts =
      foundPostsCount >= (first ?? 8) || !hasNextPage;
    _posts = _posts.concat(posts);
    const lastPostId = _.last(page.ids);
    if (lastPostId) {
      afterCursor = lastPostId;
    }
    if (afterCursor === '') {
      hasFoundRequiredNumberOfPosts = true;
    }
  } //end of while loop
  return [_posts, _hasPreviousPage, _hasNextPage];
};

export interface CreateAndDistributePostArgs {
  author: UserEntity;
  post: PostEntity;
  postKind: PostKind;
  visibility?: PostVisibility;
  commenterScope?: CommenterScope;
  expirationHours?: number;
  body?: string;
  accessControl?: PostAccessControl;
  userIdsToSkip?: string[];
  shouldDistributePostInBatchesUsingWorker?: boolean;
  challengeId?: string;
}

export interface CreatePostResult {
  post?: PostEntity;
  parentPost?: PostEntity;
  trollData?: Map<number, string | undefined>;
  errorMessage?: string;
  restrictedChallengeEntryError?: RestrictedChallengeEntryError;
}

export interface RepostedPostsListResult {
  posts: PostEntity[];
  hasMoreItems: boolean;
  hasPreviousItems: boolean;
}

export interface CanViewCommentsResult {
  canViewComments: boolean;
  errorMessage?: string;
  /**
   * Detailed explanation for a user
   */
  infoMessage?: string;
}

export interface CanPostCommentResult {
  canPostComment: boolean;
  errorMessage?: string;
}
