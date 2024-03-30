import { Module } from '@nestjs/common';
import { FeedModule } from '../feed/feed.module';
import { UserListModule } from '@verdzie/server/user-list/userList.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { AccessControlService } from './access-control.service';
import { CommentRepositoryModule } from '@verdzie/server/comment/comment-repository.module';

@Module({
  imports: [FeedModule, UserModule, UserListModule, CommentRepositoryModule],
  exports: [AccessControlService],
  providers: [FeedModule, UserListModule, UserModule, AccessControlService],
})
export class AccessControlModule {}
