import { Module } from '@nestjs/common';
import {
  FeedResolver,
  FeedPostsConnectionResolver,
  FeedPostsEdgeResolver,
} from './feed.resolver';
import { FeedModule } from './feed.module';
import { PostModule } from '../post/post.module';
import { FirebaseAuthModule } from '../firebase-auth/firebase-auth.module';
import { UserModule } from '@verdzie/server/user/user.module';

@Module({
  imports: [FeedModule, PostModule, FirebaseAuthModule, UserModule],
  providers: [FeedResolver, FeedPostsConnectionResolver, FeedPostsEdgeResolver],
  exports: [],
})
export class FeedResolverModule {}
