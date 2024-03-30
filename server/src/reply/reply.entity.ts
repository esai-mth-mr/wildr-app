import { ActivityObjectType } from '../activity/activity';
import { ActivityData } from '../activity/activity-common';
import { CommentEntity } from '../comment/comment.entity';
import { ContentIO } from '../content/content.io';
import { ExistenceState } from '../existenceStateEnum';
import { UserEntity } from '../user/user.entity';

export class ReplyEntityStats {
  likeCount: number;
  reportCount: number;
}

const emptyStats = (): ReplyEntityStats => {
  return {
    likeCount: 0,
    reportCount: 0,
  };
};

export class ReplyEntity {
  static readonly kAuthorRelation = 'author';
  static readonly kCommentRelation = 'comment';

  id: string;
  authorId: string;
  author?: UserEntity;
  createdAt: Date;
  updatedAt: Date;
  content: ContentIO;
  comment?: CommentEntity;
  commentId: string;
  _stats: ReplyEntityStats;
  willBeDeleted: boolean;
  body: string;
  activityData?: ActivityData;
  negativeConfidenceValue?: number;
  state?: number;

  constructor() {
    this.id = '';
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this._stats = emptyStats();
  }

  get stats(): ReplyEntityStats {
    return this._stats ? this._stats : emptyStats();
  }

  set stats(stats: ReplyEntityStats) {
    this._stats = stats;
  }

  get existenceState(): ExistenceState {
    return this.state ? this.state : ExistenceState.ALIVE;
  }

  set existenceState(stats: ExistenceState) {
    this.state = Number(Object.keys(ExistenceState)[stats]);
  }

  incrementLikes() {
    this.stats = { ...this.stats, likeCount: this.stats.likeCount + 1 };
  }

  decrementLikes() {
    this.stats = { ...this.stats, likeCount: this.stats.likeCount - 1 };
  }

  incrementReportCount() {
    this.stats = { ...this.stats, reportCount: this.stats.reportCount + 1 };
  }

  decrementReportCount() {
    this.stats = {
      ...this.stats,
      reportCount: Math.min(this.stats.reportCount - 1, 0),
    };
  }

  get objectType(): ActivityObjectType {
    return ActivityObjectType.REPLY;
  }
}

export interface ReplyEntityWithParentComment extends ReplyEntity {
  comment: CommentEntity;
}

export interface ReplyEntityWithAuthor extends ReplyEntity {
  author: UserEntity;
}

export type ReplyEntityWithCommentAndAuthor = ReplyEntityWithParentComment &
  ReplyEntityWithAuthor;
