import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { ReportService } from '../../report/report.service';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CreateReportJob } from './report.producer';

@Processor('report-queue')
export class ReportConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly reportService: ReportService
  ) {
    this.logger = this.logger.child({ context: 'ReportConsumer' });
  }

  /**
   * Create reportEntity
   * Link it with ReportRequestEntity
   */
  @Process('report-created-job')
  async onReportCreated(job: Job<CreateReportJob>) {
    this.logger.debug('ON REPORT CREATED');
    await this.reportService.generateReport(job.data);
  }
}
