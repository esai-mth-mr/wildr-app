import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PostService } from '@verdzie/server/post/post.service';
import { FeedService } from '@verdzie/server/feed/feed.service';
import { PostEntity } from '@verdzie/server/post/post.entity';

@Injectable()
export class AdminFeedService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private feedService: FeedService,
    private postService: PostService
  ) {
    this.logger = this.logger.child({ context: 'AdminFeedService' });
  }

  async getUserFeed(userId: string): Promise<PostEntity[] | undefined> {
    const feed = await this.feedService.find(`141:${userId}`);
    if (feed != null) {
      const posts = await this.postService.findByIds(feed.page.ids, {});
      if (posts == null) return undefined;
      return this.postService.parseAllUrls(posts);
    }
    return undefined;
  }
}
