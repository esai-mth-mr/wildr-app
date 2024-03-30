import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityStreamService } from '@verdzie/server/activity-stream/activity.stream.service';
import {
  HasNotJoinedChallengeException,
  updateJoinedChallengeEntryPost,
} from '@verdzie/server/challenge/userJoinedChallenges.helper';
import {
  kSomethingWentWrong,
  retryWithBackoff,
  toUrl,
} from '@verdzie/server/common';
import { generateId } from '@verdzie/server/common/generateId';
import {
  PaginateParams,
  PassFailState,
  preserveOrderByIds,
} from '@verdzie/server/data/common';
import { EntitiesWithPagesCommon } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import {
  BadRequestException,
  BadRequestExceptionCodes,
  DebugData,
  InternalServerErrorException,
  InternalServerErrorExceptionCodes,
  NotFoundException,
  NotFoundExceptionCodes,
  WildrException,
} from '@verdzie/server/exceptions/wildr.exception';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';
import {
  ConsumedPostsFeedEnums,
  FeedEntity,
  FeedEntityType,
  ICYMFollowingPostsFeedEnums,
  ICYMPostsFeedEnums,
  InterestedAccountsFeedEnums,
  PersonalizedFeedEnums,
  PersonalizedFollowingFeedEnums,
  RelevantFollowingPostsFeedEnums,
  RelevantPostsFeedEnums,
  RemainingFollowingPostsFeedEnums,
  RemainingPostsFeedEnums,
  UserInterestsFeedEnums,
  UserPubPostsFeedEnums,
  UserPubPvtPostsFeedEnums,
  UserPubPvtStoriesFeedEnums,
  UserPubStoriesFeedEnums,
  kvpToMap,
  mapToKVP,
} from '@verdzie/server/feed/feed.entity';
import { FeedService, toFeedId } from '@verdzie/server/feed/feed.service';
import { FirebaseAuthService } from '@verdzie/server/firebase-auth/firebase-auth.service';
import { InviteCodeEntity } from '@verdzie/server/invite-code/inviteCode.entity';
import {
  InviteCodeAction,
  fromGqlInviteCodeAction,
} from '@verdzie/server/invite-code/inviteCode.helper';
import { InviteCodeService } from '@verdzie/server/invite-code/inviteCode.service';
import { OpenSearchIndexService } from '@verdzie/server/open-search/open-search-index/openSearchIndex.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import {
  RealIdFaceData,
  RealIdFailedVerificationImageData,
  RealIdHandGesture,
  RealIdVerificationStatus,
  getRealIdHandGesture,
} from '@verdzie/server/real-id/realId';
import { CDNPvtUrlSigner } from '@verdzie/server/upload/CDNPvtUrlSigner';
import { S3UrlPreSigner } from '@verdzie/server/upload/s3UrlPreSigner';
import { UploadService } from '@verdzie/server/upload/upload.service';
import { UserListEntity } from '@verdzie/server/user-list/userList.entity';
import { UserListService } from '@verdzie/server/user-list/userList.service';
import {
  UserPropertyMapEntity,
  userPropertyMapToKvP,
} from '@verdzie/server/user-property-map/userPropertyMap.entity';
import { UserPropertyMapService } from '@verdzie/server/user-property-map/userPropertyMap.service';
import {
  ListVisibility,
  UserListVisibility,
  toGqlVisibilityPreferences,
} from '@verdzie/server/user/data/userListVisibility';
import { UserStatsService } from '@verdzie/server/user/user-stats.service';
import {
  FIRST_STRIKE_COOLDOWN_DAYS,
  UserEntity,
  UserJwtToken,
  UserLocalizationData,
  UserLoginResult,
  UserOnboarding,
  UserStrikeData,
} from '@verdzie/server/user/user.entity';
import { AddOrRemovePostsFromFeedProducer } from '@verdzie/server/worker/add-remove-posts-feed/addOrRemovePostsFromFeed.producer';
import {
  FollowEventFillUpJob,
  FollowEventFillUpProducer,
} from '@verdzie/server/worker/follow-event-fillup/followEventFillup.producer';
import { NotifyAddedToICProducer } from '@verdzie/server/worker/notify-add-to-inner-circle/notifyAddedToIC.producer';
import { NotifyAuthorProducer } from '@verdzie/server/worker/notify-author/notifyAuthor.producer';
import { OSIncrementalIndexStateProducer } from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.producer';
import { PrepareInitialFeedProducer } from '@verdzie/server/worker/prepare-initial-feed/prepareInitialFeed.producer';
import {
  ScoreDataProducer,
  UpdateScoreDataJob,
  UserScoreDataRelatedActionEnum,
} from '@verdzie/server/worker/score-data/scoreData.producer';
import {
  UnfollowEventCleanupJob,
  UnfollowEventCleanupProducer,
} from '@verdzie/server/worker/unfollow-event-cleaup/unfollowEventCleanup.producer';
import * as bcrypt from 'bcrypt';
import passwordGenerator from 'generate-password';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, fromPromise, ok } from 'neverthrow';
import {
  EntityManager,
  FindConditions,
  FindOneOptions,
  IsNull,
  LessThan,
  MoreThan,
  QueryRunner,
  Raw,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Logger } from 'winston';
import {
  InviteCodeAction as GqlInviteCodeAction,
  RealIdVerificationStatus as GqlRealIdVerificationStatus,
  LinkData,
  OnboardingStats,
  OnboardingType,
  PageInfo,
  ReportType,
  UpdateOnboardingInput,
  Upload,
} from '../generated-graphql';
import {
  CommentReplyContext,
  FirebaseAuthEmailInput,
  FirebaseAuthPhoneNumberInput,
  FirebaseSignupInput,
  Gender,
  RealIdFailedVerificationImageData as GqlRealIdFailedVerificationImageData,
  User as GqlUser,
  UserStrikeData as GqlUserStrikeData,
  PostCommentContext,
  PostContext,
  SignUpWithEmailInput,
  SignUpWithPhoneNumberInput,
  UserContext,
  WildrVerifiedManualReviewInput,
} from '../graphql';
import { DecodedIdToken } from 'firebase-admin/auth';
import { InviteListRecordingProducer } from '@verdzie/server/worker/invite-list-recording/invite-list-recording.producer';
import { PostgresQueryFailedException } from '@verdzie/server/typeorm/postgres-exceptions';

export enum RingColor {
  RED,
  ORANGE,
  GREEN,
}

const toGenderValue = (index: number): Gender => {
  switch (index) {
    case 1:
      return Gender.FEMALE;
    case 2:
      return Gender.MALE;
    case 3:
      return Gender.NOT_SPECIFIED;
    case 4:
      return Gender.OTHER;
    default:
      return Gender.NOT_SPECIFIED;
  }
};

const genderToPronounString = (
  gender: Gender
): 'she/her' | 'he/him' | 'they/them' | undefined => {
  switch (gender) {
    case Gender.FEMALE:
      return 'she/her';
    case Gender.MALE:
      return 'he/him';
    case Gender.OTHER:
      return 'they/them';
    default:
      return undefined;
  }
};

const toRealIdVerificationStatus = (
  index: number
): GqlRealIdVerificationStatus => {
  switch (index) {
    case 0:
      return GqlRealIdVerificationStatus.UNVERIFIED;
    case 1:
      return GqlRealIdVerificationStatus.PENDING_REVIEW;
    case 2:
      return GqlRealIdVerificationStatus.REVIEW_REJECTED;
    case 3:
      return GqlRealIdVerificationStatus.VERIFIED;
    default:
      return GqlRealIdVerificationStatus.UNVERIFIED;
  }
};

const NUMBER_OF_COMMENT_EMBARGO_DAYS = 7;

/**
 * Check if a given date or iso string corresponds to a date that is less than
 * two days ago
 */
function isLessThanDaysAgo(date: Date | string, days: number): boolean {
  const now = new Date();
  const timeDiff = now.getTime() - new Date(date).getTime();
  const daysDiff = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
  return daysDiff < days;
}

@Injectable()
export class UserService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private jwtService: JwtService,
    @InjectRepository(UserEntity)
    public repo: Repository<UserEntity>,
    private feedService: FeedService,
    private s3UrlPreSigner: S3UrlPreSigner,
    private cdnPvtS3UrlPreSigner: CDNPvtUrlSigner,
    private uploadService: UploadService,
    private activityStreamService: ActivityStreamService,
    private esIndexService: OpenSearchIndexService,
    private notifyAuthorWorker: NotifyAuthorProducer,
    private addOrRemovePostsFromFeedWorker: AddOrRemovePostsFromFeedProducer,
    private scoreDataWorker: ScoreDataProducer,
    private firebaseAuthService: FirebaseAuthService,
    private inviteCodeService: InviteCodeService,
    private prepareInitialFeedWorker: PrepareInitialFeedProducer,
    private userPropertyMapService: UserPropertyMapService,
    private userListService: UserListService,
    private entitiesWithPagesCommon: EntitiesWithPagesCommon,
    private notifyAddedToICProducer: NotifyAddedToICProducer,
    private unfollowEventCleanupWorker: UnfollowEventCleanupProducer,
    private followEventFillUpWorker: FollowEventFillUpProducer,
    private incrementalIndexStateWorker: OSIncrementalIndexStateProducer,
    private readonly userStatsService: UserStatsService,
    private readonly inviteListRecordingProducer: InviteListRecordingProducer
  ) {
    this.logger = this.logger.child({ context: 'UserService' });
  }

  //region PostsFeeds
  private async generateFeeds(
    userId: string,
    enums: FeedEntityType[]
  ): Promise<boolean> {
    this.logger.debug('GenerateFeeds', { enums });
    const feeds = await this.feedService.createAll(enums, userId);
    return feeds.length === enums.length;
  }

  private async removeFeeds(
    userId: string,
    enums: FeedEntityType[]
  ): Promise<boolean> {
    const deleteResult = await this.feedService.deleteAll(enums, userId);
    this.logger.info('removeFeeds()', { deleteResult });
    return deleteResult.affected === 5;
  }

  private async generatePersonalizedFeed(userId: string): Promise<boolean> {
    this.logger.debug('generatePersonalizedFeed');
    return await this.generateFeeds(userId, PersonalizedFeedEnums);
  }

  private async removePersonalizedFeed(userId: string): Promise<boolean> {
    return await this.removeFeeds(userId, PersonalizedFeedEnums);
  }

  private async generateRelevantPostsFeed(userId: string): Promise<boolean> {
    return await this.generateFeeds(userId, RelevantPostsFeedEnums);
  }

  private async removeRelevantPostsFeed(userId: string) {
    return await this.removeFeeds(userId, RelevantPostsFeedEnums);
  }

  private async generateICYMPostsFeed(userId: string): Promise<boolean> {
    return await this.generateFeeds(userId, ICYMPostsFeedEnums);
  }

  private async removeICYMPostsFeed(userId: string) {
    return await this.removeFeeds(userId, ICYMPostsFeedEnums);
  }

  private async generateRemainingPostsFeed(userId: string) {
    return await this.generateFeeds(userId, RemainingPostsFeedEnums);
  }

  private async removeRemainingPostsFeed(userId: string) {
    return await this.removeFeeds(userId, RemainingPostsFeedEnums);
  }

  //FollowingsPostsFeed
  private async generatePersonalizedFollowingFeed(
    userId: string
  ): Promise<boolean> {
    return await this.generateFeeds(userId, PersonalizedFollowingFeedEnums);
  }

  private async removePersonalizedFollowingFeed(
    userId: string
  ): Promise<boolean> {
    return await this.removeFeeds(userId, PersonalizedFollowingFeedEnums);
  }

  private async generateRelevantFollowingPostsFeed(
    userId: string
  ): Promise<boolean> {
    return await this.generateFeeds(userId, RelevantFollowingPostsFeedEnums);
  }

  private async removeRelevantFollowingPostsFeed(userId: string) {
    return await this.removeFeeds(userId, RelevantFollowingPostsFeedEnums);
  }

  private async generateICYMFollowingPostsFeed(
    userId: string
  ): Promise<boolean> {
    return await this.generateFeeds(userId, ICYMFollowingPostsFeedEnums);
  }

  private async removeICYMFollowingPostsFeed(userId: string) {
    return await this.removeFeeds(userId, ICYMFollowingPostsFeedEnums);
  }

  private async generateRemainingFollowingPostsFeed(userId: string) {
    return await this.generateFeeds(userId, RemainingFollowingPostsFeedEnums);
  }

  private async removeRemainingFollowingPostsFeed(userId: string) {
    return await this.removeFeeds(userId, RemainingFollowingPostsFeedEnums);
  }

  //PubPosts
  private async generateUserPubPostsFeed(userId: string) {
    return await this.generateFeeds(userId, UserPubPostsFeedEnums);
  }

  private async removeUserPubPostsFeed(userId: string) {
    return await this.removeFeeds(userId, UserPubPostsFeedEnums);
  }

  //Consumed Posts
  private async generateConsumedPostsFeed(userId: string) {
    return await this.generateFeeds(userId, ConsumedPostsFeedEnums);
  }

  private async removeConsumedPostsFeed(userId: string) {
    return await this.removeFeeds(userId, ConsumedPostsFeedEnums);
  }

  //PubPvtPosts
  private async generateUserPubPvtPostsFeed(userId: string) {
    return await this.generateFeeds(userId, UserPubPvtPostsFeedEnums);
  }

  private async removeUserPubPvtPostsFeed(userId: string) {
    return await this.removeFeeds(userId, UserPubPvtPostsFeedEnums);
  }

  //PubStories
  private async generateUserPubStoriesFeed(userId: string) {
    return await this.generateFeeds(userId, UserPubStoriesFeedEnums);
  }

  private async removeUserPubStoriesFeed(userId: string) {
    return await this.removeFeeds(userId, UserPubStoriesFeedEnums);
  }

  //PubPvtStories
  private async generateUserPubPvtStoriesFeed(userId: string) {
    return await this.generateFeeds(userId, UserPubPvtStoriesFeedEnums);
  }

  private async removeUserPubPvtStoriesFeed(userId: string) {
    return await this.removeFeeds(userId, UserPubPvtStoriesFeedEnums);
  }

  async generateAllPostRelatedFeeds(id: string): Promise<boolean> {
    if (!(await this.generatePersonalizedFeed(id))) {
      this.logger.error('Failed to generatePersonalizedFeed');
      await this.removePersonalizedFeed(id);
      return false;
    }
    if (!(await this.generateRelevantPostsFeed(id))) {
      this.logger.error('Failed to generateRelevantPostsFeed');
      await this.removeRelevantPostsFeed(id);
      return false;
    }
    if (!(await this.generateICYMPostsFeed(id))) {
      this.logger.error('Failed to generateICYMPostsFeed');
      await this.removeICYMPostsFeed(id);
      return false;
    }
    if (!(await this.generateRemainingPostsFeed(id))) {
      this.logger.error('Failed to generateRemainingPostsFeed');
      await this.removeRemainingPostsFeed(id);
      return false;
    }
    if (!(await this.generatePersonalizedFollowingFeed(id))) {
      this.logger.error('Failed to generatePersonalizedFollowingFeed');
      await this.removePersonalizedFollowingFeed(id);
      return false;
    }
    if (!(await this.generateRelevantFollowingPostsFeed(id))) {
      this.logger.error('Failed to generateRelevantFollowingPostsFeed');
      await this.removeRelevantFollowingPostsFeed(id);
      return false;
    }
    if (!(await this.generateICYMFollowingPostsFeed(id))) {
      this.logger.error('Failed to generateICYMFollowingPostsFeed');
      await this.removeICYMFollowingPostsFeed(id);
      return false;
    }
    if (!(await this.generateRemainingFollowingPostsFeed(id))) {
      this.logger.error('Failed to generateRemainingFollowingPostsFeed');
      await this.removeRemainingFollowingPostsFeed(id);
      return false;
    }
    if (!(await this.generateUserPubPostsFeed(id))) {
      this.logger.error('Failed to generateUserPubPostsFeed');
      await this.removeUserPubPostsFeed(id);
      return false;
    }
    if (!(await this.generateUserPubPvtPostsFeed(id))) {
      this.logger.error('Failed to generateUserPubPvtPostsFeed');
      await this.removeUserPubPvtPostsFeed(id);
      return false;
    }
    if (!(await this.generateUserPubStoriesFeed(id))) {
      this.logger.error('Failed to generateUserPubStoriesFeed');
      await this.removeUserPubStoriesFeed(id);
      return false;
    }
    if (!(await this.generateUserPubPvtStoriesFeed(id))) {
      this.logger.error('Failed to generateUserPubPvtStoriesFeed');
      await this.removeUserPubPvtStoriesFeed(id);
      return false;
    }
    return true;
  }

  private async removeAllPostRelatedFeeds(id: string) {
    return (
      (await this.removePersonalizedFeed(id)) &&
      (await this.removeRelevantPostsFeed(id)) &&
      (await this.removeICYMPostsFeed(id)) &&
      (await this.removeRemainingPostsFeed(id)) &&
      (await this.removePersonalizedFollowingFeed(id)) &&
      (await this.removeRelevantFollowingPostsFeed(id)) &&
      (await this.removeICYMFollowingPostsFeed(id)) &&
      (await this.removeRemainingFollowingPostsFeed(id)) &&
      (await this.removeUserPubPostsFeed(id)) &&
      (await this.removeUserPubPvtPostsFeed(id)) &&
      (await this.removeUserPubStoriesFeed(id)) &&
      (await this.removeUserPubPvtStoriesFeed(id)) &&
      (await this.removeConsumedPostsFeed(id))
    );
  }

  //Interests Feed
  async generateInterestsFeed(userId: string): Promise<boolean> {
    this.logger.debug('generating interests feed');
    if (!(await this.generateFeeds(userId, UserInterestsFeedEnums))) {
      await this.removeInterestsFeeds(userId);
      return false;
    }
    this.logger.debug('generated interests feed');
    return true;
  }

  private async removeInterestsFeeds(userId: string): Promise<boolean> {
    return await this.removeFeeds(userId, UserInterestsFeedEnums);
  }

  async generateInterestedAccountsFeed(userId: string): Promise<boolean> {
    this.logger.info('generating interested accounts feed');
    if (!(await this.generateFeeds(userId, InterestedAccountsFeedEnums))) {
      await this.removeInterestedAccountsFeeds(userId);
      return false;
    }
    this.logger.info('generated interested accounts feed');
    return true;
  }

  private async removeInterestedAccountsFeeds(
    userId: string
  ): Promise<boolean> {
    return await this.removeFeeds(userId, InterestedAccountsFeedEnums);
  }

  // Remove All Feeds
  private async removeAllFeedsRelatedToUser(userId: string) {
    await this.removeAllPostRelatedFeeds(userId);
    await this.removeInterestsFeeds(userId);
    await this.removeInterestedAccountsFeeds(userId);
  }

  public async index(user: UserEntity) {
    return await this.esIndexService.indexUser(
      user.id,
      user.handle,
      user.name,
      user.avatarImage ?? ''
    );
  }

  //Add Feed and Save User
  private async addFeedAndSaveUser({
    user,
    categoryIds,
    inviteCode,
    linkData,
  }: {
    user: UserEntity;
    categoryIds?: string[];
    inviteCode?: number;
    linkData?: LinkData | null;
  }): Promise<UserEntity | undefined> {
    const context = {
      methodName: UserService.prototype.addFeedAndSaveUser.name,
      user,
      categoryIds,
      inviteCode,
      linkData,
    };
    this.logger.debug('creating user feeds', context);
    const preSaveTasks: Promise<boolean>[] = [
      this.createActivityStreamAndAddToUser({ user }),
      this.createRelatedFeedsAndAddToUser({ user }),
      this.generateAllPostRelatedFeeds(user.id),
      this.generateInterestsFeed(user.id),
      this.generateInterestedAccountsFeed(user.id),
    ];
    const results = await Promise.all(preSaveTasks);
    if (results.some(result => !result)) {
      this.logger.error('failed to generate feeds', { results });
      return;
    }
    if (linkData) {
      const otherParams = Array.isArray(linkData.otherParams)
        ? linkData.otherParams
        : [];
      user.addLinkData({
        ...linkData,
        otherParams,
      });
    }
    if (categoryIds?.length) {
      user.didFinishOnboarding = true;
    }
    this.logger.debug('saving user', context);
    await this.repo.save(user);
    const postSaveTasks: Promise<any>[] = [];
    if (linkData) {
      this.logger.debug('handling user link data', context);
      postSaveTasks.push(
        this.inviteListRecordingProducer.createInviteListRecordingJob({
          referrerId: linkData.refererId,
          inviteeId: user.id,
        })
      );
    }
    if (categoryIds?.length) {
      this.logger.debug('adding user categories interests', context);
      postSaveTasks.push(this.updateCategoryInterests(user.id, categoryIds));
    }
    postSaveTasks.push(
      this.createInnerCirclesList(user.id),
      this.createAndFillInnerCirclesSuggestionList(user),
      this.createUserPropertyMap(user.id),
      this.prepareInitialFeed(user.id)
    );
    if (inviteCode) {
      postSaveTasks.push(this.redeemInviteCode({ user, inviteCode }));
    }
    await Promise.all(postSaveTasks);
    return user;
  }

  private async createActivityStreamAndAddToUser({
    user,
  }: {
    user: UserEntity;
  }): Promise<boolean> {
    const activityStream = await this.activityStreamService.create(user.id);
    user.activityStreamId = activityStream.id;
    return true;
  }

  private async createRelatedFeedsAndAddToUser({
    user,
  }: {
    user: UserEntity;
  }): Promise<boolean> {
    const [
      followingFeed,
      followerFeed,
      likeReactionOnPostsFeed,
      reportCommentFeed,
      reportReplyFeed,
      reportPostFeed,
      followingUsersAllPostsFeed,
      followingUsersTextPostsFeed,
      followingUsersImagePostsFeed,
      followingUsersVideoPostsFeed,
      followingUsersMultiMediaPostsFeed,
    ] = await this.feedService.createAll(
      [
        FeedEntityType.FOLLOWING,
        FeedEntityType.FOLLOWER,
        FeedEntityType.LIKE_REACTIONS_ON_POST,
        FeedEntityType.REPORT_COMMENTS,
        FeedEntityType.REPORT_REPLIES,
        FeedEntityType.REPORT_POSTS,
        FeedEntityType.FOLLOWING_USERS_ALL_POSTS,
        FeedEntityType.FOLLOWING_USERS_TEXT_POSTS,
        FeedEntityType.FOLLOWING_USERS_IMAGE_POSTS,
        FeedEntityType.FOLLOWING_USERS_VIDEO_POSTS,
        FeedEntityType.FOLLOWING_USERS_COLLAGE_POSTS,
      ],
      user.id
    );
    user.followingFeedId = followingFeed.id;
    user.followerFeedId = followerFeed.id;
    user.likeReactionOnPostFeedId = likeReactionOnPostsFeed.id;
    user.reportCommentFeedId = reportCommentFeed.id;
    user.reportReplyFeedId = reportReplyFeed.id;
    user.reportPostFeedId = reportPostFeed.id;
    user.followingUsersAllPostsFeedId = followingUsersAllPostsFeed.id;
    user.followingUsersTextPostsFeedId = followingUsersTextPostsFeed.id;
    user.followingUsersImagePostsFeedId = followingUsersImagePostsFeed.id;
    user.followingUsersVideoPostsFeedId = followingUsersVideoPostsFeed.id;
    user.followingUsersMultiMediaPostsFeedId =
      followingUsersMultiMediaPostsFeed.id;
    return true;
  }

  private async redeemInviteCode({
    user,
    inviteCode,
  }: {
    user: UserEntity;
    inviteCode: number;
  }): Promise<void> {
    const context = {
      methodName: UserService.prototype.redeemInviteCode.name,
      userId: user.id,
      inviteCode,
    };
    this.logger.debug('handling invite code', context);
    const inviteCodeEntity = await this.inviteCodeService.redeemInviteCode(
      user.id,
      inviteCode
    );
    if (inviteCodeEntity) {
      this.logger.info('updated invite code', context);
      user.redeemedInviteCodeId = inviteCodeEntity.id;
      await this.repo.update(user.id, {
        redeemedInviteCodeId: user.redeemedInviteCodeId,
      });
      if (inviteCodeEntity.action === InviteCodeAction.ADD_TO_INNER_LIST) {
        this.logger.info('adding new user to inner circle', context);
        if (inviteCodeEntity.inviterId) {
          const ownerId = inviteCodeEntity.inviterId.trim();
          const addedUserId = user.id;
          await this.followUser(ownerId, addedUserId);
          await this.addMemberToInnerCircle(ownerId, addedUserId, true);
        }
      }
    }
  }

  private async pushToFeed(feed: FeedEntity, ids: string[]) {
    for (const id of ids) {
      if (!feed.page.ids.includes(id)) feed.page.ids.push(id);
    }
    await this.feedService.save([feed]);
  }

  private async removeFromFeed(feed: FeedEntity, ids: string[]) {
    feed.page.ids = feed.page.ids.filter(
      existingCategoryId => !ids.includes(existingCategoryId)
    );
    await this.feedService.save([feed]);
  }

  // --------------------------- CategoryInterests
  async getCategoryInterestsMap(
    userId: string
  ): Promise<Map<string, number> | undefined> {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_CATEGORY_INTERESTS, userId)
    );
    if (!feed) return;
    if (!feed.page.idsWithScore) return;
    return kvpToMap(feed.page.idsWithScore.idsMap);
  }

  async getCategoryInterestIds(userId: string): Promise<string[]> {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_CATEGORY_INTERESTS, userId)
    );
    if (!feed) return [];
    return Object.keys(feed.page.idsWithScore.idsMap);
  }

  async addToCategoryInterests(userId: string, ids: string[]) {
    let feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_CATEGORY_INTERESTS, userId)
    );
    if (!feed) {
      feed = await this.feedService.create(
        FeedEntityType.USER_CATEGORY_INTERESTS,
        userId
      );
    }
    await this.pushToFeed(feed, ids);
  }

  async removeFromCategoryInterests(userId: string, ids: string[]) {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_CATEGORY_INTERESTS, userId)
    );
    if (!feed) {
      this.logger.error('No USER_CATEGORIES_INTERESTS found for user', {
        userId,
      });
      return;
    }
    await this.removeFromFeed(feed, ids);
  }

  //-------------------- PredictedCategoryInterests
  async getPredictedCategoryInterests(userId: string): Promise<string[]> {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_PREDICTED_CATEGORY_INTERESTS, userId)
    );
    if (!feed) {
      return [];
    }
    return feed.page.ids;
  }

  async addToPredictedCategoryInterests(userId: string, ids: string[]) {
    let feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_PREDICTED_CATEGORY_INTERESTS, userId)
    );
    if (!feed) {
      feed = await this.feedService.create(
        FeedEntityType.USER_PREDICTED_CATEGORY_INTERESTS,
        userId
      );
    }
    await this.pushToFeed(feed, ids);
  }

  async removeFromPredictedCategoryInterests(userId: string, ids: string[]) {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_PREDICTED_CATEGORY_INTERESTS, userId)
    );
    if (!feed) {
      this.logger.error(
        'No USER_PREDICTED_CATEGORIES_INTERESTS found for user',
        { userId }
      );
      return;
    }
    await this.removeFromFeed(feed, ids);
  }

  // -------------------- PostTypesList
  async getPostTypeInterestsMap(
    userId: string
  ): Promise<Map<string, number> | undefined> {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_POST_TYPE_INTERESTS, userId)
    );
    if (!feed) return;
    if (!feed.page.idsWithScore) return;
    return kvpToMap(feed.page.idsWithScore.idsMap);
  }

  async addToPostTypeInterests(userId: string, ids: string[]) {
    let feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_POST_TYPE_INTERESTS, userId)
    );
    if (!feed) {
      feed = await this.feedService.create(
        FeedEntityType.USER_POST_TYPE_INTERESTS,
        userId
      );
    }
    await this.pushToFeed(feed, ids);
  }

  async removeFromPostTypeInterests(userId: string, ids: string[]) {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_POST_TYPE_INTERESTS, userId)
    );
    if (!feed) {
      this.logger.error('No USER_POST_TYPE_INTERESTS found for user', {
        userId,
      });
      return;
    }
    await this.removeFromFeed(feed, ids);
  }

  // --------------- PredictedPostTypesList
  async getPredictedPostTypesList(userId: string): Promise<string[]> {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_PREDICTED_POST_TYPE_INTERESTS, userId)
    );
    if (!feed) {
      return [];
    }
    return feed.page.ids;
  }

  async addToPredictedPostTypeInterests(userId: string, ids: string[]) {
    let feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_PREDICTED_POST_TYPE_INTERESTS, userId)
    );
    if (!feed) {
      feed = await this.feedService.create(
        FeedEntityType.USER_PREDICTED_POST_TYPE_INTERESTS,
        userId
      );
    }
    await this.pushToFeed(feed, ids);
  }

  async removeFromPredictedPostTypeInterests(userId: string, ids: string[]) {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_PREDICTED_POST_TYPE_INTERESTS, userId)
    );
    if (!feed) {
      this.logger.error(
        'No USER_PREDICTED_POST_TYPE_INTERESTS found for user',
        { userId }
      );
      return;
    }
    await this.removeFromFeed(feed, ids);
  }

  //------------ View Count
  async updatePostTypeViewCount(userId: string, postTypes: number[]) {
    try {
      const feed = await this.feedService.findOrCreate(
        FeedEntityType.USER_POST_TYPE_VIEWS,
        userId
      );
      if (!feed.page.idsWithScore) {
        feed.page.idsWithScore = {
          idsMap: {},
        };
      }
      const map = kvpToMap(feed.page.idsWithScore.idsMap);
      for (const postType of postTypes) {
        const postTypeId = `${postType}`;
        let count = map.get(postTypeId);
        if (count) {
          count += 1;
        } else {
          count = 1;
        }
        map.set(postTypeId, count);
      }
      feed.page.idsWithScore.idsMap = mapToKVP(map);
      this.feedService.save([feed]);
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  async updatePostCategoryViewCount(userId: string, categoryIds: string[]) {
    try {
      const feed = await this.feedService.findOrCreate(
        FeedEntityType.USER_CATEGORY_VIEWS,
        userId
      );
      if (!feed.page.idsWithScore) {
        feed.page.idsWithScore = {
          idsMap: {},
        };
      }
      const map = kvpToMap(feed.page.idsWithScore.idsMap);
      for (const categoryId of categoryIds) {
        let count = map.get(categoryId);
        if (count) {
          count += 1;
        } else {
          count = 1;
        }
        map.set(categoryId, count);
      }
      feed.page.idsWithScore.idsMap = mapToKVP(map);
      this.feedService.save([feed]);
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  //------------ Interactions
  /**
   * Interactions include
   *  - Reply to comment
   *  - Comment on post
   *  - React on post
   *
   *  When the interactionCount is > 100, increment CategoryInterestsScore
   */
  async updatePostTypeInteractionCount(
    userId: string,
    postTypes: number[]
  ): Promise<boolean> {
    try {
      const feed = await this.feedService.findOrCreate(
        FeedEntityType.USER_POST_TYPE_INTERACTION,
        userId
      );
      if (!feed.page.idsWithScore) {
        feed.page.idsWithScore = {
          idsMap: {},
        };
      }
      for (const postType of postTypes) {
        const postTypeId = `${postType}`;
        const map = kvpToMap(feed.page.idsWithScore.idsMap);
        let interactionCount = map.get(postTypeId);
        if (interactionCount) {
          interactionCount += 1;
        } else {
          interactionCount = 1;
        }
        if (
          interactionCount > Number(process.env.INTERACTIONS_COUNT ?? '100')
        ) {
          await this.updatePostTypeInterestScore(userId, postTypeId);
          //Reset the interaction score score
          interactionCount = 0;
        }
        map.set(postTypeId, interactionCount);
        feed.page.idsWithScore.idsMap = mapToKVP(map);
        await this.feedService.save([feed]);
      }
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  /**
   * Interactions include
   *  - Reply to comment
   *  - Comment on post
   *  - React on post
   *
   *  When the interactionCount is > 100, increment CategoryInterestsScore
   */
  async updateCategoryInteractionCount(
    userId: string,
    categoryIds: string[]
  ): Promise<boolean> {
    try {
      const feed = await this.feedService.findOrCreate(
        FeedEntityType.USER_CATEGORY_INTERACTION,
        userId
      );
      if (!feed.page.idsWithScore) {
        feed.page.idsWithScore = {
          idsMap: {},
        };
      }
      const map = kvpToMap(feed.page.idsWithScore.idsMap);
      for (const categoryId of categoryIds) {
        let interactionCount = map.get(categoryId);
        if (interactionCount) {
          interactionCount += 1;
        } else {
          interactionCount = 1;
        }
        if (
          interactionCount > Number(process.env.INTERACTIONS_COUNT ?? '100')
        ) {
          await this.updateCategoryInterestScore(userId, categoryId);
          //Reset the interaction score
          interactionCount = 0;
        }
        map.set(categoryId, interactionCount);
        feed.page.idsWithScore.idsMap = mapToKVP(map);
        await this.feedService.save([feed]);
      }
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  /**
   * Interactions include
   *  - Reply to comment
   *  - Comment on post
   *  - React on post
   *
   *  When the interactionCount is > 100, add the userId to favorites
   */
  async updateUserInteractionsCount(
    userId: string,
    withUserId: string
  ): Promise<boolean> {
    this.logger.info('updateUserInteractionsCount()');
    try {
      const favoriteAccountsFeed = await this.feedService.find(
        toFeedId(FeedEntityType.USER_FAVORITE_USERS, userId)
      );
      if (favoriteAccountsFeed) {
        if (favoriteAccountsFeed.page.ids.includes(withUserId)) {
          this.logger.info('Already a favorite');
          return true;
        }
      }
      const feed = await this.feedService.findOrCreate(
        FeedEntityType.USER_INTERACTIONS_SCORE,
        userId
      );
      if (!feed.page.idsWithScore) {
        this.logger.info('Instantiating!!');
        feed.page.idsWithScore = {
          idsMap: {},
        };
      }
      const map = kvpToMap(feed.page.idsWithScore.idsMap);
      let interactionCount = map.get(withUserId);
      if (interactionCount) {
        interactionCount += 1;
      } else {
        interactionCount = 1;
      }
      this.logger.info('interactionCount', { interactionCount });
      if (interactionCount > Number(process.env.INTERACTIONS_COUNT ?? '100')) {
        await this.addToFavoriteAccounts(
          userId,
          [withUserId],
          favoriteAccountsFeed
        );
        //Reset score
        interactionCount = 0;
      }
      map.set(withUserId, interactionCount);
      feed.page.idsWithScore.idsMap = mapToKVP(map);
      await this.feedService.save([feed]);
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  // --------------- FavoriteAccountsList
  async addToFavoriteAccounts(
    userId: string,
    ids: string[],
    favoritesFeed?: FeedEntity
  ) {
    this.logger.info('addToFavoriteAccounts()', { userId, ids });
    const feed =
      favoritesFeed ??
      (await this.feedService.findOrCreate(
        FeedEntityType.USER_FAVORITE_USERS,
        userId
      ));

    await this.pushToFeed(feed, ids);
  }

  async getFavoriteAccountsList(userId: string): Promise<string[]> {
    const feed = await this.feedService.findOrCreate(
      FeedEntityType.USER_FAVORITE_USERS,
      userId
    );
    return feed.page.ids;
  }

  async removeFromFavoriteAccounts(userId: string, ids: string[]) {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_FAVORITE_USERS, userId)
    );
    if (!feed) {
      this.logger.error('No USER_FAVORITE_USERS found for user', { userId });
      return;
    }
    await this.removeFromFeed(feed, ids);
  }

  // ------------ FriendsAndFamilyAccountsList
  /***
   * 1. When someone invites you
   * 2. When you both follow each other
   */
  async addToFriendsAndFamilyAccounts(userId: string, ids: string[]) {
    let feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_FRIENDS_AND_FAMILY_USERS, userId)
    );
    if (!feed) {
      feed = await this.feedService.create(
        FeedEntityType.USER_FRIENDS_AND_FAMILY_USERS,
        userId
      );
    }
    await this.pushToFeed(feed, ids);
  }

  async getFriendsAndFamilyAccountsList(userId: string): Promise<string[]> {
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_FRIENDS_AND_FAMILY_USERS, userId)
    );
    if (!feed) {
      return [];
    }
    return feed.page.ids;
  }

  async removeFromFriendsAndFamilyAccounts(userId: string, ids: string[]) {
    this.logger.info('removeFromFriendsAndFamilyAccounts', { userId, ids });
    const feed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_FRIENDS_AND_FAMILY_USERS, userId)
    );
    if (!feed) {
      this.logger.error('No USER_FRIENDS_AND_FAMILY_USERS found for user', {
        userId,
      });
      return;
    }
    await this.removeFromFeed(feed, ids);
  }

  //#######################
  //endregion

  toGenderIndex(gender?: Gender): number {
    switch (gender) {
      case Gender.FEMALE:
        return 1;
      case Gender.MALE:
        return 2;
      case Gender.NOT_SPECIFIED:
        return 3;
      case Gender.OTHER:
        return 4;
      default:
        return 3;
    }
  }

  toURL(url: string): Promise<URL> {
    return toUrl(
      url,
      this.logger,
      this.s3UrlPreSigner,
      this.cdnPvtS3UrlPreSigner
    );
    // return this.s3UrlPreSigner.presign(url).then((u) => new URL(u));
  }

  public toUserObject(params: ToUserObjParams): GqlUser {
    const defaultSD: UserStrikeData = {
      isSuspended: false,
      currentStrikeCount: 0,
      firstStrikeCount: 0,
      secondStrikeCount: 0,
      thirdStrikeCount: 0,
      permanentSuspensionCount: 0,
    };
    const userEntity = params.user;
    const hasBlocked = params.hasBlocked ?? false;
    const isAvailable = params.isAvailable ?? true;
    if (!isAvailable) {
      return {
        __typename: 'User',
        id: userEntity.id,
        handle: '--',
        name: 'user-not-found',
        bio: '',
        pronoun: '',
        avatarImage: {
          __typename: 'MediaSource',
          uri: undefined,
        },
        isSuspended: userEntity.isSuspended,
        score: 0,
        strikeData: {
          score: 1,
          isFaded: defaultSD.isSuspended,
          // currentStrikeCount: userSD.currentStrikeCount
        },
        realIdFace: {
          __typename: 'MediaSource',
          uri: undefined,
        },
        realIdVerificationStatus: undefined,
      };
    }
    if (params.isCurrentUserRequestingTheirDetails) {
      const userSD: UserStrikeData = params.hasBlocked
        ? defaultSD
        : userEntity.strikeData ?? defaultSD;
      const strikeData: GqlUserStrikeData = {
        score: userEntity.score,
        isFaded: userSD.isSuspended,
        currentStrikeCount: userSD.currentStrikeCount,
        firstStrikeCount: userSD.firstStrikeCount,
        firstStrikeExpiryTS: userSD.firstStrikeExpiryTS,
        firstStrikeTS: userSD.firstStrikeTS,
        secondStrikeCount: userSD.secondStrikeCount,
        secondStrikeExpiryTS: userSD.secondStrikeExpiryTS,
        secondStrikeTS: userSD.secondStrikeTS,
        thirdStrikeCount: userSD.thirdStrikeCount,
        thirdStrikeExpiryTS: userSD.thirdStrikeExpiryTS,
        thirdStrikeTS: userSD.thirdStrikeTS,
        permanentSuspensionCount: userSD.permanentSuspensionCount,
        finalStrikeTimeStamps: userSD.finalStrikeTimeStamps,
      };
      const result: GqlUser = {
        __typename: 'User',
        id: userEntity.id,
        handle: userEntity.handle,
        name: userEntity.name,
        email: userEntity.email,
        phoneNumber: userEntity.phoneNumber,
        commentEnabledAt: userEntity.commentEnabledAt,
        commentOnboardedAt: userEntity.commentOnboardedAt,
        userCreatedAt: userEntity.createdAt,
        bio: userEntity.bio,
        pronoun: userEntity.pronoun,
        avatarImage: {
          __typename: 'MediaSource',
          uri: userEntity.avatarImage
            ? this.toURL(userEntity.avatarImage ?? '')
            : undefined,
        },
        realIdFace: {
          __typename: 'MediaSource',
          uri: userEntity.realIdFaceUrl
            ? this.toURL(userEntity.realIdFaceUrl ?? '')
            : undefined,
        },
        realIdVerificationStatus: userEntity.realIdVerificationStatus
          ? toRealIdVerificationStatus(userEntity.realIdVerificationStatus)
          : undefined,
        ts: {
          __typename: 'Timestamps',
          createdAt: userEntity.createdAt,
          updatedAt: userEntity.updatedAt,
        },
        gender: toGenderValue(userEntity.gender),
        strikeData,
        isSuspended: userEntity.isSuspended,
        score: userEntity.score,
        embargoExpirationDaysDelta: this.embargoDelta(userEntity),
        remainingInvitesCount: userEntity.inviteCount,
        visibilityPreferences: toGqlVisibilityPreferences(userEntity),
      };
      result.isAvailable = isAvailable;
      result.stats = userEntity.getComputedStats();
      return result;
    } else {
      const userSD: UserStrikeData = hasBlocked
        ? defaultSD
        : userEntity.strikeData ?? defaultSD;
      const strikeData: GqlUserStrikeData = {
        score: userEntity.score,
        isFaded: userSD.isSuspended,
        // currentStrikeCount: userSD.currentStrikeCount
      };
      const result: GqlUser = {
        __typename: 'User',
        id: userEntity.id,
        handle: userEntity.handle,
        name: userEntity.name,
        bio: userEntity.bio,
        pronoun: userEntity.pronoun,
        avatarImage: {
          __typename: 'MediaSource',
          uri: userEntity.avatarImage
            ? this.toURL(userEntity.avatarImage ?? '')
            : undefined,
        },
        strikeData,
        isSuspended: userEntity.isSuspended,
        score: userEntity.score,
        realIdFace: {
          __typename: 'MediaSource',
          uri: userEntity.realIdFaceUrl
            ? this.toURL(userEntity.realIdFaceUrl ?? '')
            : undefined,
        },
        realIdVerificationStatus: userEntity.realIdVerificationStatus
          ? toRealIdVerificationStatus(userEntity.realIdVerificationStatus)
          : undefined,
        visibilityPreferences: toGqlVisibilityPreferences(userEntity),
      };
      if (userEntity.visibilityPreferences?.list) {
        result.stats = {
          followerCount:
            userEntity.visibilityPreferences?.list.follower ===
            UserListVisibility.NONE
              ? 0
              : userEntity.getStats().followerCount,
          followingCount:
            userEntity.visibilityPreferences?.list.following ===
            UserListVisibility.NONE
              ? 0
              : userEntity.getStats().followingCount,
          postCount: userEntity.getStats().postCount ?? 0,
          innerCircleCount:
            userEntity.visibilityPreferences?.list.following ===
            UserListVisibility.NONE
              ? 0
              : userEntity.getStats().innerCircleCount ?? 0,
          createdChallengesCount:
            userEntity.getComputedStats().createdChallengesCount,
          joinedChallengesCount:
            userEntity.getComputedStats().joinedChallengesCount,
        };
      } else {
        result.stats = userEntity.getComputedStats();
      }
      if (hasBlocked || !isAvailable) {
        result.hasBlocked = true;
        result.stats = {
          followerCount: 0,
          followingCount: 0,
          postCount: 0,
          innerCircleCount: 0,
          createdChallengesCount: 0,
          joinedChallengesCount: 0,
        };
        return result;
      }
      result.isAvailable = isAvailable;

      return result;
    }
  }

  embargoDelta(user: UserEntity): number | undefined {
    if (!user.commentEnabledAt) {
      const today = new Date();
      const oneDay = 1000 * 60 * 60 * 24;
      const expirationDate = new Date(
        user.createdAt.getTime() + oneDay * NUMBER_OF_COMMENT_EMBARGO_DAYS
      );
      return Math.ceil((expirationDate.valueOf() - today.valueOf()) / oneDay);
    }
    return undefined;
  }

  async getUserContext(
    currentUser: UserEntity,
    userId: string
  ): Promise<UserContext> {
    const user = await this.repo.findOne(currentUser.id, {
      relations: [UserEntity.kFollowingFeedRelation],
    });
    return {
      __typename: 'UserContext',
      followingUser: user?.followingFeed?.hasEntry(userId) ?? false,
    };
  }

  async getPostContext(
    currentUser: UserEntity,
    postId: string
  ): Promise<PostContext> {
    const user = await this.repo.findOne(currentUser.id, {
      relations: [
        UserEntity.kLikeReactionFeed,
        UserEntity.kRealReactionFeed,
        UserEntity.kApplaudReactionFeed,
      ],
    });
    return {
      __typename: 'PostContext',
      liked: user?.likeReactionOnPostFeed?.hasEntry(postId) ?? false,
      realed: user?.realReactionOnPostFeed?.hasEntry(postId) ?? false,
      applauded: user?.applaudReactionOnPostFeed?.hasEntry(postId) ?? false,
    };
  }

  async getPostCommentContext(
    currentUser: UserEntity,
    commentId: string
  ): Promise<PostCommentContext> {
    // const withRelations = await this.repo.findOne(currentUser.id, {
    //   relations: [UserEntity.kLikeCommentFeedRelation],
    // });
    return {
      __typename: 'PostCommentContext',
      liked: /* withRelations?.likeCommentFeed?.hasEntry(commentId) ?? */ false,
    };
  }

  async getCommentReplyContext(
    currentUser: UserEntity,
    replyId: string
    // this.logger.debug('getCommentReplyContext', { currentUser, replyId });
    // const withRelations = await this.repo.findOne(currentUser.id, {
    //   relations: [UserEntity.kLikeReplyFeedRelation],
    // });
  ): Promise<CommentReplyContext> {
    return {
      __typename: 'CommentReplyContext',
      liked: /* withRelations?.likeReplyFeed?.hasEntry(replyId) ??  */ false,
    };
  }

  async createUser({
    input,
    idToken,
  }: {
    input: SignUpWithEmailInput | SignUpWithPhoneNumberInput;
    idToken: DecodedIdToken;
  }): Promise<UserEntity | undefined> {
    const user = new UserEntity();
    user.firebaseUID = idToken.uid;
    user.phoneNumber = idToken.phone_number;
    user.email = idToken.email;
    user.handle = input.handle;
    user.name = input.name;
    user.fcmToken = input.fcmToken;
    user.inviteCount = 5;
    user.id = generateId();
    user.avatarImage = input?.avatarImage?.uri;
    user.gender = this.toGenderIndex(input?.gender ?? Gender.NOT_SPECIFIED);
    if (isSignupWithEmailAndPasswordInput(input))
      await user.setPassword(input.password);
    const userWithFeeds = await this.addFeedAndSaveUser({
      user,
      inviteCode: input.inviteCode,
      linkData: input.linkData,
    });
    if (!userWithFeeds) {
      await this.removeAllFeedsRelatedToUser(user.id);
    }
    return userWithFeeds;
  }

  async findById(
    id: string,
    options?: FindOneOptions<UserEntity>
  ): Promise<UserEntity | undefined> {
    return await this.repo.findOne(id, options);
  }

  async findAllById(
    ids: string[],
    options?: FindOneOptions<UserEntity>
  ): Promise<UserEntity[]> {
    if (ids.length === 0) return [];
    const result: UserEntity[] = [];
    const users = await this.repo.findByIds(ids, options);
    users.forEach(e => {
      result[ids.indexOf(e.id)] = e;
    });
    return result;
  }

  async findByIds({
    ids,
  }: {
    ids: string[];
  }): Promise<Result<UserEntity[], PostgresQueryFailedException>> {
    const context = {
      methodName: UserService.prototype.findByIds.name,
      ids,
    };
    const userQueryResult = await fromPromise(
      this.repo.findByIds(ids),
      error => new PostgresQueryFailedException({ error, ...context })
    );
    if (userQueryResult.isErr()) {
      this.logger.error('error finding users', {
        error: userQueryResult.error,
        ...context,
      });
      return err(userQueryResult.error);
    }
    const orderedUsers = preserveOrderByIds(ids, userQueryResult.value);
    return ok(orderedUsers);
  }

  findByEmail(email: string): Promise<UserEntity | undefined> {
    return this.repo.findOne({ email: email });
  }

  findByHandle(handle: string): Promise<UserEntity | undefined> {
    return this.repo.findOne({ handle: handle });
  }

  async findByHandles(handles: string[]): Promise<UserEntity[] | undefined> {
    try {
      const temp = await this.repo
        .createQueryBuilder('user_entity')
        .where('user_entity.handle IN (:...handles)', { handles })
        .getRawAndEntities<UserEntity>();
      return temp.entities;
    } catch (error) {
      this.logger.error('Error finding by handles', error);
      return undefined;
    }
  }

  findByFirebaseUid(uid: string): Promise<UserEntity | undefined> {
    return this.repo.findOne({ firebaseUID: uid });
  }

  findByPhoneNumber(phoneNumber: string): Promise<UserEntity | undefined> {
    return this.repo.findOne({ phoneNumber: phoneNumber });
  }

  async getUser(id: string): Promise<GqlUser | undefined> {
    const user = await this.repo.findOne(id);
    if (!user) return undefined;
    return this.toUserObject({ user: user });
  }

  async incrementPostCount(user: UserEntity): Promise<UserEntity> {
    user.incrementPostCount();
    await this.userStatsService.jsonSetStatsInTxn({
      id: user.id,
      statsKey: 'postCount',
      statsValue: user.getStats().postCount,
      userRepo: this.repo,
    });
    return user;
  }

  async followEventGuards(
    currentUserId: string,
    userIdToFollow: string
  ): Promise<
    | {
        currentUser: UserEntity;
        userBeingFollowed: UserEntity;
      }
    | undefined
  > {
    const userBeingFollowed = await this.findById(userIdToFollow);
    if (!userBeingFollowed) {
      this.logger.warn('userBeingFollowed not found', { userIdToFollow });
      return;
    }
    if (!userBeingFollowed?.followerFeedId) {
      this.logger.warn(
        'Could not find followerFeed of user you are trying to follow',
        { userIdToFollow }
      );
      return;
    }
    const hasBeenBlocked = await this.hasBlocked({
      userWhoBlocked: userBeingFollowed,
      userIdToCheck: currentUserId,
    });
    if (hasBeenBlocked) {
      this.logger.warn('A blocked user was able to view this user profile', {
        userIdToFollow,
        blockedUser: currentUserId,
      });
      return;
    }
    const currentUser = await this.findById(currentUserId);
    if (!currentUser) {
      this.logger.warn('Could not find currentUser', { currentUserId });
      return;
    }
    if (!currentUser.followingFeedId) {
      this.logger.warn('followingFeedId not found for the currentUser', {
        currentUserId,
      });
      return undefined;
    }
    return {
      currentUser,
      userBeingFollowed,
    };
  }

  /**
   * @return UserEntity who followed, i.e. current user
   */
  async followUser(
    currentUserId: string,
    userIdToFollow: string,
    shouldNotifyOfAutoAdd = false
  ): Promise<UserEntity | undefined> {
    const result = await this.followEventGuards(currentUserId, userIdToFollow);
    if (!result) {
      this.logger.debug('Follow event guards result is empty');
      return;
    }
    const currentUser = result.currentUser;
    const userBeingFollowed = result.userBeingFollowed;
    const isSuccessful = await this.repo.manager.transaction(async manager => {
      const feedRepo = manager.getRepository(FeedEntity);
      const userRepo = manager.getRepository(UserEntity);
      const [
        currentUserUpdatedFollowingFeedResult,
        userBeingFollowedFollowerFeedResult,
      ] = await Promise.all([
        this.feedService.tryUnshiftEntry(
          currentUser.followingFeedId!,
          userIdToFollow,
          feedRepo
        ),
        this.feedService.tryUnshiftEntry(
          userBeingFollowed.followerFeedId!,
          currentUserId,
          feedRepo
        ),
      ]);
      if (!currentUserUpdatedFollowingFeedResult) {
        throw new Error('currentUserUpdatedFollowingFeedResult is empty');
      }
      if (!userBeingFollowedFollowerFeedResult) {
        throw new Error('userBeingFollowedFollowerFeedResult is empty');
      }
      currentUser.setStats({
        followingCount: currentUserUpdatedFollowingFeedResult.count,
      });
      userBeingFollowed.setStats({
        followerCount: userBeingFollowedFollowerFeedResult.count,
      });
      await Promise.all([
        this.userStatsService.jsonSetStatsInTxn({
          id: currentUserId,
          statsKey: 'followingCount',
          statsValue: currentUser.getStats().followingCount,
          userRepo,
        }),
        this.userStatsService.jsonSetStatsInTxn({
          id: userIdToFollow,
          statsKey: 'followerCount',
          statsValue: userBeingFollowed.getStats().followerCount,
          userRepo,
        }),
      ]);
      return true;
    });
    if (!isSuccessful) {
      this.logger.warn('Failed to follow user', {
        currentUserId,
        userIdToFollow,
      });
      return;
    }
    try {
      await this.followUserFillUp({ userIdToFollow, currentUserId });
    } catch (e) {
      this.logger.warn(
        'failed to perform followEventFillup tasks on main-server, now spawning worker',
        {
          currentUserId,
          userIdToFollow,
        }
      );
      await this.followEventFillUpWorker.fillUp({
        currentUserId,
        userIdToFollow,
      });
    }
    await this.notifyAuthorWorker.followedEventJob({
      followedUserId: userBeingFollowed.id,
      subjectId: currentUser.id,
    });
    if (shouldNotifyOfAutoAdd) {
      this.logger.info('[addMemberToFollowing] notifying auto add', {});
      await this.notifyAuthorWorker.userAutoAddedToFollowing({
        ownerId: currentUserId,
        addedUserId: userIdToFollow,
      });
    }
    [currentUser.id, userBeingFollowed.id].map(id => this.requestReIndex(id));
    return currentUser;
  }

  async followUserFillUp(job: FollowEventFillUpJob) {
    await this.userPropertyMapService.followedEvent(
      job.currentUserId,
      job.userIdToFollow
    );
    await this.scoreDataWorker.updateUserScoreData({
      userId: job.userIdToFollow,
      action: UserScoreDataRelatedActionEnum.FOLLOWER_GAINED,
    });
    this.logger.info('adding their posts');
    await this.addOrRemovePostsFromFeedWorker.addTheirPostsToYourFeed({
      whosePosts: job.userIdToFollow,
      whoseFeed: job.currentUserId,
    });
    await this.addToSuggestionsList(job.currentUserId, job.userIdToFollow);
  }

  async removeFollower(
    currentUser: UserEntity,
    userIdToRemove: string
  ): Promise<UserEntity | undefined> {
    const userToRemove = await this.repo.findOne(userIdToRemove);
    if (!userToRemove?.followingFeedId) return undefined;
    await this.unfollowUser(userToRemove, currentUser.id);
    [currentUser.id, userToRemove.id].map(id => this.requestReIndex(id));
    const user = await this.findById(currentUser.id);
    if (user) {
      this.logger.info('Returning updated user', {});
      return user;
    }
    currentUser.decrementFollowingCount();
    return currentUser;
  }

  async addToSuggestionsList(
    ownerId: string,
    entryToAdd: string,
    feedEntityRepository?: Repository<FeedEntity>
  ) {
    this.logger.info('addToSuggestionsList', {});
    await this.feedService.tryAndPushEntry(
      toFeedId(FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST, ownerId),
      entryToAdd,
      !!feedEntityRepository
        ? {
            repo: feedEntityRepository,
            inTxt: false,
          }
        : undefined
    );
  }

  async addMemberToInnerCircle(
    ownerOrId: string | UserEntity,
    entryToAdd: string,
    shouldNotifyOfAutoAdd = false,
    shouldSendNotificationToAddedUser = true
  ): Promise<AddMemberToICResponse | undefined> {
    this.logger.info('addMemberToInnerCircle()', {});
    const owner =
      typeof ownerOrId === 'string'
        ? await this.findById(ownerOrId)
        : ownerOrId;
    if (!owner) {
      this.logger.error('Owner not found');
      return;
    }
    const updatedInnerCircle =
      await this.userListService.addMemberToInnerCircle(
        owner.id,
        entryToAdd,
        shouldSendNotificationToAddedUser
      );
    if (!updatedInnerCircle) {
      this.logger.error(
        '[addMemberToInnerCircle] NOT updatedInnerCircle ...',
        {}
      );
      return;
    }
    this.logger.info(
      '[addMemberToInnerCircle] removing form suggestions list',
      {}
    );
    if (updatedInnerCircle.didAddEntry) {
      this.logger.info('Did add entry');
      const innerCircleEntity: UserListEntity =
        updatedInnerCircle.entity as UserListEntity;
      if (innerCircleEntity.metaData) {
        this.logger.info('member count found!');
        owner.setStats({
          innerCircleCount: innerCircleEntity.metaData.memberCount,
        });
      } else {
        this.logger.warn('member count NOT found!');
        owner.incrementInnerCircleCount();
      }
      await this.userStatsService.jsonSetStatsInTxn({
        id: owner.id,
        statsKey: 'innerCircleCount',
        statsValue: owner.getStats().innerCircleCount,
        userRepo: this.repo,
      });
    }
    await this.removeFromSuggestionsList(owner.id, entryToAdd);
    if (shouldNotifyOfAutoAdd) {
      this.logger.error('[addMemberToInnerCircle] notifying auto add', {});
      if (updatedInnerCircle.didAddEntry) {
        await this.notifyAddedToICProducer.userAutoAddedToIC({
          ownerId: owner.id,
          addedUserId: entryToAdd,
        });
      }
    }
    return {
      owner,
      innerCircle: updatedInnerCircle.entity as UserListEntity,
      didAddEntry: updatedInnerCircle.didAddEntry,
    };
  }

  /**
   * Also updates the count
   */
  async removeMemberFromInnerCircle({
    owner,
    ownerId,
    entryToRemove,
    isUnfollowing,
    entityManager,
  }: {
    owner?: UserEntity;
    ownerId?: string;
    entryToRemove: string;
    isUnfollowing?: boolean;
    entityManager?: EntityManager;
  }): Promise<[UserEntity, UserListEntity] | undefined> {
    this.logger.info('removeMemberFromInnerCircle', {});
    owner ??= await this.findById(ownerId ?? '');
    if (!owner) {
      this.logger.error('Owner not found');
      return;
    }
    const innerCircleEntity =
      await this.userListService.removeMemberFromInnerCircle(
        owner.id,
        entryToRemove,
        entityManager?.getRepository(UserListEntity)
      );
    if (!innerCircleEntity) {
      this.logger.error('Failed to update inner circle');
      return;
    }
    if (innerCircleEntity.metaData) {
      this.logger.info('member count found!', {
        count: innerCircleEntity.metaData.memberCount,
      });
      owner.getStats().innerCircleCount =
        innerCircleEntity.metaData.memberCount;
    } else {
      this.logger.warn('member count NOT found!');
      owner.decrementInnerCircleCount();
    }
    if (entityManager) {
      await entityManager
        .getRepository(UserEntity)
        .update(owner.id, { _stats: owner.getStats() });
    } else {
      await this.update(owner.id, { _stats: owner.getStats() });
    }
    if (!isUnfollowing) {
      await this.addToSuggestionsList(
        owner.id,
        entryToRemove,
        entityManager?.getRepository(FeedEntity)
      );
    }
    return [owner, innerCircleEntity];
  }

  async removeFromSuggestionsList(
    ownerId: string,
    entryToRemove: string,
    repo?: Repository<FeedEntity>
  ) {
    this.logger.info('removeFromSuggestionsList', {});
    await this.feedService.removeEntry(
      toFeedId(FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST, ownerId),
      entryToRemove,
      !!repo ? { repo, inTxt: false } : undefined
    );
  }

  async unfollowEventCleanup(job: UnfollowEventCleanupJob) {
    this.logger.info('[unfollowEventCleanup] called', { job });
    const unfollowedUserId = job.unfollowedUserId;
    const ownerId = job.ownerId;
    await Promise.all([
      this.removeMemberFromInnerCircle({
        ownerId,
        entryToRemove: unfollowedUserId,
        isUnfollowing: true,
      }),
      this.removeFromSuggestionsList(ownerId, unfollowedUserId),
      this.userPropertyMapService.unfollowEvent(unfollowedUserId, ownerId),
      this.removePostsFromFollowingsFeed(ownerId, unfollowedUserId),
      this.scoreDataWorker.updateUserScoreData({
        userId: unfollowedUserId,
        action: UserScoreDataRelatedActionEnum.FOLLOWER_LOST,
      }),
    ]);
  }

  async unfollowEventRelatedItemsCleanupViaWorker(
    args: UnfollowEventCleanupJob
  ) {
    this.logger.info('unfollowEventRelatedItemsCleanupViaWorker');
    await this.unfollowEventCleanupWorker.cleanup(args);
  }

  private async unfollowUserWithoutTransaction({
    manager,
    currentUser,
    unfollowedUser,
  }: {
    manager: EntityManager;
    currentUser: UserEntity;
    unfollowedUser: UserEntity;
  }): Promise<UserEntity> {
    const feedRepo = manager.getRepository(FeedEntity);
    const userRepo = manager.getRepository(UserEntity);
    const removeEntryFromFollowingFeedResult =
      await this.feedService.removeEntry(
        currentUser.followingFeedId!,
        unfollowedUser.id,
        { repo: feedRepo, inTxt: false }
      );
    const removeEntryFromFollowersFeedResult =
      await this.feedService.removeEntry(
        unfollowedUser.followerFeedId!,
        currentUser.id,
        { repo: feedRepo, inTxt: false }
      );
    if (removeEntryFromFollowingFeedResult.entity) {
      currentUser.setStats({
        followingCount: removeEntryFromFollowingFeedResult.entity.count,
      });
      await this.userStatsService.jsonSetStatsInTxn({
        id: currentUser.id,
        statsValue: removeEntryFromFollowingFeedResult.entity.count ?? 0,
        statsKey: 'followingCount',
        userRepo,
      });
    }
    if (removeEntryFromFollowersFeedResult.entity) {
      await this.userStatsService.jsonSetStatsInTxn({
        id: unfollowedUser.id,
        statsValue: removeEntryFromFollowersFeedResult.entity.count ?? 0,
        statsKey: 'followerCount',
        userRepo,
      });
    }
    return currentUser;
  }

  /**
   * @return UserEntity who unfollowed, i.e. CurrentUser
   */
  async unfollowUser(
    currentUser: UserEntity,
    userToUnfollow: UserEntity | string,
    manager?: EntityManager
  ): Promise<UserEntity | undefined> {
    const unfollowedUser =
      typeof userToUnfollow === 'string'
        ? await this.repo.findOne(userToUnfollow)
        : userToUnfollow;
    if (!unfollowedUser?.followerFeedId) return undefined;
    if (!currentUser?.followingFeedId) return undefined;
    if (manager) {
      currentUser = await this.unfollowUserWithoutTransaction({
        manager,
        currentUser,
        unfollowedUser,
      });
    } else {
      currentUser = await this.repo.manager.transaction(async manager => {
        return await this.unfollowUserWithoutTransaction({
          manager,
          currentUser,
          unfollowedUser,
        });
      });
    }
    try {
      await this.unfollowEventCleanup({
        unfollowedUserId: unfollowedUser.id,
        ownerId: currentUser.id,
      });
    } catch (e) {
      this.logger.warn(
        'Failed to perform unfollowEventCleanup synchronously, thus spawning a worker',
        { e }
      );
      await this.unfollowEventRelatedItemsCleanupViaWorker({
        ownerId: currentUser.id,
        unfollowedUserId: unfollowedUser.id,
      }); //end of TxT
    }
    [currentUser.id, unfollowedUser.id].map(id => this.requestReIndex(id));
    return currentUser;
  }

  async unfollowFromBothEnds(userA: UserEntity, userB: UserEntity) {
    await this.feedService.repo.manager.transaction(async entityManager => {
      const repo = entityManager.getRepository(FeedEntity);
      //Getting the lock
      await repo.findByIds(
        [
          userA.followingFeedId!,
          userA.followerFeedId!,
          userB.followingFeedId!,
          userB.followerFeedId!,
        ],
        { lock: { mode: 'pessimistic_write' } }
      );
      if (userA.followingFeedId) {
        const result = await this.feedService.removeEntry(
          userA.followingFeedId,
          userB.id,
          {
            repo,
          }
        );
        userA.setStats({
          followingCount: result.entity.count,
        });
      }
      if (userA.followerFeedId) {
        const result = await this.feedService.removeEntry(
          userA.followerFeedId,
          userB.id,
          {
            repo,
          }
        );
        userA.setStats({
          followerCount: result.entity.count,
        });
      }
      if (userB.followingFeedId) {
        const result = await this.feedService.removeEntry(
          userB.followingFeedId,
          userA.id,
          {
            repo,
          }
        );
        userB.setStats({
          followingCount: result.entity.count,
        });
      }
      if (userB.followerFeedId) {
        const result = await this.feedService.removeEntry(
          userB.followerFeedId,
          userA.id,
          {
            repo,
          }
        );
        userB.setStats({
          followerCount: result.entity.count,
        });
      }
      const userRepo = entityManager.getRepository(UserEntity);
      await userRepo
        .createQueryBuilder()
        .update(PostEntity)
        .set({
          _stats: () =>
            `jsonb_set(COALESCE(stats, '{}'), '{followerCount}', '${
              userA.getStats().followerCount
            }'::jsonb, true)`,
        })
        .set({
          _stats: () =>
            `jsonb_set(stats, '{followingCount}', '${
              userA.getStats().followingCount
            }'::jsonb)`,
        })
        .where('id = :id', { id: userA.id })
        .execute();

      await userRepo
        .createQueryBuilder()
        .update(PostEntity)
        .set({
          _stats: () =>
            `jsonb_set(COALESCE(stats, '{}'), '{followerCount}', '${
              userB.getStats().followerCount
            }'::jsonb, true)`,
        })
        .set({
          _stats: () =>
            `jsonb_set(stats, '{followingCount}', '${
              userB.getStats().followingCount
            }'::jsonb)`,
        })
        .where('id = :id', { id: userB.id })
        .execute();
      //If spawning worker fails, the whole Txt will fail
      await this.unfollowEventRelatedItemsCleanupViaWorker({
        ownerId: userA.id,
        unfollowedUserId: userB.id,
      });
      await this.unfollowEventRelatedItemsCleanupViaWorker({
        ownerId: userB.id,
        unfollowedUserId: userA.id,
      });
    });
  }

  async removePostsFromFollowingsFeed(
    ownerId: string,
    unfollowedUserId: string
  ) {
    await this.addOrRemovePostsFromFeedWorker.removePostsFromFeed({
      whosePosts: unfollowedUserId,
      whoseFeed: ownerId,
    });
  }

  async blockUser(
    currentUser: UserEntity,
    userOrIdToBlock: UserEntity | string
  ): Promise<boolean | string> {
    const context = {
      userId: currentUser.id,
      userToBlockId:
        typeof userOrIdToBlock === 'string'
          ? userOrIdToBlock
          : userOrIdToBlock.id,
      methodName: 'blockUser',
    };
    const userToBlock =
      typeof userOrIdToBlock === 'string'
        ? await this.findById(userOrIdToBlock)
        : userOrIdToBlock;
    if (!userToBlock) {
      this.logger.error('cannot block, user not found', context);
      return 'user not found';
    }
    if (currentUser.id === userToBlock.id) {
      this.logger.warn('cannot block yourself', context);
      return 'you cannot block yourself';
    }
    this.logger.info('blocking user', context);
    await this.repo.manager.transaction(async manager => {
      const feedRepo = manager.getRepository(FeedEntity);
      //Block List of the user who is blocking
      let blockListFeed: FeedEntity | undefined;
      if (currentUser.blockListFeedId) {
        this.logger.info('Current user BlockList Feed ID', context);
        const feed = await feedRepo.findOne({
          where: {
            id: currentUser.blockListFeedId,
          },
          lock: { mode: 'pessimistic_write_or_fail' },
        });
        if (feed) {
          this.logger.info('Feed found', context);
          blockListFeed = feed;
        } else {
          this.logger.info('Feed not found', context);
        }
      }
      if (!blockListFeed) {
        blockListFeed = new FeedEntity();
        blockListFeed.id = toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id);
        await feedRepo.insert(blockListFeed);
        await manager.getRepository(UserEntity).update(currentUser.id, {
          blockListFeedId: toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id),
          blockListFeed: blockListFeed,
        });
      }
      await this.feedService.tryAndPushEntry(blockListFeed.id, userToBlock.id, {
        repo: feedRepo,
        inTxt: false,
      });
      //BlockByUserList of the user who is being blocked
      let blockByUsersListFeed: FeedEntity | undefined = await feedRepo.findOne(
        {
          where: {
            id: toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, userToBlock.id),
          },
          lock: { mode: 'pessimistic_write_or_fail' },
        }
      );
      if (!blockByUsersListFeed) {
        blockByUsersListFeed = new FeedEntity();
        blockByUsersListFeed.id = toFeedId(
          FeedEntityType.BLOCKED_BY_USERS_LIST,
          userToBlock.id
        );
        await feedRepo.insert(blockByUsersListFeed);
      }
      await this.feedService.tryAndPushEntry(
        blockByUsersListFeed.id,
        currentUser.id,
        {
          repo: feedRepo,
          inTxt: false,
        }
      );
    });
    try {
      await this.unfollowFromBothEnds(currentUser, userToBlock);
    } catch (error) {
      this.logger.error('failed to unfollow from both ends', {
        error,
        ...context,
      });
      await this.unblockUser(userToBlock.id, currentUser);
    }
    [currentUser.id, userToBlock.id].map(id => this.requestReIndex(id));
    return true;
  }

  async unblockUser(
    userToUnblockId: string,
    currentUser: UserEntity
  ): Promise<boolean | string> {
    const userToUnblockBlock = await this.repo.findOne(userToUnblockId);
    if (!userToUnblockBlock) {
      return 'user not found';
    }
    await this.repo.manager.transaction(async manager => {
      const repo: Repository<FeedEntity> = manager.getRepository(FeedEntity);
      const blockListFeedId =
        currentUser.blockListFeedId ??
        toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id);
      const blockListFeed = await repo.findOne({
        where: {
          id: blockListFeedId,
        },
        lock: { mode: 'pessimistic_write_or_fail' },
      });
      if (blockListFeed) {
        try {
          await this.feedService.removeEntry(blockListFeedId, userToUnblockId, {
            repo,
          });
        } catch (e) {
          this.logger.error(e);
        }
      } else {
        this.logger.warn(
          'While unblocking, unable to get BlockListFeed for user',
          {
            userId: currentUser.id,
          }
        );
      }
      try {
        await this.feedService.removeEntry(
          toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, userToUnblockId),
          currentUser.id,
          { repo }
        );
      } catch (e) {
        this.logger.warn(e);
      }
    });
    [currentUser.id, userToUnblockId].map(id => this.requestReIndex(id));
    return true;
  }

  async login(
    email: string,
    fcmToken: string
  ): Promise<UserLoginResult | undefined> {
    const user = await this.findByEmail(email);
    if (!user) return undefined;
    this.logger.debug('login found user', { userId: user.id });
    const payload: UserJwtToken = { id: user.id };
    await this.update(user.id, { fcmToken });
    this.logger.info('DebugLogin updated fcm ', { fcmToken });
    return {
      jwtToken: this.jwtService.sign(payload),
      user: user,
    };
  }

  getJwtTokenFromUserId(userId: string): string {
    const payload: UserJwtToken = { id: userId };
    return this.jwtService.sign(payload);
  }

  async signUp({
    input,
    idToken,
  }: {
    input: SignUpWithEmailInput | SignUpWithPhoneNumberInput;
    idToken: DecodedIdToken;
  }): Promise<UserEntity | undefined> {
    return await this.createUser({ input, idToken });
  }

  async firebaseSignup(
    input: FirebaseSignupInput
  ): Promise<UserLoginResult | boolean> {
    // let user = await this.findByFirebaseUid(input.uid);
    let user;
    if (!user) {
      this.logger.debug('firebaseSignup creating user', {
        userUID: input.uid,
      });
      user = new UserEntity();
      user.email = input.email;
      user.name = input.name ?? '';
      user.firebaseUID = input.uid;
      user.handle = input.handle;
      user.phoneNumber = input.phoneNumber;
      user.inviteCount = 5;
      user.fcmToken = input.fcmToken;
      user.birthday = input.birthday;
      const password = passwordGenerator.generate({
        length: 12,
        numbers: true,
        strict: true,
      });
      const [imageFile, hashedPassword] = await Promise.all([
        input.image && this.uploadService.uploadFile(input.image),
        bcrypt.hash(password, 10),
      ]);
      if (imageFile) user.avatarImage = imageFile.path;
      user.password = hashedPassword;
      user.id = generateId();
      user.gender = this.toGenderIndex(input?.gender);
      user.pronoun = genderToPronounString(input.gender);
      const userOrError: UserEntity | undefined = await this.addFeedAndSaveUser(
        {
          user,
          inviteCode: input.inviteCode,
        }
      );
      if (!userOrError) {
        return false;
      }
      user = userOrError;
    } else {
      // this.logger.warn('firebaseSignup() user already exists', {
      //   userUID: user.firebaseUID,
      // });
    }
    const payload: UserJwtToken = { id: user.id };
    this.requestReIndex(user.id);
    return {
      jwtToken: this.jwtService.sign(payload),
      user: user,
    };
  }

  async firebaseLoginOrSignupViaEmailOrPhoneNumber(
    input: FirebaseAuthEmailInput | FirebaseAuthPhoneNumberInput
  ): Promise<UserLoginResult | undefined> {
    const user = await this.findByFirebaseUid(input.uid);
    if (!user) {
      return undefined;
    } else {
      this.logger.debug('found existing user', { id: user.id });
    }
    const payload: UserJwtToken = { id: user.id };
    user.fcmToken = input.fcmToken;
    await this.save(user);
    return {
      jwtToken: this.jwtService.sign(payload),
      user: user,
    };
  }

  async find(query: string, paginate: PaginateParams): Promise<UserEntity[]> {
    const conds: FindConditions<UserEntity> = {
      handle: Raw(alias => `${alias} ILIKE :query`, { query: `%${query}%` }),
    };
    const limit: number =
      (paginate.__type == 'PaginateDownParams' ? paginate.first : undefined) ??
      (paginate.__type == 'PaginateUpParams' ? paginate.last : undefined) ??
      10;
    if (paginate.__type === 'PaginateDownParams' && paginate.after) {
      conds.id = MoreThan(paginate.after);
    } else if (paginate.__type === 'PaginateUpParams' && paginate.before) {
      conds.id = LessThan(paginate.before);
    }
    return this.repo.find({
      where: conds,
      take: limit,
    });
  }

  // Returns set of user ids that exist.
  async filter(ids: string[]): Promise<string[]> {
    const userIds = await this.repo.findByIds(ids, { select: ['id'] });
    return userIds.filter(u => ids.includes(u.id)).map(u => u.id);
  }

  async save(user: UserEntity) {
    await this.repo.save(user);
  }

  async update(
    userId: string,
    partialEntity: QueryDeepPartialEntity<UserEntity>
  ) {
    try {
      const result = await this.repo.update(userId, partialEntity);
      this.logger.info('Updated user', { userId, partialEntity });
      return result;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  async updateEmail(
    uid: string,
    updatedEmail: string
  ): Promise<UserEntity | string> {
    const user = await this.findByFirebaseUid(uid);
    if (!user) {
      return 'Sorry, user not found.';
    }
    user.email = updatedEmail;
    await this.repo.save(user);
    this.requestReIndex(user.id);
    return user;
  }

  async updateName(
    uid: string,
    updatedName: string
  ): Promise<UserEntity | string> {
    const user = await this.findByFirebaseUid(uid);
    if (!user) {
      return 'Sorry, user not found.';
    }
    user.name = updatedName;
    await this.repo.save(user);
    await this.esIndexService.updateUserName(user.id, updatedName);
    this.requestReIndex(user.id);
    return user;
  }

  async updateHandle(
    uid: string,
    handle: string
  ): Promise<UserEntity | string> {
    return await this.repo.manager.transaction<UserEntity | string>(
      async (em: EntityManager): Promise<UserEntity | string> => {
        if (!/^([a-zA-Z_0-9]{5,})$/.test(handle)) {
          return 'Not a valid handle';
        }
        const existingUsersWithThatHandle: UserEntity[] = await em.find(
          UserEntity,
          {
            where: { handle },
          }
        );
        if (existingUsersWithThatHandle.length > 0) {
          this.logger.error(`Found existing users with the handle: ${handle}`);
          return 'Handle already in use! Please choose another one.';
        } else {
          this.logger.debug(`No uses found with the handle: ${handle}`);
          const user = await em.find(UserEntity, {
            where: { firebaseUID: uid },
          });
          if (!user) {
            this.logger.error(`No uses found with the uid: ${uid}`);
            return 'Sorry, user not found.';
          }
          const foundUser = user[0]; //There can only be one user with that uid
          this.logger.error('Found the user ', {
            user: { ...foundUser, password: '<redacted>' },
          });
          foundUser.handle = handle;
          await em.save(UserEntity, foundUser);
          await this.esIndexService.updateUserHandle(foundUser.id, handle);
          this.requestReIndex(foundUser.id);
          return foundUser;
        }
      }
    );
  }

  async updateBio(uid: string, bio: string): Promise<UserEntity | string> {
    if (bio.length > 200) return "Bio can't be more than 200 characters";
    const user = await this.findByFirebaseUid(uid);
    if (!user) {
      return 'Sorry, user not found.';
    }
    user.bio = bio;
    await this.repo.save(user);
    this.requestReIndex(user.id);
    return user;
  }

  async updatePronoun(
    uid: string,
    pronoun: string
  ): Promise<UserEntity | string> {
    if (pronoun.length > 20) return "Pronoun can't be more than 20 characters";
    const user = await this.findByFirebaseUid(uid);
    if (!user) {
      return 'Sorry, user not found.';
    }
    user.pronoun = pronoun;
    await this.repo.save(user);
    this.requestReIndex(user.id);
    return user;
  }

  async updatePhoneNumber(
    uid: string,
    updatedPhoneNumber: string
  ): Promise<UserEntity | string> {
    const user = await this.findByFirebaseUid(uid);
    if (!user) {
      return 'Sorry, user not found.';
    }
    user.phoneNumber = updatedPhoneNumber;
    await this.repo.save(user);
    this.requestReIndex(user.id);
    return user;
  }

  async updateAvatar(uid: string, image: Upload): Promise<UserEntity | string> {
    this.logger.debug('Uploading avatar', { uid: uid });
    const imageFile = await this.uploadService.uploadFile(image);
    const user = await this.findByFirebaseUid(uid);
    if (!user) {
      return 'Sorry, user not found.';
    }
    user.avatarImage = imageFile.path;
    await this.repo.save(user);
    this.requestReIndex(user.id);
    return user;
  }

  async removeAvatar(uid: string): Promise<UserEntity | string> {
    this.logger.debug('REMOVING AVATAR');
    const user = await this.findByFirebaseUid(uid);
    if (!user) {
      return 'Sorry, user not found.';
    }
    user.avatarImage = '';
    await this.repo.save(user);
    this.requestReIndex(user.id);
    return user;
  }

  async updateFCMTokenn(
    id: string,
    token: string
  ): Promise<UserEntity | string> {
    const user = await this.findById(id);
    if (!user) {
      return 'Sorry, user not found.';
    }
    await this.repo.update(user.id, { fcmToken: token });
    user.fcmToken = token;
    return user;
  }

  /**
   * @warn extra DB Read
   */
  async isAvailable(
    currentUser: UserEntity,
    userIdToCheck: string
  ): Promise<boolean> {
    if (currentUser.id === userIdToCheck) return true;
    const userToCheck = await this.repo.findOne(userIdToCheck);
    if (userToCheck) {
      if (!userToCheck.isAlive()) return false;
      if (userToCheck.blockListFeedId) {
        const blockListFeed = await this.feedService.find(
          userToCheck.blockListFeedId
        );
        if (blockListFeed) {
          return !blockListFeed.hasEntry(currentUser.id);
        }
      }
    }
    return true;
  }

  async getBlockedUsersList({
    userId,
    userEntity,
  }: {
    userId?: string | undefined;
    userEntity?: UserEntity | undefined;
  }): Promise<string[]> {
    userId ??= userEntity?.id;
    if (!userId)
      throw Error('getBlockedUsersList userId and userEntity are empty');
    if (!userEntity) {
      this.logger.warn(
        '[getBlockedUsersList()] Prefer passing UserEntity object under `userEntity`'
      );
    }
    let blockListFeed = await this.feedService.find(
      toFeedId(FeedEntityType.BLOCK_LIST, userId)
    );
    if (!blockListFeed) {
      if (!userEntity) {
        userEntity = await this.findById(userId);
        if (!userEntity) {
          throw Error('userWhoBlocked not found');
        }
      }
      if (!userEntity.blockListFeedId) return [];
      blockListFeed = await this.feedService.find(userEntity.blockListFeedId);
    }
    if (!blockListFeed) return [];
    return blockListFeed.ids;
  }

  async hasBlockedFromEitherSide({
    userAId,
    userA,
    userBId,
    userB,
  }: {
    userAId?: string | undefined;
    userA?: UserEntity | undefined;
    userBId?: string | undefined;
    userB?: UserEntity | undefined;
  }) {
    if (userAId === undefined && userA === undefined)
      throw Error('userAId and userA are empty');
    if (userBId === undefined && userB === undefined)
      throw Error('userBId and userB are empty');
    const userAHasBlocked: boolean = await this.hasBlocked({
      userWhoBlocked: userA,
      userWhoBlockedId: userAId,
      userIdToCheck: userBId ?? userB?.id ?? '',
    });
    if (userAHasBlocked) return true;
    return await this.hasBlocked({
      userWhoBlocked: userB,
      userWhoBlockedId: userBId,
      userIdToCheck: userAId ?? userA?.id ?? '',
    });
  }

  async hasBlocked({
    userWhoBlockedId,
    userWhoBlocked,
    userIdToCheck,
  }: {
    userWhoBlockedId?: string;
    userWhoBlocked?: UserEntity;
    userIdToCheck: string;
  }): Promise<boolean> {
    if (!userWhoBlockedId) {
      userWhoBlockedId = userWhoBlocked?.id;
    }
    if (!userWhoBlockedId && !userWhoBlocked)
      throw new WildrException('userWhoBlocked and userWhoBlockedId are empty');
    if (!userWhoBlocked) {
      this.logger.warn(
        '[hasBlocked()] Prefer passing UserEntity object under `userWhoBlocked`'
      );
    }
    if (userWhoBlockedId === userIdToCheck) return false;
    let blockListFeed = await this.feedService.find(
      toFeedId(FeedEntityType.BLOCK_LIST, userWhoBlockedId!)
    );
    if (!blockListFeed) {
      if (!userWhoBlocked) {
        userWhoBlocked = await this.findById(userWhoBlockedId!);
        if (!userWhoBlocked) {
          throw Error('userWhoBlocked not found');
        }
      }
      if (!userWhoBlocked.blockListFeedId) return false;
      blockListFeed = await this.feedService.find(
        userWhoBlocked.blockListFeedId
      );
    }
    if (!blockListFeed) return false;
    return blockListFeed.hasEntry(userIdToCheck);
  }

  async updateCommentOnboardAt(id: string): Promise<UserEntity | string> {
    const user = await this.findById(id);
    if (!user) {
      return 'Sorry, user not found.';
    }
    const date = new Date();
    await this.repo.update(user.id, { commentOnboardedAt: date });
    user.commentOnboardedAt = date;
    return user;
  }

  async checkPhoneNumberUserExists(phoneNumber: string): Promise<boolean> {
    return !!(await this.firebaseAuthService.getUIDByPhoneNumber(phoneNumber));
  }

  isEmbargoLiftedFor(user: UserEntity): boolean {
    return !(!user.commentEnabledAt && !user.commentOnboardedAt);
  }

  isRealIdVerified(user: UserEntity): boolean {
    return user.realIdVerificationStatus == RealIdVerificationStatus.VERIFIED;
  }

  isSuspended(user: UserEntity): boolean {
    return user.isSuspended;
  }

  async requestDeleteUser(user: UserEntity): Promise<boolean> {
    await this.repo.update(user.id, { deleteRequestedAt: new Date() });
    this.logger.debug('User requested delete', { user });
    this.requestReIndex(user.id);
    return true;
  }

  getRingColor(score: number): RingColor {
    if (score <= 2) {
      return RingColor.RED;
    } else if (score <= 4) {
      return RingColor.ORANGE;
    } else {
      return RingColor.GREEN;
    }
  }

  getRingColorName(color: RingColor): string {
    switch (color) {
      case RingColor.GREEN:
        return 'Green';
      case RingColor.ORANGE:
        return 'Orange';
      case RingColor.RED:
        return 'Red';
    }
  }

  async report(
    userId: string,
    reportTypeVal: ReportType,
    currentUser?: UserEntity
  ): Promise<UserEntity | string> {
    const user = await this.repo.findOne(userId);
    if (user) this.requestReIndex(user.id);
    return user ?? 'User not found';
  }

  async getInviteCode(
    userId: string,
    action?: GqlInviteCodeAction
  ): Promise<
    [InviteCodeEntity | undefined, GqlUser | undefined, string | undefined]
  > {
    const user = await this.findById(userId);
    if (!user) {
      return [undefined, undefined, 'User not found'];
    }
    let inviteCodeEntity: InviteCodeEntity | undefined;
    inviteCodeEntity = await this.inviteCodeService.getExitingCode(
      userId,
      action ? fromGqlInviteCodeAction(action) : undefined
    );
    if (!inviteCodeEntity) {
      this.logger.debug('generating invite code');
      inviteCodeEntity = await this.inviteCodeService.createInviteCode({
        inviterId: userId,
        action: !!action ? fromGqlInviteCodeAction(action) : undefined,
      });
    }
    if (inviteCodeEntity) {
      try {
        await this.save(user);
        return [
          inviteCodeEntity,
          this.toUserObject({
            user,
            isCurrentUserRequestingTheirDetails: true,
          }),
          undefined,
        ];
      } catch (error) {
        this.logger.error('[getInviteCode()]', error);
        return [undefined, undefined, 'Something went wrong'];
      }
    }
    return [undefined, undefined, 'Something went wrong'];
  }

  async findAllCommentEmbargoPassed(): Promise<UserEntity[]> {
    let date = new Date();
    date = new Date(date.setDate(date.getDate() - 7));
    return this.repo.find({
      where: { createdAt: LessThan(date), commentEnabledAt: IsNull() },
      relations: [UserEntity.kActivityStreamRelation],
    });
  }

  async findAllSuspensionExpired(): Promise<UserEntity[]> {
    return this.repo.find({
      loadRelationIds: true,
      where: {
        suspensionExpirationTS: LessThan(new Date()),
        isSuspended: true,
      },
    });
  }

  async takeDown(userOrId: string | UserEntity): Promise<boolean> {
    const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
    const result = await this.update(userId, {
      state: ExistenceState.TAKEN_DOWN,
    });
    this.logger.info('takeDown', { result });
    if (!result) {
      return false;
    }
    this.requestReIndex(userId);
    return result.affected !== undefined;
  }

  async respawn(userOrId: string | UserEntity): Promise<boolean> {
    const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
    const result = await this.update(userId, {
      state: undefined,
    });
    this.logger.info('respawn', { result });
    if (!result) {
      return false;
    }
    this.requestReIndex(userId);
    return result.affected !== undefined;
  }

  async addSuspension(userId: string, suspensionExpirationTS?: Date) {
    if (suspensionExpirationTS == null) {
      const tempDate = new Date();
      tempDate.setDate(new Date().getDate() + FIRST_STRIKE_COOLDOWN_DAYS);
      suspensionExpirationTS = tempDate;
    }
    await this.repo.update(userId, {
      isSuspended: true,
      suspensionExpirationTS,
    });
    this.requestReIndex(userId);
    return true;
  }

  async removeSuspension(userId: string) {
    await this.repo.update(userId, {
      suspensionExpirationTS: undefined,
      isSuspended: false,
    });
    this.requestReIndex(userId);
    return true;
  }

  async createEmbargo(userId: string) {
    await this.repo.update(userId, {
      commentEnabledAt: undefined,
      commentOnboardedAt: undefined,
    });
    this.requestReIndex(userId);
  }

  async removeEmbargo(userId: string) {
    await this.repo.update(userId, {
      commentEnabledAt: new Date(),
      commentOnboardedAt: undefined,
    });
    this.requestReIndex(userId);
  }

  //throws exceptions
  async wildrVerifiedManualReviewSubmission(
    input: WildrVerifiedManualReviewInput,
    currentUser: UserEntity
  ) {
    if (
      currentUser.realIdVerificationStatus === RealIdVerificationStatus.VERIFIED
    ) {
      throw new BadRequestException('Your account is already verified');
    } else if (
      currentUser.realIdVerificationStatus ===
      RealIdVerificationStatus.PENDING_REVIEW
    ) {
      throw new BadRequestException(
        'Your account is currently being reviewed review'
      );
    }
    const [profileImage, manualReviewImage] = await Promise.all([
      this.uploadService.uploadFile(input.faceImage),
      this.uploadService.uploadFile(input.manualReviewImage),
    ]);
    await this.repo.update(currentUser.id, {
      realIdFaceUrl: profileImage.path,
      realIdFaceData: { faceSignature: [] },
      realIdFailedVerificationImageData: [
        {
          imageUrl: manualReviewImage.path,
          handGesture: RealIdHandGesture.RAISED_HAND,
        },
        {
          imageUrl: manualReviewImage.path,
          handGesture: RealIdHandGesture.RAISED_HAND,
        },
        {
          imageUrl: manualReviewImage.path,
          handGesture: RealIdHandGesture.RAISED_HAND,
        },
      ],
      realIdVerificationStatus: RealIdVerificationStatus.PENDING_REVIEW,
    });
    this.requestReIndex(currentUser.id);
  }

  async updateRealIdStatus(
    user: UserEntity,
    passOrFail: PassFailState,
    realIdFaceImage: Upload,
    realIdFaceData: RealIdFaceData,
    realIdFailedVerificationImageData?: GqlRealIdFailedVerificationImageData[]
  ): Promise<[boolean, string]> {
    if (user.realIdVerificationStatus === RealIdVerificationStatus.VERIFIED) {
      return [false, 'Your account is already verified'];
    } else if (
      user.realIdVerificationStatus === RealIdVerificationStatus.PENDING_REVIEW
    ) {
      return [false, 'Your account is currently in pending review'];
    }
    const realIdFaceFileUpload = await this.uploadService.uploadFile(
      realIdFaceImage
    );
    if (passOrFail === PassFailState.PASS) {
      await this.repo.update(user.id, {
        realIdFaceUrl: realIdFaceFileUpload.path,
        realIdFaceData: realIdFaceData,
        realIdVerifiedAt: new Date(),
        realIdVerificationStatus: RealIdVerificationStatus.VERIFIED,
      });
      this.requestReIndex(user.id);
      return [true, 'Your account is now verified'];
    } else {
      if (
        !realIdFailedVerificationImageData ||
        !realIdFailedVerificationImageData.length
      ) {
        return [false, 'Please provide at least 1 image'];
      }
      const failedVerificationImageData: RealIdFailedVerificationImageData[] =
        await Promise.all(
          realIdFailedVerificationImageData!.map(async item => {
            return new RealIdFailedVerificationImageData(
              item.isSmiling,
              (await this.uploadService.uploadFile(item.image)).path,
              getRealIdHandGesture(item.handGesture.valueOf()) //converting string enum to numbered enum
            );
          })
        );
      await this.repo.update(user.id, {
        realIdFaceUrl: realIdFaceFileUpload.path,
        realIdFaceData,
        realIdFailedVerificationImageData: failedVerificationImageData,
        realIdVerificationStatus: RealIdVerificationStatus.PENDING_REVIEW,
      });
      this.requestReIndex(user.id);
      return [true, 'Please wait for your account to be reviewed'];
    }
  }

  async parseAllUrls(users: UserEntity[]): Promise<UserEntity[]> {
    for (let user of users) {
      user = await this.parseUrls(user);
    }
    return users;
  }

  async parseUrls(user: UserEntity): Promise<UserEntity> {
    if (user.realIdFaceUrl)
      user.realIdFaceUrl = (await this.toURL(user.realIdFaceUrl)).toString();
    if (user.avatarImage)
      user.avatarImage = (await this.toURL(user.avatarImage)).toString();
    if (user.realIdFailedVerificationImageData) {
      for (const i of user.realIdFailedVerificationImageData) {
        i.imageUrl = (await this.toURL(i.imageUrl)).toString();
      }
    }
    return user;
  }

  async updateCategoryInterests(userId: string, categoryIds: string[]) {
    const feed = await this.feedService.findOrCreate(
      FeedEntityType.USER_CATEGORY_INTERESTS,
      userId
    );
    const originalMap: Map<string, number> = kvpToMap(
      feed.page.idsWithScore.idsMap
    );
    const newMap: Map<string, number> = new Map<string, number>();
    categoryIds.forEach(categoryId => {
      const existingScore: number | undefined = originalMap.get(categoryId);
      if (existingScore) {
        newMap.set(categoryId, existingScore);
      } else {
        newMap.set(categoryId, 1);
      }
    });
    feed.page.idsWithScore.idsMap = mapToKVP(newMap);
    await this.feedService.save([feed]);
    this.requestReIndex(userId);
  }

  async prepareInitialFeed(userId: string) {
    await this.prepareInitialFeedWorker.prepareInitialFeed({ userId });
  }

  async updatePostTypeInterests(userId: string, postTypeIds: string[]) {
    const feed = await this.feedService.findOrCreate(
      FeedEntityType.USER_POST_TYPE_INTERESTS,
      userId
    );
    const originalMap = kvpToMap(feed.page.idsWithScore.idsMap);
    const newMap: Map<string, number> = new Map<string, number>();
    postTypeIds.forEach(postTypeId => {
      const existingScore: number | undefined = originalMap.get(postTypeId);
      if (existingScore) {
        newMap.set(postTypeId, existingScore);
      } else {
        newMap.set(postTypeId, 5);
      }
    });
    feed.page.idsWithScore.idsMap = mapToKVP(newMap);
    await this.update(userId, { didFinishOnboarding: true });
    await this.feedService.save([feed]);
    this.requestReIndex(userId);
  }

  async updateCategoryInterestScore(userId: string, categoryId: string) {
    const feed = await this.feedService.findOrCreate(
      FeedEntityType.USER_CATEGORY_INTERESTS,
      userId
    );
    const map = kvpToMap(feed.page.idsWithScore.idsMap);
    let score = map.get(categoryId);
    if (score) {
      score += 1;
      map.set(categoryId, score);
    } else {
      map.set(categoryId, 3);
    }
    feed.page.idsWithScore.idsMap = mapToKVP(map);
    await this.feedService.save([feed]);
    this.requestReIndex(userId);
  }

  async updatePostTypeInterestScore(userId: string, postTypeId: string) {
    const feed = await this.feedService.findOrCreate(
      FeedEntityType.USER_POST_TYPE_INTERACTION,
      userId
    );
    const map = kvpToMap(feed.page.idsWithScore.idsMap);
    let score = map.get(postTypeId);
    if (score) {
      score += 1;
      map.set(postTypeId, score);
    } else {
      map.set(postTypeId, 3);
    }
    feed.page.idsWithScore.idsMap = mapToKVP(map);
    await this.feedService.save([feed]);
    this.requestReIndex(userId);
  }

  async hasCompletedOnboarding(user: UserEntity): Promise<boolean> {
    this.logger.info('hasCompletedOnboarding()');
    const categoryInterestsFeed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_CATEGORY_INTERESTS, user.id)
    );
    const postTypeInterestsFeed = await this.feedService.find(
      toFeedId(FeedEntityType.USER_POST_TYPE_INTERACTION, user.id)
    );
    const result = !!(categoryInterestsFeed && postTypeInterestsFeed);
    this.logger.info('hasCompletedOnboarding()', { result });
    return result;
  }

  async updateUserScoreData(job: UpdateScoreDataJob) {
    await this.scoreDataWorker.updateUserScoreData(job);
  }

  async createInnerCirclesList(userId: string) {
    this.logger.info('createInnerCirclesList()', { userId });
    try {
      await this.userListService.createInnerCircleList(userId);
    } catch (e) {
      this.logger.error(e);
    }
  }

  async createAndFillInnerCirclesSuggestionList(
    user: UserEntity
  ): Promise<FeedEntity | undefined> {
    this.logger.info('createInnerCirclesList()', {
      userId: user.id,
      handle: user.handle,
    });
    try {
      const feed = await this.feedService.create(
        FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST,
        user.id
      );
      const followingFeed = await this.feedService.find(
        user.followingFeedId ?? ''
      );
      if (followingFeed) {
        feed.page.ids = followingFeed.ids;
      }
      await this.feedService.update(feed.id, { page: feed.page });
      return feed;
    } catch (e) {
      this.logger.error(e);
    }
  }

  async findOrCreateInnerCirclesSuggestionFeed(
    userId: string
  ): Promise<FeedEntity | undefined> {
    this.logger.info('createInnerCirclesList()', { userId });
    try {
      return await this.feedService.findOrCreate(
        FeedEntityType.INNER_CIRCLE_SUGGESTIONS_LIST,
        userId
      );
    } catch (e) {
      this.logger.error(e);
    }
  }

  async createUserPropertyMap(userId: string): Promise<UserPropertyMapEntity> {
    this.logger.info('createUserPropertyMap()', { userId });
    try {
      return await this.userPropertyMapService.createMapEntity(userId);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * Performs action in transaction
   * Fills up the Property map with Followers
   */
  async createAndFillUserPropertyMapWithFollowers(
    user: UserEntity
  ): Promise<UserPropertyMapEntity> {
    this.logger.info('createAndFillUserPropertyMap', { id: user.id });
    try {
      const mapEntity = await this.createUserPropertyMap(user.id);
      const map = mapEntity.userPropertyMap;
      //Get followers list
      const feed = await this.feedService.find(user.followerFeedId ?? '');
      if (feed) {
        for (const id of feed.ids) {
          map.set(id, [toFeedId(FeedEntityType.FOLLOWING, id)]);
        }
      }
      mapEntity.userPropertyKvP = userPropertyMapToKvP(map);
      await this.userPropertyMapService.update(mapEntity.id, {
        userPropertyKvP: mapEntity.userPropertyKvP,
      });
      return mapEntity;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async isFollowing(ownerId: string, userIdToCheck: string) {
    if (ownerId === userIdToCheck) return true;
    const user = await this.findById(ownerId, {});
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.followingFeedId) {
      throw new NotFoundException(
        'Following feed not found for user ' + ownerId
      );
    }
    const result = await this.entitiesWithPagesCommon.indexOfEntry({
      entityId: user.followingFeedId!,
      repo: this.feedService.repo,
      entryToFind: userIdToCheck,
    });
    // this.logger.info('isFollowing', { result: result.index })
    return result.index !== -1;
  }

  async isPartOfInnerCircle(ownerId: string, userIdToCheck: string) {
    const user = await this.findById(ownerId, {});
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.followingFeedId) {
      throw new NotFoundException(
        'Following feed not found for user ' + ownerId
      );
    }
    const index = await this.userListService.findInnerCircleMemberIndex(
      ownerId,
      userIdToCheck
    );
    return index != -1;
  }

  async updateListVisibility(
    listVisibility: ListVisibility,
    currentUser: UserEntity
  ): Promise<UserEntity> {
    const visibilityPreferences = currentUser.visibilityPreferences;
    if (!visibilityPreferences) {
      currentUser.visibilityPreferences = { list: listVisibility };
    } else {
      currentUser.visibilityPreferences!.list = listVisibility;
    }
    const user = await this.repo.save(currentUser);
    this.requestReIndex(user.id);
    return user;
  }

  async setOnboardingSkipped({
    user,
    type,
  }: {
    user: UserEntity;
    type: keyof Pick<
      UserOnboarding,
      | 'innerCircleSkippedAt'
      | 'commentReplyLikesSkippedAt'
      | 'challengesSkippedAt'
    >;
  }): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(user)
      .where({ id: user.id })
      .set({
        onboardingStats: () =>
          `jsonb_set(onboarding_stats, '{${type}}', '"${new Date().toISOString()}"'::jsonb)`,
      })
      .execute();
  }

  async skipOnboarding(
    updateOnboardingInput: UpdateOnboardingInput,
    currentUser: UserEntity
  ): Promise<void> {
    switch (updateOnboardingInput.type) {
      case OnboardingType.INNER_CIRCLE:
        await this.setOnboardingSkipped({
          user: currentUser,
          type: 'innerCircleSkippedAt',
        });
        break;
      case OnboardingType.COMMENT_REPLY_LIKES:
        await this.setOnboardingSkipped({
          user: currentUser,
          type: 'commentReplyLikesSkippedAt',
        });
        break;
      case OnboardingType.CHALLENGES:
        await this.setOnboardingSkipped({
          user: currentUser,
          type: 'challengesSkippedAt',
        });
        break;
      case OnboardingType.CHALLENGE_AUTHOR_INTERACTIONS:
        throw new BadRequestException(
          'Cannot skip challenge author interactions onboarding'
        );
      case OnboardingType.CHALLENGE_EDUCATION:
        throw new BadRequestException(
          'Cannot skip challenge education onboarding'
        );
      default:
        const _exhaustiveCheck: never = updateOnboardingInput.type;
        throw new Error('[skipOnboarding] Invalid onboarding type');
    }
  }

  async setOnboardingFinished({
    user,
    type,
  }: {
    user: UserEntity;
    type: keyof Pick<
      UserOnboarding,
      | 'challenges'
      | 'challengeAuthorInteractions'
      | 'innerCircle'
      | 'commentReplyLikes'
      | 'challengeEducation'
    >;
  }): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(user)
      .where({ id: user.id })
      .set({
        onboardingStats: () =>
          `jsonb_set(onboarding_stats, '{${type}}', '${true}'::jsonb)`,
      })
      .execute();
  }

  async finishOnboarding(
    updateOnboardingInput: UpdateOnboardingInput,
    currentUser: UserEntity
  ): Promise<void> {
    this.logger.debug('[finishOnboarding]');
    switch (updateOnboardingInput.type) {
      case OnboardingType.INNER_CIRCLE:
        await this.setOnboardingFinished({
          user: currentUser,
          type: 'innerCircle',
        });
        break;
      case OnboardingType.COMMENT_REPLY_LIKES:
        await this.setOnboardingFinished({
          user: currentUser,
          type: 'commentReplyLikes',
        });
        break;
      case OnboardingType.CHALLENGES:
        await this.setOnboardingFinished({
          user: currentUser,
          type: 'challenges',
        });
        break;
      case OnboardingType.CHALLENGE_AUTHOR_INTERACTIONS:
        await this.setOnboardingFinished({
          user: currentUser,
          type: 'challengeAuthorInteractions',
        });
        break;
      case OnboardingType.CHALLENGE_EDUCATION:
        await this.setOnboardingFinished({
          user: currentUser,
          type: 'challengeEducation',
        });
        break;
      default:
        // @ts-ignore
        const _exhaustiveCheck: never = updateOnboardingInput.type;
        throw new Error('[finishOnboarding] Invalid onboarding type');
    }
  }

  /**
   * Retrieve onboarding stats, accounting for the last time that the user
   * has skipped onboardings.
   */
  async getOnboardingStats(currentUser?: UserEntity): Promise<OnboardingStats> {
    const user = currentUser && (await this.findById(currentUser.id));
    return {
      __typename: 'OnboardingStats',
      innerCircle: Boolean(
        user?.onboardingStats?.innerCircle ||
          !!user?.onboardingStats?.innerCircleSkippedAt
      ),
      commentReplyLikes: Boolean(
        user?.onboardingStats?.commentReplyLikes ||
          !!user?.onboardingStats?.commentReplyLikesSkippedAt
      ),
      challenges: Boolean(
        user?.onboardingStats?.challenges ||
          (user?.onboardingStats?.challengesSkippedAt &&
            isLessThanDaysAgo(user?.onboardingStats?.challengesSkippedAt, 2))
      ),
      challengeAuthorInteractions: Boolean(
        user?.onboardingStats?.challengeAuthorInteractions
      ),
      challengeEducation: Boolean(
        user?.onboardingStats?.challengeEducation === true ||
          !!user?.challengeContext
      ),
    };
  }

  async requestReIndex(userId: string): Promise<void> {
    return retryWithBackoff({
      fn: () =>
        this.incrementalIndexStateWorker.requestIncrementalIndex({
          entityName: 'UserEntity',
          entityId: userId,
        }),
      retryCount: 3,
      throwAfterFailedRetries: false,
    });
  }

  async userIdsOfBlockedUsersOnEitherSide(
    currentUser: UserEntity,
    blockListFeed?: FeedEntity,
    blockedByUsersFeed?: FeedEntity
  ) {
    const userList: string[] = [];
    const blockedByUsersList =
      blockedByUsersFeed ??
      (await this.feedService.find(
        toFeedId(FeedEntityType.BLOCKED_BY_USERS_LIST, currentUser.id)
      ));
    if (blockedByUsersList && blockedByUsersList.ids.length > 0)
      userList.push(...blockedByUsersList.ids);
    const blockList =
      blockListFeed ??
      (await this.feedService.find(
        currentUser.blockListFeedId ??
          toFeedId(FeedEntityType.BLOCK_LIST, currentUser.id)
      ));
    if (blockList && blockList.ids.length > 0) userList.push(...blockList.ids);
    return userList;
  }

  async updateJoinedChallengeEntryPost({
    challengeId,
    userId,
    post,
    manager,
  }: {
    challengeId: string;
    userId: string;
    post: PostEntity;
    manager: EntityManager;
  }): Promise<
    Result<
      UserEntity,
      | NotFoundException
      | InternalServerErrorException
      | HasNotJoinedChallengeException
    >
  > {
    try {
      const userRepo = manager.getRepository(UserEntity);
      const foundUser = await userRepo.findOne(userId, {
        lock: { mode: 'pessimistic_write' },
      });
      if (!foundUser) {
        return err(
          new NotFoundException(kSomethingWentWrong, {
            userId,
            challengeId: challengeId,
            postId: post.id,
            exceptionCode: NotFoundExceptionCodes.USER_NOT_FOUND,
            methodName: 'updateJoinedChallengeEntryPost',
          })
        );
      }
      const updateJoinedChallengeEntryPostResult =
        updateJoinedChallengeEntryPost({
          challengeId,
          user: foundUser,
          post,
        });
      if (updateJoinedChallengeEntryPostResult.isErr()) {
        return err(updateJoinedChallengeEntryPostResult.error);
      }
      await userRepo.update(foundUser.id, {
        challengeContext: foundUser.challengeContext,
      });
      return ok(foundUser);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          kSomethingWentWrong,
          {
            userId,
            challengeId: challengeId,
            postId: post.id,
            methodName: 'updateJoinedChallengeEntryPost',
          },
          error
        )
      );
    }
  }

  async updateJoinedChallengeEntryPostInTxt({
    challengeId,
    userId,
    post,
  }: {
    challengeId: string;
    userId: string;
    post: PostEntity;
  }): Promise<
    Result<
      UserEntity,
      | NotFoundException
      | InternalServerErrorException
      | HasNotJoinedChallengeException
    >
  > {
    let queryRunner: QueryRunner | undefined;
    try {
      queryRunner = this.repo.manager.connection.createQueryRunner();
      await queryRunner.startTransaction();
      const updateJoinedChallengeEntryPostResult =
        await this.updateJoinedChallengeEntryPost({
          challengeId,
          userId,
          post,
          manager: queryRunner.manager,
        });
      if (updateJoinedChallengeEntryPostResult.isErr()) {
        await queryRunner.rollbackTransaction();
        return err(updateJoinedChallengeEntryPostResult.error);
      }
      await queryRunner.commitTransaction();
      return ok(updateJoinedChallengeEntryPostResult.value);
    } catch (error) {
      await queryRunner?.rollbackTransaction().catch(e => {
        this.logger.warn(
          '[updateJoinedChallengeEntryPostInTxt] error rolling back transaction ',
          e
        );
      });
      return err(
        new InternalServerErrorException(
          '[updateJoinedChallengeEntryPostInTxt] ' + error,
          {
            userId,
            challengeId: challengeId,
            postId: post.id,
            methodName: 'updateJoinedChallengeEntryPostInTxt',
          },
          error
        )
      );
    } finally {
      await queryRunner?.release();
    }
  }

  private async jsonbSetLocalization({
    id,
    key,
    value,
    repo,
  }: {
    id: string;
    key: keyof UserLocalizationData;
    value: string | number | boolean;
    repo?: Repository<UserEntity>;
  }) {
    let statsValueForQuery = `'${value}'`;
    if (typeof value === 'string') {
      statsValueForQuery = `'"${value}"'`;
    }
    await (repo ?? this.repo)
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        localizationData: () =>
          `jsonb_set(COALESCE(localization_data, '{}'), '{${key}}', ${statsValueForQuery}::jsonb, true)`,
      })
      .where({ id })
      .execute();
  }

  async updateUserTimezoneOffset({
    userId,
    offset,
    repo,
  }: {
    userId: string;
    offset: string;
    repo?: Repository<UserEntity>;
  }): Promise<Result<undefined, InternalServerErrorException>> {
    try {
      await this.jsonbSetLocalization({
        id: userId,
        key: 'timezoneOffset',
        value: offset,
        repo,
      });
      return ok(undefined);
    } catch (error) {
      return err(
        new InternalServerErrorException(
          'Error updating user timezone offset: ' + error,
          {
            userId,
            offset,
            methodName: 'updateUserTimezoneOffset',
          },
          error
        )
      );
    }
  }
}

export interface ToUserObjParams {
  user: UserEntity;
  hasBlocked?: boolean;
  isAvailable?: boolean;
  isCurrentUserRequestingTheirDetails?: boolean;
}

export const kEmptyGqlPageInfo: PageInfo = {
  __typename: 'PageInfo',
  hasNextPage: false,
  endCursor: '',
  startCursor: '',
  hasPreviousPage: false,
};

export interface AddMemberToICResponse {
  owner: UserEntity;
  innerCircle: UserListEntity;
  didAddEntry: boolean;
}

export class UserNotFoundException extends NotFoundException {
  constructor(debugData: DebugData<NotFoundExceptionCodes> = {}) {
    super('User not found', {
      ...debugData,
      exceptionCode: NotFoundExceptionCodes.USER_NOT_FOUND,
    });
  }
}

export class UserMissingFCMTokenException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes>) {
    super('User missing FCM token', {
      ...debugData,
      exceptionCode: InternalServerErrorExceptionCodes.USER_MISSING_FCM_TOKEN,
    });
  }
}

export class BadTimezoneOffsetException extends BadRequestException {
  constructor(debugData: DebugData<BadRequestExceptionCodes>) {
    super('Bad timezone offset', {
      ...debugData,
      exceptionCode: BadRequestExceptionCodes.BAD_TIMEZONE_OFFSET,
    });
  }
}

export class UserMissingLocalizationDataException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes>) {
    super('User missing localization data', {
      ...debugData,
      exceptionCode:
        InternalServerErrorExceptionCodes.USER_MISSING_LOCALIZATION_DATA,
    });
  }
}

const isSignupWithEmailAndPasswordInput = (
  input: any
): input is SignUpWithEmailInput => {
  return input.email !== undefined && input.password !== undefined;
};
