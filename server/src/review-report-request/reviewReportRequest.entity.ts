import {
  ReportEntity,
  ReportObjectTypeEnum,
} from '@verdzie/server/report/report.entity';
import { ViolatedGuideline } from '@verdzie/server/review-report-request/violatedGuideline.enum';

//Unique
export class ReviewReportRequestEntity {
  // reportedObjectAuthorId: string;
  id: string;
  readableNumericId: number;
  reportedObjectAuthorId: string;
  reportedObjectId: string; ///post/comment/....
  reportedObjectType: number;
  reportIds: string[];
  // reporterIds: string[];
  reviewerId?: string; //Will be assigned later
  reviewerComment?: string;
  reviewState: number;
  reviewResult: number;
  reportsCount: number; //Maybe just get the list?
  createdAt: Date;
  updatedAt: Date;
  reports?: ReportEntity[]; //one-to-many
  violatedGuideline?: ViolatedGuideline;

  //ObjectType
  setReportedObjectType(type: ReportObjectTypeEnum) {
    this.reportedObjectType = Number(Object.keys(ReportObjectTypeEnum)[type]);
  }
  getReportedObjectType(): ReportObjectTypeEnum {
    return ReportObjectTypeEnum[this.reportedObjectType] === 'undefined'
      ? ReportObjectTypeEnum.UNKNOWN
      : this.reportedObjectType;
  }

  //ReviewState
  setReviewState(type: ReportReviewStateEnum) {
    this.reviewState = Number(Object.keys(ReportReviewStateEnum)[type]);
  }
  getReviewState(): ReportReviewStateEnum {
    return ReportReviewStateEnum[this.reviewState] === 'undefined'
      ? ReportReviewStateEnum.UNKNOWN
      : this.reviewState;
  }

  //ReviewResult
  setReviewResult(type: ReportReviewResutEnum) {
    this.reviewResult = Number(Object.keys(ReportReviewResutEnum)[type]);
  }
  getReviewResult(): ReportReviewResutEnum {
    return ReportReviewResutEnum[this.reviewResult] === 'undefined'
      ? ReportReviewResutEnum.UNKNOWN
      : this.reviewResult;
  }
}

export enum ReportReviewStateEnum {
  UNKNOWN = 0,
  PENDING_REVIEW = 1,
  REVIEWING,
  DONE,
}

export enum ReportReviewResutEnum {
  UNKNOWN = 0,
  REJECT = 1,
  ACCEPT,
  DO_NOTHING,
}
