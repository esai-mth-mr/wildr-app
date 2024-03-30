import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { ReportType } from '../../graphql';
import { ReportObjectTypeEnum } from '../../report/report.entity';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '../worker.helper';

@Injectable()
export class ReportProducer {
  constructor(
    @InjectQueue('report-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'ReportProducer' });
  }

  async createReport(job: CreateReportJob) {
    await queueWithLogging(this.logger, this.queue, 'report-created-job', job);
  }
}

export interface CreateReportJob {
  objectType: ReportObjectTypeEnum;
  objectAuthorId: string;
  objectId: string;
  reporterId: string;
  reportType: ReportType;
  reporterComment?: string;
}
