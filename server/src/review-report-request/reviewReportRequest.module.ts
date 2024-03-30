import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { StrikeWorkerModule } from '../worker/strike/strikeWorker.module';
import { ReviewReportRequestSchema } from './reviewReportRequest.schema';
import { ReviewReportRequestService } from './reviewReportRequest.service';
import { PostModule } from '@verdzie/server/post/post.module';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { ReplyModule } from '@verdzie/server/reply/reply.module';
import { StrikeModule } from '@verdzie/server/strike/strike.module';
import { ReviewReportRequestResolver } from '@verdzie/server/review-report-request/reviewReportRequest.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewReportRequestSchema]),
    UserModule,
    StrikeWorkerModule,
    PostModule,
    CommentModule,
    ReplyModule,
    StrikeModule,
  ],
  providers: [ReviewReportRequestService, ReviewReportRequestResolver],
  exports: [ReviewReportRequestService],
})
export class ReviewReportRequestModule {}
