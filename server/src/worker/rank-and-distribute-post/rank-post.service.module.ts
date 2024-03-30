import { Module } from '@nestjs/common';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { RankPostService } from '@verdzie/server/worker/rank-and-distribute-post/rank-post.service';

@Module({
  imports: [FeedModule],
  providers: [RankPostService],
  exports: [RankPostService],
})
export class RankPostServiceModule {}
