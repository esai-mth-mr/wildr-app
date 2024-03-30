import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentModule } from '../content/content.module';
import { FeedModule } from '../feed/feed.module';
import { ReplyModule } from '../reply/reply.module';
import { TrollDetectorModule } from '../troll-detector/troll-detector.module';
import { ReportWorkerModule } from '../worker/report/reportWorker.module';
import { CommentSchema } from './comment.schema';
import { CommentService } from './comment.service';
import { CommentRepository } from '@verdzie/server/comment/comment.repository';
import { UserModule } from '@verdzie/server/user/user.module';
import { NotifyAuthorWorkerModule } from '@verdzie/server/worker/notify-author/notifyAuthorWorker.module';
import { AccessControlModule } from '@verdzie/server/access-control/access-control.module';
import { OSIncrementalIndexStateModule } from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.module';
import { UserListModule } from '@verdzie/server/user-list/userList.module';
import { NotifyAboutMentionWorkerModule } from '@verdzie/server/worker/notify-about-mention/notifyAboutMentionWorker.module';
import { ChallengeInteractionModule } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentSchema]),
    FeedModule,
    ReplyModule,
    UserModule,
    ContentModule,
    TrollDetectorModule,
    ReportWorkerModule,
    AccessControlModule,
    NotifyAuthorWorkerModule,
    OSIncrementalIndexStateModule,
    UserListModule,
    NotifyAboutMentionWorkerModule,
    ChallengeInteractionModule,
  ],
  exports: [CommentService],
  providers: [CommentService, TypeOrmModule, CommentRepository],
})
export class CommentModule {}
