import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentModule } from '../content/content.module';
import { FeedModule } from '../feed/feed.module';
import { UserModule } from '../user/user.module';
import { ReportWorkerModule } from '../worker/report/reportWorker.module';
import { ReplySchema } from './reply.schema';
import { ReplyRepository } from '@verdzie/server/reply/reply.repository';
import { ReplyService } from '@verdzie/server/reply/reply.service';
import { NotifyAuthorWorkerModule } from '@verdzie/server/worker/notify-author/notifyAuthorWorker.module';
import { AccessControlModule } from '../access-control/access-control.module';
import { OSIncrementalIndexStateModule } from '@verdzie/server/worker/open-search-incremental-state/open-search-incremental-index-state.module';
import { TrollDetectorModule } from '@verdzie/server/troll-detector/troll-detector.module';
import { UserListModule } from '@verdzie/server/user-list/userList.module';
import { ChallengeInteractionModule } from '@verdzie/server/challenge/challenge-interaction/challenge-interaction.module';
import { NotifyAboutMentionWorkerModule } from '@verdzie/server/worker/notify-about-mention/notifyAboutMentionWorker.module';
import { CommentRepositoryModule } from '@verdzie/server/comment/comment-repository.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReplySchema]),
    FeedModule,
    ContentModule,
    UserModule,
    ReportWorkerModule,
    AccessControlModule,
    TrollDetectorModule,
    NotifyAuthorWorkerModule,
    NotifyAboutMentionWorkerModule,
    ChallengeInteractionModule,
    OSIncrementalIndexStateModule,
    UserListModule,
    CommentRepositoryModule,
  ],
  exports: [ReplyService],
  providers: [ReplyService, TypeOrmModule, ReplyRepository],
})
export class ReplyModule {}
