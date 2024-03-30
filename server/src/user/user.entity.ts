import { ActivityObjectType } from '../activity/activity';
import * as bcrypt from 'bcrypt';
import { formatISO } from 'date-fns';
import { last, min } from 'lodash';
import { ActivityStreamEntity } from '../activity-stream/activity.stream.entity';
import { ActivityData } from '../activity/activity-common';
import { ExistenceState } from '../existenceStateEnum';
import { FeedEntity } from '../feed/feed.entity';
import {
  RealIdFaceData,
  RealIdFailedVerificationImageData,
  RealIdVerificationStatus,
} from '../real-id/realId';
import { UserScoreDataRelatedActionEnum } from '../worker/score-data/scoreData.producer';
import { VisibilityPreferences } from '@verdzie/server/user/data/userListVisibility';
import { fromUserJoinedChallengeString } from '@verdzie/server/challenge/userJoinedChallenges.helper';
import { Result, err, ok } from 'neverthrow';
import {
  BadRequestException,
  BadRequestExceptionCodes,
  DebugData,
} from '@verdzie/server/exceptions/wildr.exception';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import {
  KeyValuePair,
  LinkSourceType,
} from '@verdzie/server/generated-graphql';
import { keyValuePairArrayToObject } from '@verdzie/server/common';

export const FIRST_STRIKE_COOLDOWN_DAYS = 30;
export const SECOND_STRIKE_COOLDOWN_DAYS = 60;
export const THIRD_STRIKE_COOLDOWN_DAYS = 90;

type UserProperties = {
  [Key in keyof Required<UserEntity>]: Key;
};

export class UserEntity {
  static readonly kTableName = 'user_entity';
  static readonly kFollowingFeedRelation = 'followingFeed';
  static readonly kFollowerFeedRelation = 'followerFeed';
  static readonly kLikeReactionFeed = 'likeReactionOnPostFeed';
  static readonly kRealReactionFeed = 'realReactionOnPostFeed';
  static readonly kApplaudReactionFeed = 'applaudReactionOnPostFeed';
  static readonly kPostFeedRelation = 'postFeed';
  static readonly kReportCommentRelation = 'reportComment';
  static readonly kReportReplyRelation = 'reportReply';
  static readonly kReportPostRelation = 'reportPost';
  static readonly kActivityStreamRelation = 'activityStream';
  static readonly kBlockListRelation = 'blockList';
  static readonly kRedeemedInviteCode = 'redeemedInviteCode';

  static readonly kFields: UserProperties = {
    id: 'id',
    firebaseUID: 'firebaseUID',
    handle: 'handle',
    phoneNumber: 'phoneNumber',
    name: 'name',
    email: 'email',
    password: 'password',
    avatarImage: 'avatarImage',
    gender: 'gender',
    bio: 'bio',
    pronoun: 'pronoun',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    followerFeedId: 'followerFeedId',
    followerFeed: 'followerFeed',
    followingFeedId: 'followingFeedId',
    followingFeed: 'followingFeed',
    likeReactionOnPostFeedId: 'likeReactionOnPostFeedId',
    likeReactionOnPostFeed: 'likeReactionOnPostFeed',
    realReactionOnPostFeedId: 'realReactionOnPostFeedId',
    realReactionOnPostFeed: 'realReactionOnPostFeed',
    applaudReactionOnPostFeedId: 'applaudReactionOnPostFeedId',
    applaudReactionOnPostFeed: 'applaudReactionOnPostFeed',
    _stats: '_stats',
    reportCommentFeedId: 'reportCommentFeedId',
    reportCommentFeed: 'reportCommentFeed',
    reportReplyFeedId: 'reportReplyFeedId',
    reportReplyFeed: 'reportReplyFeed',
    reportPostFeedId: 'reportPostFeedId',
    reportPostFeed: 'reportPostFeed',
    activityStreamId: 'activityStreamId',
    activityStream: 'activityStream',
    activityData: 'activityData',
    fcmToken: 'fcmToken',
    blockListFeedId: 'blockListFeedId',
    blockListFeed: 'blockListFeed',
    commentEnabledAt: 'commentEnabledAt',
    commentOnboardedAt: 'commentOnboardedAt',
    deleteRequestedAt: 'deleteRequestedAt',
    lastSeenCursorPersonalizedFeed: 'lastSeenCursorPersonalizedFeed',
    lastSeenCursorPersonalizedFollowingFeed:
      'lastSeenCursorPersonalizedFollowingFeed',
    exploreFeedUpdatedAt: 'exploreFeedUpdatedAt',
    exploreFeedRefreshedAt: 'exploreFeedRefreshedAt',
    subFeedUpdatedAt: 'subFeedUpdatedAt',
    hasConsumedExploreFeed: 'hasConsumedExploreFeed',
    hasConsumedPersonalizedFollowingsFeed:
      'hasConsumedPersonalizedFollowingsFeed',
    followingUsersAllPostsFeedId: 'followingUsersAllPostsFeedId',
    followingUsersTextPostsFeedId: 'followingUsersTextPostsFeedId',
    followingUsersImagePostsFeedId: 'followingUsersImagePostsFeedId',
    followingUsersVideoPostsFeedId: 'followingUsersVideoPostsFeedId',
    followingUsersMultiMediaPostsFeedId: 'followingUsersMultiMediaPostsFeedId',
    strikeData: 'strikeData',
    currentScoreData: 'currentScoreData',
    totalPreviousScoreData: 'totalPreviousScoreData',
    previousScoreData: 'previousScoreData',
    scoreDataLastArchivedAt: 'scoreDataLastArchivedAt',
    score: 'score',
    isSuspended: 'isSuspended',
    lastSuspendedAt: 'lastSuspendedAt',
    suspensionExpirationTS: 'suspensionExpirationTS',
    inviteCount: 'inviteCount',
    redeemedInviteCodeId: 'redeemedInviteCodeId',
    realIdVerificationStatus: 'realIdVerificationStatus',
    realIdFaceData: 'realIdFaceData',
    realIdFaceUrl: 'realIdFaceUrl',
    realIdFailedVerificationImageData: 'realIdFailedVerificationImageData',
    realIdVerifiedAt: 'realIdVerifiedAt',
    realIdFailedStatusMessage: 'realIdFailedStatusMessage',
    state: 'state',
    didFinishOnboarding: 'didFinishOnboarding',
    onboardingStats: 'onboardingStats',
    visibilityPreferences: 'visibilityPreferences',
    birthday: 'birthday',
    challengeContext: 'challengeContext',
    localizationData: 'localizationData',
    feedCursors: 'feedCursors',
    signupData: 'signupData',
    bannerData: 'bannerData',
    refererId: 'refererId',
    wildrcoinData: 'wildrcoinData',
    // Methods
    setPassword: 'setPassword',
    checkPassword: 'checkPassword',
    isTakenDown: 'isTakenDown',
    isAlive: 'isAlive',
    existenceState: 'existenceState',
    updateTotalScore: 'updateTotalScore',
    objectType: 'objectType',
    archiveCurrentScore: 'archiveCurrentScore',
    updateScore: 'updateScore',
    addStrike: 'addStrike',
    addSuspension: 'addSuspension',
    setStats: 'setStats',
    getStats: 'getStats',
    getComputedStats: 'getComputedStats',
    incrementPostCount: 'incrementPostCount',
    decrementPostCount: 'decrementPostCount',
    incrementFollowerCount: 'incrementFollowerCount',
    decrementFollowerCount: 'decrementFollowerCount',
    incrementFollowingCount: 'incrementFollowingCount',
    decrementFollowingCount: 'decrementFollowingCount',
    incrementInnerCircleCount: 'incrementInnerCircleCount',
    decrementInnerCircleCount: 'decrementInnerCircleCount',
    joinWildrCoinWaitlist: 'joinWildrCoinWaitlist',
    isOnWildrCoinWaitlist: 'isOnWildrCoinWaitlist',
    skipBanner: 'skipBanner',
    completeBanner: 'completeBanner',
    addLinkData: 'addLinkData',
  };

  static readonly kStatsFields = {
    followerCount: 'followerCount',
    followingCount: 'followingCount',
    postCount: 'postCount',
    innerCircleCount: 'innerCircleCount',
  };

  id: string;
  firebaseUID: string;
  handle: string;
  phoneNumber: string | undefined;
  name: string;
  email?: string;
  // WARNING: Do not set property directly, it is public for TypeORM.
  password: string;
  avatarImage?: string;
  gender: number;
  bio?: string;
  pronoun?: string;
  createdAt: Date;
  updatedAt: Date;
  followerFeedId?: string;
  followerFeed?: FeedEntity;
  followingFeedId?: string;
  followingFeed?: FeedEntity;
  likeReactionOnPostFeedId?: string;
  likeReactionOnPostFeed?: FeedEntity;
  realReactionOnPostFeedId?: string;
  realReactionOnPostFeed?: FeedEntity;
  applaudReactionOnPostFeedId?: string;
  applaudReactionOnPostFeed?: FeedEntity;
  _stats?: UserEntityStats;
  reportCommentFeedId?: string;
  reportCommentFeed?: FeedEntity;
  reportReplyFeedId?: string;
  reportReplyFeed?: FeedEntity;
  reportPostFeedId?: string;
  reportPostFeed?: FeedEntity;
  activityStreamId?: string;
  activityStream?: ActivityStreamEntity;
  activityData: ActivityData;
  fcmToken?: string;
  blockListFeedId?: string;
  blockListFeed?: FeedEntity;
  commentEnabledAt?: Date;
  commentOnboardedAt?: Date;
  deleteRequestedAt?: Date;
  lastSeenCursorPersonalizedFeed?: string;
  lastSeenCursorPersonalizedFollowingFeed?: string;
  exploreFeedUpdatedAt?: Date;
  exploreFeedRefreshedAt?: Date;
  subFeedUpdatedAt?: Date;
  hasConsumedExploreFeed?: boolean;
  hasConsumedPersonalizedFollowingsFeed?: boolean;
  followingUsersAllPostsFeedId?: string;
  followingUsersTextPostsFeedId?: string;
  followingUsersImagePostsFeedId?: string;
  followingUsersVideoPostsFeedId?: string;
  followingUsersMultiMediaPostsFeedId?: string;
  //Strike
  strikeData?: UserStrikeData;
  currentScoreData?: ScoreData;
  totalPreviousScoreData?: ScoreData;
  previousScoreData?: PreviousScoreData;
  scoreDataLastArchivedAt?: Date;
  score: number;
  isSuspended: boolean;
  lastSuspendedAt?: Date;
  suspensionExpirationTS?: Date;
  inviteCount?: number;
  redeemedInviteCodeId?: string;
  // redeemedInviteCode?: InviteCodeEntity;
  //Real ID
  realIdVerificationStatus: RealIdVerificationStatus;
  realIdFaceData?: RealIdFaceData;
  realIdFaceUrl?: string;
  realIdFailedVerificationImageData?: RealIdFailedVerificationImageData[];
  realIdVerifiedAt?: Date;
  realIdFailedStatusMessage?: string;
  state?: number;
  didFinishOnboarding?: boolean; //Category interests
  onboardingStats?: UserOnboarding;
  visibilityPreferences?: VisibilityPreferences;
  birthday?: Date;
  challengeContext?: UserChallengeContext;
  localizationData?: UserLocalizationData;
  feedCursors?: UserFeedCursors;
  signupData?: UserSignupData;
  bannerData?: UserBannerData;
  refererId?: string;
  wildrcoinData?: UserWildrcoinData;

  constructor() {
    this.id = '';
    this.handle = '';
    this.name = '';
    this.email = '';
    this.phoneNumber = undefined;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this._stats = emptyUserStats();
    this.activityData = { type: 'ActivityData' };
    this.commentEnabledAt = undefined;
    this.commentOnboardedAt = undefined;
    this.onboardingStats = { innerCircle: false };
  }

  async setPassword(password: string) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(password, saltRounds);
  }

  async checkPassword(pwd: string): Promise<boolean> {
    return await bcrypt.compare(pwd, this.password);
  }

  setStats(
    stats: Partial<
      Pick<
        UserEntityStats,
        'followerCount' | 'followingCount' | 'innerCircleCount' | 'postCount'
      >
    >
  ) {
    if (!this._stats) this._stats = emptyUserStats();
    if (stats.followerCount) {
      this._stats.followerCount = Math.max(stats.followerCount, 0);
    }
    if (stats.followingCount) {
      this._stats.followingCount = Math.max(stats.followingCount, 0);
    }
    if (stats.postCount) {
      this._stats.postCount = Math.max(stats.postCount, 0);
    }
    if (stats.innerCircleCount) {
      this._stats.innerCircleCount = Math.max(stats.innerCircleCount, 0);
    }
  }

  getStats(): UserEntityStats {
    if (!this._stats) this._stats = emptyUserStats();
    return this._stats;
  }

  getComputedStats(): UserEntityComputedStats {
    return {
      ...emptyUserStats(),
      ...this._stats,
      joinedChallengesCount:
        this.challengeContext?.joinedChallenges
          ?.map(str => {
            return fromUserJoinedChallengeString(str);
          })
          .filter(entry => entry?.joinedAt !== undefined).length || 0,
      createdChallengesCount:
        this.challengeContext?.joinedChallenges
          ?.map(str => {
            return fromUserJoinedChallengeString(str);
          })
          .filter(entry => entry?.authorId === this.id).length || 0,
    };
  }

  incrementPostCount() {
    this.setStats({ postCount: this.getStats().postCount + 1 });
  }

  decrementPostCount() {
    this.setStats({ postCount: this.getStats().postCount - 1 });
  }

  incrementFollowerCount() {
    this.setStats({ followerCount: this.getStats().followerCount + 1 });
  }

  decrementFollowerCount() {
    this.setStats({ followerCount: this.getStats().followerCount - 1 });
  }

  incrementFollowingCount() {
    this.setStats({ followingCount: this.getStats().followingCount + 1 });
  }

  decrementFollowingCount() {
    this.setStats({ followingCount: this.getStats().followingCount - 1 });
  }

  incrementInnerCircleCount() {
    this.setStats({ innerCircleCount: this.getStats().innerCircleCount + 1 });
  }

  decrementInnerCircleCount() {
    this.setStats({ innerCircleCount: this.getStats().innerCircleCount - 1 });
  }

  isTakenDown(): boolean {
    return this.existenceState === ExistenceState.TAKEN_DOWN;
  }

  isAlive() {
    return (
      this.existenceState === undefined ||
      this.existenceState === ExistenceState.ALIVE
    );
  }

  get existenceState(): ExistenceState {
    return this.state ? this.state : ExistenceState.ALIVE;
  }

  set existenceState(stats: ExistenceState) {
    this.state = Number(Object.keys(ExistenceState)[stats]);
  }

  updateTotalScore() {
    if (!this.totalPreviousScoreData)
      this.totalPreviousScoreData = getEmptyScoreData();
    if (!this.currentScoreData) this.currentScoreData = getEmptyScoreData();
    const cur = this.currentScoreData;
    const prev = this.totalPreviousScoreData;
    this.totalPreviousScoreData = {
      realReactions: cur.realReactions + prev.realReactions,
      applaudReactions: cur.applaudReactions + prev.applaudReactions,
      likeReactions: cur.likeReactions + prev.likeReactions,
      gainedFollowers: cur.gainedFollowers + prev.gainedFollowers,
      lostFollowers: cur.lostFollowers + prev.lostFollowers,
      postsReposted: cur.postsReposted + prev.postsReposted,
      receivedPostReports: cur.receivedPostReports + prev.receivedPostReports,
      receivedCommentReports:
        cur.receivedCommentReports + prev.receivedCommentReports,
      receivedReplyReports:
        cur.receivedReplyReports + prev.receivedReplyReports,
      sentReports: cur.sentReports + prev.sentReports,
      sentFalseReports: cur.sentFalseReports + prev.sentFalseReports,
    };
  }

  get objectType(): ActivityObjectType {
    return ActivityObjectType.USER;
  }

  archiveCurrentScore(date: Date) {
    this.scoreDataLastArchivedAt = date;
    if (!this.previousScoreData) {
      this.previousScoreData = { entries: {} };
      this.totalPreviousScoreData = getEmptyScoreData();
    }
    if (!this.currentScoreData) {
      this.currentScoreData = getEmptyScoreData();
      return;
    }
    this.previousScoreData.entries[formatISO(this.scoreDataLastArchivedAt)] =
      this.currentScoreData;
    this.currentScoreData = getEmptyScoreData();
  }

  updateScore(action: UserScoreDataRelatedActionEnum) {
    if (!this.currentScoreData) this.currentScoreData = getEmptyScoreData();
    const scoreDiffUpdate = 0.01;
    switch (action) {
      case UserScoreDataRelatedActionEnum.REC_REAL_REACTION:
        this.currentScoreData.realReactions += 0.1;
        break;
      case UserScoreDataRelatedActionEnum.REC_APPLAUD_REACTION:
        this.currentScoreData.applaudReactions += 0.1;
        break;
      case UserScoreDataRelatedActionEnum.REC_LIKE_REACTION:
        this.currentScoreData.likeReactions += 0.1;
        this.score += scoreDiffUpdate;
        break;
      case UserScoreDataRelatedActionEnum.REC_UN_REAL_REACTION:
        this.currentScoreData.realReactions -= 0.1;
        this.score -= scoreDiffUpdate;
        break;
      case UserScoreDataRelatedActionEnum.REC_UN_APPLAUD_REACTION:
        this.currentScoreData.applaudReactions -= 0.1;
        break;
      case UserScoreDataRelatedActionEnum.REC_UN_LIKE_REACTION:
        this.currentScoreData.likeReactions -= 0.1;
        break;
      case UserScoreDataRelatedActionEnum.FOLLOWER_GAINED:
        this.currentScoreData.gainedFollowers += 0.1;
        this.score += scoreDiffUpdate;
        break;
      case UserScoreDataRelatedActionEnum.FOLLOWER_LOST:
        this.currentScoreData.lostFollowers += 0.1;
        this.score -= scoreDiffUpdate;
        break;
      case UserScoreDataRelatedActionEnum.REC_POST_REPOST:
        this.currentScoreData.postsReposted += 0.1;
        this.score += scoreDiffUpdate;
        break;
      case UserScoreDataRelatedActionEnum.REC_REPORT_POST:
        this.currentScoreData.receivedPostReports -= 0.1;
        break;
      case UserScoreDataRelatedActionEnum.REC_REPORT_COMMENT:
        this.currentScoreData.receivedCommentReports -= 0.1;
        break;
      case UserScoreDataRelatedActionEnum.REC_REPORT_REPLY:
        this.currentScoreData.receivedReplyReports -= 0.1;
        break;
      case UserScoreDataRelatedActionEnum.REPORTED_SOMEONE:
        this.currentScoreData.sentReports += 0.1;
        break;
      case UserScoreDataRelatedActionEnum.FALSE_REPORTED_SOMEONE:
        this.currentScoreData.sentFalseReports -= 0.1;
        break;
    }
  }

  addStrike(currentTime: Date) {
    if (!this.strikeData) {
      this.strikeData = {
        isSuspended: false,
        currentStrikeCount: 0,
        firstStrikeCount: 0,
        secondStrikeCount: 0,
        thirdStrikeCount: 0,
        permanentSuspensionCount: 0,
      };
    }
    switch (this.strikeData.currentStrikeCount) {
      case 0:
        this.score = min([3.0, this.score ?? 3.0])!;
        this.strikeData.currentStrikeCount = 1;
        this.strikeData.firstStrikeCount += 1;
        this.strikeData.firstStrikeTS = currentTime;
        currentTime.setDate(currentTime.getDate() + FIRST_STRIKE_COOLDOWN_DAYS);
        this.strikeData.firstStrikeExpiryTS = currentTime;
        this.suspensionExpirationTS = currentTime;
        break;
      case 1:
        this.score = min([1.0, this.score ?? 1.0])!;
        this.strikeData.currentStrikeCount = 2;
        this.strikeData.secondStrikeCount += 1;
        this.strikeData.secondStrikeTS = currentTime;
        currentTime.setDate(
          currentTime.getDate() + SECOND_STRIKE_COOLDOWN_DAYS
        );
        this.suspensionExpirationTS = currentTime;
        this.strikeData.secondStrikeExpiryTS = currentTime;
        currentTime.setDate(currentTime.getDate() + FIRST_STRIKE_COOLDOWN_DAYS);
        this.strikeData.firstStrikeExpiryTS = currentTime;
        break;
      case 2: //By now, the user will be kicked out
        this.score = 0;
        this.strikeData.currentStrikeCount = 3;
        this.strikeData.thirdStrikeCount += 1;
        this.strikeData.thirdStrikeTS = currentTime;
        if (!this.strikeData.finalStrikeTimeStamps) {
          this.strikeData.finalStrikeTimeStamps = [];
        }
        this.strikeData.finalStrikeTimeStamps.push(currentTime);
        currentTime.setDate(currentTime.getDate() + THIRD_STRIKE_COOLDOWN_DAYS);
        this.strikeData.thirdStrikeExpiryTS = currentTime;
        this.suspensionExpirationTS = currentTime;
        this.strikeData.secondStrikeExpiryTS = undefined;
        this.strikeData.firstStrikeExpiryTS = undefined;
        this.strikeData.isSuspended = true;
        this.strikeData.permanentSuspensionCount += 1;
        break;
    }
    this.addSuspension();
  }

  addSuspension() {
    this.isSuspended = true;
  }

  joinWildrCoinWaitlist(): Result<
    boolean,
    AlreadyJoinedWildrcoinWaitlistException
  > {
    if (!this.wildrcoinData) {
      this.wildrcoinData = {};
    }
    if (!this.wildrcoinData.waitlistParticipationEvents) {
      this.wildrcoinData.waitlistParticipationEvents = [];
    }
    const latestEvent = last(this.wildrcoinData.waitlistParticipationEvents);
    if (isWildrcoinWaitlistJoinEvent(latestEvent)) {
      return err(new AlreadyJoinedWildrcoinWaitlistException());
    }
    this.wildrcoinData.waitlistParticipationEvents.push({
      __typename: 'WildrcoinWaitlistJoinEvent',
      createdAt: new Date().toISOString(),
    });
    const bannerIds =
      SSMParamsService.Instance.bannerParams.WILDR_COIN_WAITLIST_BANNER_IDS;
    bannerIds.forEach(bannerId => this.completeBanner({ bannerId }));
    return ok(true);
  }

  isOnWildrCoinWaitlist(): boolean {
    if (!this.wildrcoinData) {
      return false;
    }
    if (!this.wildrcoinData.waitlistParticipationEvents) {
      return false;
    }
    const recentEvent = last(this.wildrcoinData.waitlistParticipationEvents);
    return isWildrcoinWaitlistJoinEvent(recentEvent);
  }

  skipBanner({ bannerId }: { bannerId: string }) {
    if (!this.bannerData) {
      this.bannerData = {
        bannerInteractions: {},
      };
    }
    if (!this.bannerData.bannerInteractions[bannerId]) {
      this.bannerData.bannerInteractions[bannerId] = {
        skipCount: 1,
        lastSkippedAt: new Date().toISOString(),
      };
      return;
    }
    this.bannerData.bannerInteractions[bannerId].skipCount += 1;
    this.bannerData.bannerInteractions[bannerId].lastSkippedAt =
      new Date().toISOString();
  }

  completeBanner({ bannerId }: { bannerId: string }) {
    if (!this.bannerData) {
      this.bannerData = {
        bannerInteractions: {},
      };
    }
    if (!this.bannerData.bannerInteractions[bannerId]) {
      this.bannerData.bannerInteractions[bannerId] = {
        skipCount: 0,
        lastSkippedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      return;
    }
    this.bannerData.bannerInteractions[bannerId].completedAt =
      new Date().toISOString();
  }

  addLinkData({
    linkId,
    refererId,
    pseudoUserId,
    sourceId,
    sourceType,
    otherParams,
  }: {
    linkId: string;
    pseudoUserId: string;
    refererId: string;
    sourceId: string;
    sourceType: LinkSourceType;
    otherParams?: KeyValuePair[];
  }) {
    this.refererId = refererId;
    this.signupData = {
      linkId,
      refererId,
      pseudoUserId,
      sourceId,
      sourceType: linkSourceTypeToUserSignupSourceType(sourceType),
      otherParams: keyValuePairArrayToObject(otherParams ?? []),
    };
  }
}

export interface UserJwtToken {
  id: string;
}

export interface UserEntityStats {
  followerCount: number;
  followingCount: number;
  postCount: number;
  innerCircleCount: number;
}

export const emptyUserStats = (): UserEntityStats => {
  return {
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    innerCircleCount: 0,
  };
};

export interface UserEntityComputedStats extends UserEntityStats {
  joinedChallengesCount: number;
  createdChallengesCount: number;
}

export interface UserLoginResult {
  jwtToken: string;
  user: UserEntity;
}

export interface UserStrikeData {
  isSuspended: boolean;
  currentStrikeCount: number;

  firstStrikeCount: number;
  firstStrikeTS?: Date;
  firstStrikeExpiryTS?: Date;

  secondStrikeCount: number;
  secondStrikeTS?: Date;
  secondStrikeExpiryTS?: Date;

  thirdStrikeCount: number;
  thirdStrikeTS?: Date;
  thirdStrikeExpiryTS?: Date;

  permanentSuspensionCount: number;
  finalStrikeTimeStamps?: Date[];

  reviewReportRequestIds?: string[];
}

export const getEmptyScoreData = (): ScoreData => {
  return {
    realReactions: 0,
    applaudReactions: 0,
    likeReactions: 0,
    gainedFollowers: 0,
    postsReposted: 0,
    lostFollowers: 0,
    receivedPostReports: 0,
    receivedCommentReports: 0,
    receivedReplyReports: 0,
    sentFalseReports: 0,
    sentReports: 0,
  };
};

export interface ScoreData {
  realReactions: number;
  applaudReactions: number;
  likeReactions: number;
  gainedFollowers: number;
  lostFollowers: number;
  postsReposted: number;
  receivedPostReports: number;
  receivedCommentReports: number;
  receivedReplyReports: number;
  sentReports: number;
  sentFalseReports: number;
}

export interface ScoreDataEntries {
  // key is ISO Date formatted via:
  // https://date-fns.org/v2.28.0/docs/formatISO
  [key: string]: ScoreData;
}

export interface PreviousScoreData {
  entries: ScoreDataEntries;
}

export interface UserOnboarding {
  /**
   * Whether the user has seen the inner circle onboarding
   */
  innerCircle?: boolean;
  /**
   * Iso date string of when the user last skipped the inner circle onboarding
   */
  innerCircleSkippedAt?: string;
  /**
   * Whether the user has seen the comment reply likes onboarding
   */
  commentReplyLikes?: boolean;
  /**
   * Iso date string of when the user last skipped the comment reply likes onboarding
   */
  commentReplyLikesSkippedAt?: string;
  /**
   * Whether the user has seen the challenges onboarding
   */
  challenges?: boolean;
  /**
   * Iso date string of when the user last skipped the challenges onboarding
   */
  challengesSkippedAt?: string;
  /**
   * Whether the user has completed the challenge author interaction onboarding
   */
  challengeAuthorInteractions?: boolean;

  challengeEducation?: boolean;
}

export interface UserChallengeContext {
  /**
   * JSON stringified array of JoinedChallengeEntry
   */
  joinedChallenges?: string[];
}

export interface UserLocalizationData {
  /**
   * The user's timezone offset in the format '-04:00'
   */
  timezoneOffset?: string;
}

export interface UserFeedCursors {
  /**
   * Post id that marks the start of old content that the user has seen on the
   * PERSONALIZED_ALL_POSTS feed.
   */
  startOfConsumed: string;
}

export interface UserSignupData {
  linkId: string;
  refererId: string;
  pseudoUserId: string;
  sourceId: string;
  sourceType: UserSignupSourceType;
  otherParams: Record<string, string>;
}

enum UserSignupSourceType {
  PROFILE = 0,
  POST = 1,
  CHALLENGE = 2,
}

export const linkSourceTypeToUserSignupSourceType = (
  linkSourceType: LinkSourceType
): UserSignupSourceType => {
  switch (linkSourceType) {
    case LinkSourceType.USER:
      return UserSignupSourceType.PROFILE;
    case LinkSourceType.POST:
      return UserSignupSourceType.POST;
    case LinkSourceType.CHALLENGE:
      return UserSignupSourceType.CHALLENGE;
    default:
      const _exhaustiveCheck: never = linkSourceType;
      return _exhaustiveCheck;
  }
};

interface BannerInteractionData {
  skipCount: number;
  lastSkippedAt: string;
  completedAt?: string;
}

export interface UserBannerData {
  bannerInteractions: {
    [bannerId: string]: BannerInteractionData;
  };
}

interface WildrcoinWaitlistJoinEvent {
  __typename: 'WildrcoinWaitlistJoinEvent';
  createdAt: string;
}

function isWildrcoinWaitlistJoinEvent(
  event: any
): event is WildrcoinWaitlistJoinEvent {
  return event?.__typename === 'WildrcoinWaitlistJoinEvent';
}

export interface UserWildrcoinData {
  waitlistParticipationEvents?: WildrcoinWaitlistJoinEvent[];
}

export class AlreadyJoinedWildrcoinWaitlistException extends BadRequestException {
  constructor(debugData: DebugData<BadRequestExceptionCodes> = {}) {
    super('user has already joined the Wildrcoin waitlist', {
      code: BadRequestExceptionCodes.ALREADY_JOINED_WILDR_COIN_WAITLIST,
      ...debugData,
    });
  }
}
