import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostModule } from '@verdzie/server/post/post.module';
import { AdminPostController } from '@verdzie/server/admin/post/adminPost.controller';
import { AdminPostService } from '@verdzie/server/admin/post/adminPost.service';
import { PostSchema } from '@verdzie/server/post/post.schema';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { OpenSearchIndexModule } from '@verdzie/server/open-search/open-search-index/openSearchIndex.module';
import { PostCategoryModule } from '@verdzie/server/post-category/postCategory.module';
import { OSQueryModule } from '@verdzie/server/open-search-v2/query/query.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostSchema]),
    PostModule,
    FeedModule,
    PostCategoryModule,
    OpenSearchIndexModule,
    OSQueryModule,
  ],
  controllers: [AdminPostController],
  providers: [AdminPostService],
  exports: [AdminPostService],
})
export class AdminPostModule {}
