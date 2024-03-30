import { Module } from '@nestjs/common';

import { AdminFeedController } from '@verdzie/server/admin/feed/adminFeed.controller';
import { AdminFeedService } from '@verdzie/server/admin/feed/adminFeed.service';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { PostModule } from '@verdzie/server/post/post.module';

@Module({
  imports: [FeedModule, PostModule],
  controllers: [AdminFeedController],
  providers: [AdminFeedService],
  exports: [AdminFeedService],
})
export class AdminFeedModule {}
