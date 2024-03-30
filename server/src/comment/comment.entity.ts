import {
  getParticipationTypeEnumFrom,
  getParticipationTypeValueFrom,
} from '../common/participationType';
import { ContentIO } from '../content/content.io';
import { FeedEntity } from '../feed/feed.entity';
import { ParticipationType } from '../generated-graphql';
import { PostEntity } from '../post/post.entity';
import { UserEntity } from '../user/user.entity';
import { ExistenceState } from '../existenceStateEnum';
import { ActivityObjectType } from '../activity/activity';
import { ActivityData } from '../activity/activity-common';
import { ChallengeEntity } from '../challenge/challenge-data-objects/challenge.entity';

export enum CommentScopeType {
  NONE = -1,
  ALL = 0,
  FRIENDS = 1,
}

export class CommentEntityStats {
  likeCount: number;
  shareCount: number;
  replyCount: number;
  reportCount: number;
}

export interface CommentFlag {
  flaggedByUserId: string;
  flaggedAt: Date;
}

export interface CommentFlagMeta {
  flags: CommentFlag[];
}

const emptyStats = (): CommentEntityStats => {
  return {
    likeCount: 0,
    shareCount: 0,
    replyCount: 0,
    reportCount: 0,
  };
};

export class CommentEntity {
  static readonly kAuthorRelation = 'author';
  static readonly kPostRelation = 'post';
  static readonly kChallengeRelation = 'challenge';

  id: string;
  authorId: string;
  author?: UserEntity;
  createdAt: Date;
  updatedAt: Date;
  content: ContentIO;
  postId?: string;
  post?: PostEntity;
  replyFeedId: string;
  replyFeed?: FeedEntity;
  _stats: CommentEntityStats;
  _participationType: number;
  flagMeta?: CommentFlagMeta;
  willBeDeleted: boolean;
  hasRequestedForRepliesDeletion?: boolean;
  body: string;
  activityData: ActivityData;
  negativeConfidenceValue?: number;
  state?: number;
  challengeId?: string;
  challenge?: ChallengeEntity;

  constructor() {
    this.id = '';
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this._stats = emptyStats();
    this._participationType = 1;
    this.activityData = { type: 'ActivityData' };
  }

  get stats(): CommentEntityStats {
    return this._stats ? this._stats : emptyStats();
  }

  set stats(stats: CommentEntityStats) {
    this._stats = stats;
  }

  get existenceState(): ExistenceState {
    return this.state ? this.state : ExistenceState.ALIVE;
  }

  set existenceState(stats: ExistenceState) {
    this.state = Number(Object.keys(ExistenceState)[stats]);
  }

  /**
   * @deprecated Update like count by using the current length of the like
   * reaction feed
   */
  incrementLikes() {
    this.stats = { ...this.stats, likeCount: this.stats.likeCount + 1 };
  }

  /**
   * @deprecated Update like count by using the current length of the like
   * reaction feed
   */
  decrementLikes() {
    this.stats = {
      ...this.stats,
      likeCount: Math.max(this.stats.likeCount - 1, 0),
    };
  }

  incrementReportCount() {
    this.stats = { ...this.stats, reportCount: this.stats.reportCount + 1 };
  }

  decrementReportCount() {
    this.stats = {
      ...this.stats,
      reportCount: Math.max(this.stats.reportCount - 1, 0),
    };
  }

  setParticipationType(type: ParticipationType) {
    this._participationType = getParticipationTypeValueFrom(type);
  }

  getParticipationType(): ParticipationType {
    return getParticipationTypeEnumFrom(this._participationType);
  }

  softDelete() {
    this.willBeDeleted = true;
  }

  get objectType(): ActivityObjectType {
    return ActivityObjectType.COMMENT;
  }
}

export interface CommentEntityWithAuthor extends CommentEntity {
  author: UserEntity;
}

export interface CommentEntityWithPost extends CommentEntity {
  post: PostEntity;
}

export interface CommentEntityWithChallenge extends CommentEntity {
  challenge: ChallengeEntity;
}

export type CommentEntityWithAuthorAndPost = CommentEntityWithAuthor &
  CommentEntityWithPost;
