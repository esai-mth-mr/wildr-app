import { ContentIO } from '@verdzie/server/content/content.io';
import { ChallengeCover } from '@verdzie/server/challenge/challenge-data-objects/challenge.cover';
import {
  ChallengeStats,
  getEmptyChallengeStats,
} from '@verdzie/server/challenge/challenge-data-objects/challenge.stats';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';
import { UserEntity } from '@verdzie/server/user/user.entity';
import {
  ChallengeAccessControl,
  defaultChallengeAccessControl,
} from '@verdzie/server/challenge/challenge-access-control/challengeAccessControl';
import { generateId } from '@verdzie/server/common/generateId';
import { ActivityData } from '@verdzie/server/activity/activity-common';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import {
  TrollDetectedInDescriptionError,
  TrollDetectedInNameError,
  TrollDetectionOverride,
} from '@verdzie/server/troll-detector/troll-detector.service';

export interface ChallengeTrollDetectionData {
  name?: TrollDetectedInNameError[];
  description?: TrollDetectedInDescriptionError[];
}

type ChallengeProperties = {
  [Key in keyof Required<ChallengeEntity>]: Key;
};

export class ChallengeEntity {
  static readonly kAuthorRelation = 'author';

  id: string;
  authorId: string;
  author?: UserEntity;
  name: string;
  description?: ContentIO;
  stats: ChallengeStats;
  categoryIds?: string[];
  cover?: ChallengeCover;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  willBeDeleted?: boolean;
  state?: number;
  accessControl?: ChallengeAccessControl;
  activityData?: ActivityData;
  pinnedCommentId?: string;
  pinnedComment?: CommentEntity;
  trollDetectionData?: ChallengeTrollDetectionData;

  static readonly kFields: ChallengeProperties = {
    id: 'id',
    authorId: 'authorId',
    name: 'name',
    description: 'description',
    stats: 'stats',
    categoryIds: 'categoryIds',
    cover: 'cover',
    startDate: 'startDate',
    endDate: 'endDate',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    willBeDeleted: 'willBeDeleted',
    state: 'state',
    accessControl: 'accessControl',
    activityData: 'activityData',
    pinnedCommentId: 'pinnedCommentId',
    trollDetectionData: 'trollDetectionData',
    // Relations
    pinnedComment: 'pinnedComment',
    author: 'author',
    // Methods
    isCompleted: 'isCompleted',
    existenceState: 'existenceState',
    addTrollDetectionOverride: 'addTrollDetectionOverride',
  };

  constructor() {
    this.id = generateId();
    this.authorId = '';
    this.stats = getEmptyChallengeStats();
    this.startDate = new Date();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.accessControl = defaultChallengeAccessControl();
  }

  get isCompleted(): boolean {
    if (this.endDate) return this.endDate < new Date();
    return false;
  }

  get existenceState(): ExistenceState {
    return this.state ? this.state : ExistenceState.ALIVE;
  }

  set existenceState(state: ExistenceState) {
    this.state = Number(Object.keys(ExistenceState)[state]);
  }

  addTrollDetectionOverride(trollDetectionOverride: TrollDetectionOverride) {
    if (!this.trollDetectionData) {
      this.trollDetectionData = {};
    }
    if (
      trollDetectionOverride.name &&
      trollDetectionOverride.name.message &&
      trollDetectionOverride.name.result
    ) {
      if (!this.trollDetectionData.name) {
        this.trollDetectionData.name = [];
      }
      this.trollDetectionData.name.push({
        __typename: 'TrollDetectedInNameError',
        message: trollDetectionOverride.name.message,
        result: trollDetectionOverride.name.result,
      });
    }
    if (
      trollDetectionOverride.description &&
      trollDetectionOverride.description.message &&
      trollDetectionOverride.description.result
    ) {
      if (!this.trollDetectionData.description) {
        this.trollDetectionData.description = [];
      }
      this.trollDetectionData.description.push({
        __typename: 'TrollDetectedInDescriptionError',
        message: trollDetectionOverride.description.message,
        result: trollDetectionOverride.description.result,
      });
    }
  }
}
