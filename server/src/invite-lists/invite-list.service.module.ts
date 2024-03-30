import { Module } from '@nestjs/common';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { InviteListService } from '@verdzie/server/invite-lists/invite-list.service';
import { UserModule } from '@verdzie/server/user/user.module';

@Module({
  imports: [FeedModule, UserModule],
  providers: [InviteListService],
  exports: [InviteListService],
})
export class InviteListServiceModule {}
