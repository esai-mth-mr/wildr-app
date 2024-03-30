import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserListSchema } from './userList.schema';
import { UploadModule } from '../upload/upload.module';
import { EntitiesWithPagesModule } from '../entities-with-pages-common/entitiesWithPages.module';
import { FeedModule } from '../feed/feed.module';
import { UserListService } from '@verdzie/server/user-list/userList.service';
import { UserPropertyMapModule } from '@verdzie/server/user-property-map/userPropertyMap.module';
import { NotifyAddedToICModule } from '@verdzie/server/worker/notify-add-to-inner-circle/notifyAddedToIC.module';
import { AddOrRemovePostsFromFeedWorkerModule } from '@verdzie/server/worker/add-remove-posts-feed/addOrRemovePostsFromFeedWorker.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserListSchema]),
    FeedModule,
    EntitiesWithPagesModule,
    UploadModule,
    UserPropertyMapModule,
    NotifyAddedToICModule,
    AddOrRemovePostsFromFeedWorkerModule,
  ],
  providers: [UserListService],
  exports: [UserListService],
})
export class UserListModule {}
