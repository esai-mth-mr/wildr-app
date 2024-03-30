import { Module } from '@nestjs/common';
import { UserListResolver } from '@verdzie/server/user-list-resolver/userList.resolver';
import { UserModule } from '@verdzie/server/user/user.module';
import { UserListModule } from '@verdzie/server/user-list/userList.module';
import { UserResolverModule } from '@verdzie/server/user/resolvers/userResolver.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';

@Module({
  imports: [UserModule, UserListModule, UserResolverModule, FeedModule],
  providers: [UserListResolver],
  exports: [UserListResolver],
})
export class UserListResolverModule {}
