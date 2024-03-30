import { IsEnum, IsNumber, IsString } from 'class-validator';
import { ReportReviewResutEnum } from '@verdzie/server/review-report-request/reviewReportRequest.entity';

export class UpdateReportQuery {
  @IsString()
  id: string;
  @IsString()
  reviewerId: string;
  @IsEnum(ReportReviewResutEnum)
  reviewResult: ReportReviewResutEnum;
  @IsString()
  reviewerComment: string;
  @IsNumber()
  violatedGuideline: number;
}
