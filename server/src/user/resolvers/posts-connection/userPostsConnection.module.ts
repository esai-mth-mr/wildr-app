import { Module } from '@nestjs/common';
import { FeedModule } from '../../../feed/feed.module';
import { PostModule } from '../../../post/post.module';
import {
  UserPostsConnectionsResolver,
  UserPostsConnectionResolver,
} from './userPostsConnection.resolver';
import { UserModule } from '@verdzie/server/user/user.module';

@Module({
  imports: [FeedModule, PostModule, UserModule],
  providers: [UserPostsConnectionResolver, UserPostsConnectionsResolver],
})
export class UserPostsConnectionModule {}
