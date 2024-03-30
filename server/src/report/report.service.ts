import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { generateId } from '../common/generateId';
import { ReviewReportRequestService } from '../review-report-request/reviewReportRequest.service';
import { CreateReportJob } from '../worker/report/report.producer';
import { ReportEntity } from './report.entity';

/**
 * Creates a report entity
 * Links it with ReportReviewRequest
 */
@Injectable()
export class ReportService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(ReportEntity)
    private repo: Repository<ReportEntity>,
    private readonly reviewReportRequestService: ReviewReportRequestService //ReviewReportWorker
  ) {
    this.logger = this.logger.child({ context: 'ReportService' });
  }

  async generateReport(data: CreateReportJob) {
    this.logger.debug('generateReport()', { createReportJob: data });
    try {
      this.logger.debug('GENERATE REPORT');
      const date = new Date();
      const report = new ReportEntity();
      report.id = generateId();
      report.createdAt = date;
      report.updatedAt = date;
      report.objectId = data.objectId;
      report.setObjectType(data.objectType);
      report.reporterId = data.reporterId ?? '';
      report.objectAuthorId = data.objectAuthorId ?? '';
      report.reporterComment = data.reporterComment;
      report.setReportType(data.reportType);
      //TODO: Use Cron jobs to associate with reviewReportRequestEntity, if fails
      //Create or get existing reviewRequestId
      const reviewRequest =
        await this.reviewReportRequestService.createRequestIfNeeded(report);
      //If no request found or created, cancel the operation
      if (reviewRequest) {
        report.reviewReportRequestId = reviewRequest.id;
        this.logger.debug('SAVING REPORT', { report });
        await this.save(report);
      }
    } catch (error) {
      this.logger.error('Error generating report', { error });
    }
  }

  //-------------------DB Operations-------------------
  async save(report: ReportEntity) {
    await this.repo.save(report);
  }

  async update(report: ReportEntity) {
    await this.repo.save(report);
  }

  async delete(report: ReportEntity) {
    await this.repo.delete(report);
  }
}
