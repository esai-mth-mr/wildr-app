import { CommentEntity } from '../comment/comment.entity';
import { generateId } from '../common/generateId';
import {
  ActivityType as GqlActivityType,
  ActivityVerb as GqlActivityVerb,
} from '../generated-graphql';
import { PostEntity } from '../post/post.entity';
import { ReplyEntity } from '../reply/reply.entity';
import { UserEntity } from '../user/user.entity';
import { PerformActionArgs } from '@verdzie/server/activity/activity.service';

export class Activity {
  id: string;
  type: number; //ActivityType
  createdAt: Date;
  updatedAt?: Date;
  totalCount?: number;
  subjectIds: string[];
  objectId: string;
  objectType: number;
  /**
   * @deprecated Use postId | commentId | replyId
   * or create another variable
   */
  miscId?: string; //commentID (commented) | postId (replied)
  miscObjectType?: number;
  postId?: string;
  challengeId?: string;
  commentId?: string;
  replyId?: string;
  reportId?: string;
  postPageIndex?: number;
  verb: number;
  metaEvent: number;
  deletedIds?: string[];
  contentBody?: string;
  displayBodyStr?: string;

  static singleTypeFromArgs(args: PerformActionArgs): Activity {
    const activity = new Activity();
    activity.setType(ActivityType.SINGLE);
    activity.objectId = args.objectId;
    activity.setObjectType(args.objectType);
    activity.setVerb(args.verb);
    activity.miscId = args.miscId;
    activity.reportId = args.reportId;
    activity.createdAt = args.timeStamp;
    activity.updatedAt = args.timeStamp;
    activity.contentBody = args.contentBody;
    activity.postId = args.postId;
    activity.challengeId = args.challengeId;
    activity.commentId = args.commentId;
    activity.replyId = args.replyId;
    activity.postPageIndex = args.postPageIndex;
    return activity;
  }

  static copy(obj: Activity): Activity {
    const activity = new Activity();
    activity.id = obj.id;
    activity.type = obj.type;
    activity.createdAt = obj.createdAt;
    activity.updatedAt = obj.updatedAt;
    activity.totalCount = obj.totalCount;
    activity.subjectIds = obj.subjectIds;
    activity.objectId = obj.objectId;
    activity.objectType = obj.objectType;
    activity.verb = obj.verb;
    activity.metaEvent = obj.metaEvent;
    activity.deletedIds = obj.deletedIds;
    activity.contentBody = obj.contentBody;
    activity.postId = obj.postId;
    activity.challengeId = obj.challengeId;
    activity.commentId = obj.commentId;
    activity.replyId = obj.replyId;
    activity.postPageIndex = obj.postPageIndex;
    activity.miscId = obj.miscId;
    activity.reportId = obj.reportId;
    activity.displayBodyStr = obj.displayBodyStr;
    return activity;
  }

  constructor() {
    this.id = generateId();
    this.createdAt = new Date();
    this.subjectIds = [];
    this.metaEvent = ActivityType.UNKNOWN;
  }

  static createDeleteMetaEvent(ids: string[]): Activity {
    const activity = new Activity();
    activity.setType(ActivityType.META_EVENT);
    activity.metaEvent = ActivityMetaEvent.DELETE;
    activity.deletedIds = ids;
    return activity;
  }

  /// Helpers
  setType(type: ActivityType) {
    this.type = Number(Object.keys(ActivityType)[type]);
  }

  getType(): ActivityType {
    return ActivityType[this.type] === 'undefined'
      ? ActivityType.UNKNOWN
      : this.type;
  }

  getMetaEvent(): ActivityMetaEvent {
    return ActivityType[this.metaEvent] === 'undefined'
      ? ActivityType.UNKNOWN
      : this.metaEvent;
  }

  getGqlActivityType(): GqlActivityType {
    switch (this.type) {
      case 1:
        return GqlActivityType.SINGLE;
      case 2:
        return GqlActivityType.AGGREGATED;
      case 3:
        return GqlActivityType.META_EVENT;
      case 4:
        return GqlActivityType.SYSTEM;
      default:
        return GqlActivityType.UNKNOWN;
    }
  }

  setMiscObjType(miscObjType: MiscObjectType) {
    this.miscObjectType = Number(Object.keys(MiscObjectType)[miscObjType]);
  }

  getMiscObjType(): MiscObjectType {
    return MiscObjectType[this.miscObjectType ?? 0] === 'undefined'
      ? MiscObjectType.UNKNOWN
      : this.objectType ?? 0;
  }

  setVerb(verb: ActivityVerb) {
    this.verb = Number(Object.keys(ActivityVerb)[verb]);
  }

  getGqlVerb(): GqlActivityVerb {
    switch (this.verb) {
      case ActivityVerb.REACTION_REAL:
        return GqlActivityVerb.REACTION_REAL;
      case ActivityVerb.REACTION_APPLAUD:
        return GqlActivityVerb.REACTION_APPLAUD;
      case ActivityVerb.COMMENTED:
        return GqlActivityVerb.COMMENTED;
      case ActivityVerb.REPLIED:
        return GqlActivityVerb.REPLIED;
      case ActivityVerb.REPOSTED:
        return GqlActivityVerb.REPOSTED;
      case ActivityVerb.FOLLOWED:
        return GqlActivityVerb.FOLLOWED;
      case ActivityVerb.COMMENT_EMBARGO_LIFTED:
        return GqlActivityVerb.COMMENT_EMBARGO_LIFTED;
      case ActivityVerb.REC_FIRST_STRIKE:
        return GqlActivityVerb.REC_FIRST_STRIKE;
      case ActivityVerb.REC_SECOND_STRIKE:
        return GqlActivityVerb.REC_SECOND_STRIKE;
      case ActivityVerb.REC_FINAL_STRIKE:
        return GqlActivityVerb.REC_FINAL_STRIKE;
      case ActivityVerb.POSTED:
        return GqlActivityVerb.POSTED;
      case ActivityVerb.IMPROVED_PROFILE_RING:
        return GqlActivityVerb.IMPROVED_PROFILE_RING;
      case ActivityVerb.MENTIONED_IN_POST:
        return GqlActivityVerb.MENTIONED_IN_POST;
      case ActivityVerb.MENTIONED_IN_COMMENT:
        return GqlActivityVerb.MENTIONED_IN_COMMENT;
      case ActivityVerb.MENTIONED_IN_REPLY:
        return GqlActivityVerb.MENTIONED_IN_REPLY;
      case ActivityVerb.ADDED_TO_IC:
        return GqlActivityVerb.ADDED_TO_IC;
      case ActivityVerb.AUTO_ADDED_TO_IC:
        return GqlActivityVerb.AUTO_ADDED_TO_IC;
      case ActivityVerb.AUTO_ADDED_TO_FOLLOWING:
        return GqlActivityVerb.AUTO_ADDED_TO_FOLLOWING;
      case ActivityVerb.JOINED_CHALLENGE:
        return GqlActivityVerb.JOINED_CHALLENGE;
      case ActivityVerb.CHALLENGE_CREATED:
        return GqlActivityVerb.CHALLENGE_CREATED;
      default:
        return GqlActivityVerb.REACTION_LIKE;
    }
  }

  getVerb(): ActivityVerb {
    return ActivityVerb[this.verb] === 'undefined'
      ? ActivityVerb.UNKNOWN
      : this.verb;
  }

  setObjectType(objectType: ActivityObjectType) {
    this.objectType = Number(Object.keys(ActivityObjectType)[objectType]);
  }

  getObjectType(): ActivityObjectType {
    return ActivityObjectType[this.objectType] === 'undefined'
      ? ActivityObjectType.UNKNOWN
      : this.objectType;
  }

  pushSubject(
    subjectId: string,
    isAggregated = false,
    secondSubjectId?: string
  ) {
    if (isAggregated) {
      if (secondSubjectId) {
        this.subjectIds[0] = subjectId;
        this.subjectIds[1] = secondSubjectId;
      } else {
        this.subjectIds[1] = this.subjectIds[0];
        this.subjectIds[0] = subjectId;
      }
    } else {
      this.subjectIds[0] = subjectId;
    }
  }
} //end of class Activity

export interface UserActivitySubject {
  type: 'UserActivitySubject';
  user: UserEntity;
}

export type ActivitySubject = UserActivitySubject;

export interface PostActivityObject {
  type: 'PostActivityObject';
  post: PostEntity;
}

export interface UserActivityObject {
  type: 'UserActivityObject';
  user: UserEntity;
}

export interface CommentActivityObject {
  type: 'CommentActivityObject';
  comment: CommentEntity;
}

export interface ReplyActivityObject {
  type: 'ReplyActivityObject';
  reply: ReplyEntity;
}

export interface CommentEmbargoLiftedObject {
  type: 'CommentEmbargoLiftedObject';
}

export type ActivityObject =
  | PostActivityObject
  | UserActivityObject
  | CommentActivityObject
  | ReplyActivityObject;

export enum ActivityType {
  UNKNOWN = 0,
  SINGLE,
  AGGREGATED,
  META_EVENT,
  SYSTEM,
}

export enum ActivityVerb {
  UNKNOWN = 0,
  REACTION_LIKE = 1,
  REACTION_REAL = 2,
  REACTION_APPLAUD = 3,
  COMMENTED = 4,
  REPLIED = 5,
  REPOSTED = 6,
  FOLLOWED = 7,
  COMMENT_EMBARGO_LIFTED = 8,
  REC_FIRST_STRIKE = 9,
  REC_SECOND_STRIKE = 10,
  REC_FINAL_STRIKE = 11,
  POSTED = 12,
  IMPROVED_PROFILE_RING = 13,
  INITIAL_FEED_READY = 14,
  MENTIONED_IN_POST = 15,
  MENTIONED_IN_COMMENT = 16,
  MENTIONED_IN_REPLY = 17,
  ADDED_TO_IC = 18,
  AUTO_ADDED_TO_IC = 19,
  AUTO_ADDED_TO_FOLLOWING = 20,
  CHALLENGE_CREATED = 21,
  JOINED_CHALLENGE = 22,
}

export enum ActivityObjectType {
  UNKNOWN = 0,
  USER,
  POST,
  COMMENT,
  REPLY,
  CHALLENGE,
}

export enum MiscObjectType {
  UNKNOWN = 0,
  POST,
  COMMENT,
  REPLY,
  REVIEW_REPORT_REQUEST,
}

export enum ActivityMetaEvent {
  UNKNOWN = 0,
  DELETE = 1,
}
