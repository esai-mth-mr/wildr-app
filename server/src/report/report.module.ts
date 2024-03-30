import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewReportRequestModule } from '../review-report-request/reviewReportRequest.module';
import { ReportSchema } from './report.schema';
import { ReportService } from './report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportSchema]),
    ReviewReportRequestModule,
  ],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
