import { Module } from '@nestjs/common';
import { PostModule } from '../post/post.module';
import { TagModule } from '../tag/tag.module';
import { UserModule } from '../user/user.module';
import { OpenSearchResolver } from './openSearch.resolver';
import { OpenSearchService } from './openSearch.service';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { UserSearchService } from '@verdzie/server/user/user-search.service';
import { PostSearchService } from '@verdzie/server/post/post-search.service';
import { OSQueryModule } from '@verdzie/server/open-search-v2/query/query.module';

@Module({
  imports: [UserModule, TagModule, PostModule, FeedModule, OSQueryModule],
  providers: [
    OpenSearchService,
    OpenSearchResolver,
    PostSearchService,
    UserSearchService,
  ],
  exports: [OpenSearchService],
})
export class OpenSearchModule {}
