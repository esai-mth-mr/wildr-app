import { Module } from '@nestjs/common';
import { UploadModule } from '@verdzie/server/upload/upload.module';
import { PostModule } from '@verdzie/server/post/post.module';
import { ContentModule } from '@verdzie/server/content/content.module';
import { CommentModule } from '@verdzie/server/comment/comment.module';
import { ReplyModule } from '@verdzie/server/reply/reply.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { ChallengeModule } from '@verdzie/server/challenge/challenge.module';
import {
  MultiMediaPostResolver,
  PostResolver,
} from '@verdzie/server/post/post-resolver/post.resolver';
import { ChallengeEntriesModule } from '@verdzie/server/challenge/challenge-entries/challengeEntries.module';

@Module({
  imports: [
    UploadModule,
    PostModule,
    ContentModule,
    CommentModule,
    ReplyModule,
    UserModule,
    FeedModule,
    ChallengeModule,
    ChallengeEntriesModule,
  ],
  providers: [PostResolver, MultiMediaPostResolver],
  exports: [PostResolver, MultiMediaPostResolver],
})
export class PostResolverModule {}
