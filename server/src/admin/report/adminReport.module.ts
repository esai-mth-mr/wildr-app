import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminReportController } from '@verdzie/server/admin/report/adminReport.controller';
import { AdminReportService } from '@verdzie/server/admin/report/adminReport.service';
import { ReportSchema } from '@verdzie/server/report/report.schema';
import { ReviewReportRequestSchema } from '@verdzie/server/review-report-request/reviewReportRequest.schema';
import { PostModule } from '@verdzie/server/post/post.module';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { ReplyModule } from '@verdzie/server/reply/reply.module';
import { ReviewReportRequestModule } from '@verdzie/server/review-report-request/reviewReportRequest.module';
import { ReportModule } from '@verdzie/server/report/report.module';
import { UserModule } from '@verdzie/server/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportSchema]),
    TypeOrmModule.forFeature([ReviewReportRequestSchema]),
    ReportModule,
    ReviewReportRequestModule,
    PostModule,
    CommentModule,
    ReplyModule,
    UserModule,
  ],
  controllers: [AdminReportController],
  providers: [AdminReportService],
  exports: [AdminReportService],
})
export class AdminReportModule {}
