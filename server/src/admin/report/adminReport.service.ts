import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewReportRequestEntity } from '@verdzie/server/review-report-request/reviewReportRequest.entity';
import {
  ReportEntity,
  ReportObjectTypeEnum,
} from '@verdzie/server/report/report.entity';
import { ReviewReportRequestService } from '@verdzie/server/review-report-request/reviewReportRequest.service';
import { PostService } from '@verdzie/server/post/post.service';
import { CommentService } from '@verdzie/server/comment/comment.service';
import { ReplyService } from '@verdzie/server/reply/reply.service';
import { UpdateReportQuery } from '@verdzie/server/admin/report/adminReport.query';
import { UserService } from '@verdzie/server/user/user.service';
import { PostEntity } from '@verdzie/server/post/post.entity';
import { CommentEntity } from '@verdzie/server/comment/comment.entity';
import { ReplyEntity } from '@verdzie/server/reply/reply.entity';
import { UserEntity } from '@verdzie/server/user/user.entity';

interface ReviewResponse {
  reviewEntity: ReviewReportRequestEntity;
  objectType: string;
  object: PostEntity | CommentEntity | ReplyEntity | undefined;
  user: UserEntity | undefined;
}

interface ReportResponse {
  report: ReportEntity;
  user: UserEntity | undefined;
}

@Injectable()
export class AdminReportService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(ReviewReportRequestEntity)
    private reviewRepo: Repository<ReviewReportRequestEntity>,
    @InjectRepository(ReportEntity)
    private reportRepo: Repository<ReportEntity>,
    private postService: PostService,
    private commentService: CommentService,
    private replyService: ReplyService,
    private userService: UserService,
    private reviewReportRequestService: ReviewReportRequestService
  ) {
    this.logger = this.logger.child({ context: 'AdminReportService' });
  }

  async getReviewReportRequest(endCursor: string, limit: number) {
    const reviewRepo: ReviewReportRequestEntity[] = await this.reviewRepo
      .createQueryBuilder('review_report_request_entity')
      .where('review_report_request_entity.created_at > :start_at', {
        start_at: endCursor,
      })
      .where('review_report_request_entity.reviewState = :reviewState', {
        reviewState: 1,
      })
      .orderBy('review_report_request_entity.created_at', 'ASC')
      .take(limit)
      .getMany();
    const response: ReviewResponse[] = [];
    for (const reviewEntity of reviewRepo) {
      if (reviewEntity.reportedObjectType === ReportObjectTypeEnum.POST) {
        const post: PostEntity | undefined =
          await this.postService.findByIdIncludingSoftDelete(
            reviewEntity.reportedObjectId
          );
        if (!post) continue;
        response.push({
          reviewEntity,
          objectType: 'POST',
          object: await this.postService.parseUrls(post),
          user: await this.userService.findById(
            reviewEntity.reportedObjectAuthorId
          ),
        });
      } else if (
        reviewEntity.reportedObjectType === ReportObjectTypeEnum.COMMENT
      ) {
        response.push({
          reviewEntity,
          objectType: 'COMMENT',
          object: await this.commentService.findByIdIncludingSoftDelete(
            reviewEntity.reportedObjectId
          ),
          user: await this.userService.findById(
            reviewEntity.reportedObjectAuthorId
          ),
        });
      } else if (
        reviewEntity.reportedObjectType === ReportObjectTypeEnum.REPLY
      ) {
        response.push({
          reviewEntity,
          objectType: 'REPLY',
          object: await this.replyService.findByIdIncludingSoftDelete(
            reviewEntity.reportedObjectId
          ),
          user: await this.userService.findById(
            reviewEntity.reportedObjectAuthorId
          ),
        });
      }
    }
    return response;
  }

  async updateReport(
    query: UpdateReportQuery
  ): Promise<ReviewReportRequestEntity | undefined> {
    return await this.reviewReportRequestService.updateReportData(
      query.id,
      query.reviewerId,
      3,
      query.reviewResult,
      query.reviewerComment,
      query.violatedGuideline,
      false
    );
  }

  async getReport(reviewId: string): Promise<ReportResponse[]> {
    const reports: ReportEntity[] = await this.reportRepo.find({
      where: { reviewReportRequestId: reviewId },
    });
    return await Promise.all(
      reports.map(async r => {
        return {
          report: r,
          user: await this.userService.findById(r.reporterId),
        };
      })
    );
  }

  // async getReportAggregate(reviewId: string){
  //   const reviewReport = await this.reviewRepo.findOne(reviewId, {relations:['reports']})
  //   if(!reviewReport) return false
  //   return reviewReport
  //   //return await this.reviewRepo.findByIds(reviewReport.reports)
  //
  // }
}
