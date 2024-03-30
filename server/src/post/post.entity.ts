import { ActivityObjectType } from '@verdzie/server/activity/activity';
import { ActivityData } from '@verdzie/server/activity/activity-common';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import { ContentIO } from '@verdzie/server/content/content.io';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import { ReactionType } from '@verdzie/server/generated-graphql';
import { SensitiveStatus } from '@verdzie/server/post/data/sensitive-status';
import { ReportData } from '@verdzie/server/report/reportData';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { PostDeleteStats } from '@verdzie/server/post/postDeleteStats';
import {
  FileProperties,
  ImagePostProperties,
  TextPostProperties,
  UnknownPostProperties,
  VideoPostProperties,
} from '@verdzie/server/post/postProperties';
import { PostEntityStats as PostStats } from '@verdzie/server/post/postStats';
import { PostAccessControl } from '@verdzie/server/post/postAccessControl';
import { RepostMeta } from '@verdzie/server/post/repostMeta';
import { generateId } from '@verdzie/server/common/generateId';
import { PostBaseType } from '@verdzie/server/post/postBaseType.enum';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';

export class PostEntity {
  static readonly kTableName = 'post_entity';
  static readonly kEntityName = 'PostEntity';
  static readonly kAuthorRelation = 'author';
  static readonly kParentChallengeRelation = 'parentChallenge';
  static readonly kPinnedCommentRelation = 'pinnedComment';
  static readonly kRealReactionFeedRelation = 'realReactionFeed';
  static readonly kApplaudReactionFeedRelation = 'applaudReactionFeed';
  static readonly kLikeReactionFeedRelation = 'likeReactionFeed';

  static readonly kFields = {
    id: 'id',
    type: 'type',
    baseType: 'base_type',
    authorId: 'author_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    expiry: 'expiry',
    commentFeedId: 'comment_feed_id',
    pinnedCommentId: 'pinned_comment_id',
    commentScopeType: 'comment_scope_type',
    properties: 'post_properties',
    multiPostProperties: 'multi_post_properties',
    _stats: 'stats',
    captionBodyStr: 'bodyStr',
    caption: 'caption',
    thumbnailFile: 'thumbnail_file',
    activityData: 'activity_data',
    wasBypassed: 'was_bypassed',
    captionNegativeConfidenceValue: 'caption_negative_confidence_value',
    willBeDeleted: 'will_be_deleted',
    deleteStatus: 'delete_status',
    isPrivate: 'is_private',
    realReactionFeedId: 'real_reaction_feed_id',
    applaudReactionFeedId: 'applaud_reaction_feed_id',
    likeReactionFeedId: 'like_reaction_feed_id',
    categoryIds: 'post_category_ids',
    state: 'state',
    sensitiveStatus: 'sensitive_status',
    accessControl: 'access_control',
    repostMeta: 'repost_meta',
    parentChallengeId: 'parent_challenge_id',
  };

  id: string;
  type: number;
  baseType?: number;
  properties:
    | UnknownPostProperties
    | TextPostProperties
    | ImagePostProperties
    | VideoPostProperties;
  multiPostProperties: (
    | TextPostProperties
    | ImagePostProperties
    | VideoPostProperties
  )[];
  authorId: string;
  author?: UserEntity;
  createdAt: Date;
  updatedAt: Date;
  expiry?: Date;
  commentFeedId: string;
  pinnedCommentId: string | null;
  pinnedComment?: CommentEntity;
  commentScopeType: number; //0 = ALL, -1 = NONE, 1 = "Friends"
  _stats: PostStats;
  captionBodyStr: string;
  caption?: ContentIO;
  thumbnailFile?: FileProperties;
  activityData: ActivityData;
  wasBypassed: boolean;
  captionNegativeConfidenceValue?: number;
  willBeDeleted?: boolean;
  deleteStatus?: PostDeleteStats;
  isPrivate: boolean;
  realReactionFeed?: FeedEntity;
  realReactionFeedId?: string;
  applaudReactionFeed?: FeedEntity;
  applaudReactionFeedId?: string;
  likeReactionFeed?: FeedEntity;
  likeReactionFeedId?: string;
  categoryIds?: string[];
  reportData: ReportData;
  state?: number;
  sensitiveStatus?: SensitiveStatus;
  accessControl?: PostAccessControl;
  repostMeta?: RepostMeta;
  parentChallengeId?: string;
  parentChallenge?: ChallengeEntity;

  constructor() {
    this.id = '';
    this.type = 0;
    this.multiPostProperties = [];
    this.properties = { type: 'UnknownPostProperties' };
    this.activityData = { type: 'ActivityData' };
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.commentFeedId = '';
    this.captionBodyStr = '';
    this.baseType = PostBaseType.POST;
  }

  static createRepost(parentPost: PostEntity): PostEntity {
    const repost = new PostEntity();
    repost.id = generateId();
    repost.repostMeta = { parentPostId: parentPost.id };
    repost.type = parentPost.type;
    repost.thumbnailFile = parentPost.thumbnailFile;
    repost.baseType = PostBaseType.REPOST;
    repost.sensitiveStatus = parentPost.sensitiveStatus;
    return repost;
  }

  get stats(): PostStats {
    return this._stats ? this._stats : emptyStats();
  }

  set stats(stats: PostStats) {
    this._stats = stats;
  }

  get existenceState(): ExistenceState {
    return this.state ? this.state : ExistenceState.ALIVE;
  }

  set existenceState(stats: ExistenceState) {
    this.state = Number(Object.keys(ExistenceState)[stats]);
  }

  /**
   * @deprecated Add entry to reactions_feed instead
   */
  incrementReaction(reaction: ReactionType) {
    switch (reaction) {
      case ReactionType.REAL:
        this.stats = { ...this.stats, realCount: this.stats.realCount + 1 };
        break;
      case ReactionType.APPLAUD:
        this.stats = {
          ...this.stats,
          applauseCount: this.stats.applauseCount + 1,
        };
        break;
      case ReactionType.LIKE:
        this.stats = { ...this.stats, likeCount: this.stats.likeCount + 1 };
        break;
    }
  }

  /**
   * @deprecated remove entry from reactions_feed instead
   */
  decrementReaction(reaction: ReactionType) {
    switch (reaction) {
      case ReactionType.UN_REAL:
      case ReactionType.REAL:
        this.stats = { ...this.stats, realCount: this.stats.realCount - 1 };
        break;
      case ReactionType.UN_APPLAUD:
      case ReactionType.APPLAUD:
        this.stats = {
          ...this.stats,
          applauseCount: this.stats.applauseCount - 1,
        };
        break;
      case ReactionType.UN_LIKE:
      case ReactionType.LIKE:
        this.stats = { ...this.stats, likeCount: this.stats.likeCount - 1 };
        break;
    }
  }

  setReactionCount(reaction: ReactionType, count: number) {
    switch (reaction) {
      case ReactionType.UN_REAL:
      case ReactionType.REAL:
        this.stats = { ...this.stats, realCount: count };
        break;
      case ReactionType.UN_APPLAUD:
      case ReactionType.APPLAUD:
        this.stats = { ...this.stats, applauseCount: count };
        break;
      case ReactionType.UN_LIKE:
      case ReactionType.LIKE:
        this.stats = { ...this.stats, likeCount: count };
        break;
    }
  }

  isRepost(): boolean {
    return (
      this.baseType === PostBaseType.REPOST ||
      this.baseType === PostBaseType.REPOST_STORY
    );
  }

  isParentPostDeleted(): boolean {
    return this.repostMeta?.isParentPostDeleted ?? false;
  }

  incrementLikes() {
    this.stats = { ...this.stats, likeCount: this.stats.likeCount + 1 };
  }

  decrementLikes() {
    this.stats = { ...this.stats, likeCount: this.stats.likeCount - 1 };
  }

  incrementReposts() {
    this.stats = { ...this.stats, repostCount: this.stats.repostCount + 1 };
  }

  incrementShares() {
    this.stats = { ...this.stats, shareCount: this.stats.shareCount + 1 };
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
    return ActivityObjectType.POST;
  }

  getBaseType(): PostBaseType {
    if (this.baseType) return this.baseType;
    if (this.expiry) return PostBaseType.STORY;
    return PostBaseType.POST;
  }

  static fromRaw(rawPost: any) {
    const post = new PostEntity();
    for (const [key, value] of Object.entries(PostEntity.kFields)) {
      // @ts-ignore
      post[key] = rawPost[value];
    }
    return post;
  }
}

function emptyStats(): PostStats {
  return {
    likeCount: 0,
    realCount: 0,
    applauseCount: 0,
    shareCount: 0,
    repostCount: 0,
    commentCount: 0,
    reportCount: 0,
  };
}
