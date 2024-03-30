import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedEntity } from '@verdzie/server/feed/feed.entity';
import { UserListEntity } from '@verdzie/server/user-list/userList.entity';
import { UserStatsService } from '@verdzie/server/user/user-stats.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserStatsSyncService } from '@verdzie/server/user/user-stats-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserListEntity, FeedEntity])],
  providers: [UserStatsSyncService, UserStatsService],
  exports: [UserStatsSyncService],
})
export class UserStatsSyncServiceModule {}
