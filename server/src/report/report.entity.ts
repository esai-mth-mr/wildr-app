import { ReportType } from '../graphql';
import { ReviewReportRequestEntity } from '../review-report-request/reviewReportRequest.entity';

export class ReportEntity {
  id: string;
  objectId: string;
  objectAuthorId: string;
  objectType: number;
  reporterId: string;
  reportType: number;
  reporterComment?: string;
  reviewReportRequestId: string;
  reviewReportRequest: ReviewReportRequestEntity;
  createdAt: Date;
  updatedAt: Date;

  setObjectType(type: ReportObjectTypeEnum) {
    this.objectType = Number(Object.keys(ReportObjectTypeEnum)[type]);
  }

  getObjectType(): ReportObjectTypeEnum {
    return ReportObjectTypeEnum[this.objectType] === 'undefined'
      ? ReportObjectTypeEnum.UNKNOWN
      : this.objectType;
  }

  setReportType(type: ReportType) {
    this.reportType = type;
  }

  getReportType(): ReportType {
    return ReportType[this.reportType] === 'undefined'
      ? ReportType.UNKNOWN
      : this.reportType;
  }
}

export enum ReportObjectTypeEnum {
  UNKNOWN = 0,
  USER,
  POST,
  COMMENT,
  REPLY,
  CHALLENGE,
}
