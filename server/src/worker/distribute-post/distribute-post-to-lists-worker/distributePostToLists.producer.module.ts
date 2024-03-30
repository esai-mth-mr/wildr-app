import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { UserListModule } from '@verdzie/server/user-list/userList.module';
import { DistributePostToListsProducer } from '@verdzie/server/worker/distribute-post/distribute-post-to-lists-worker/distributePostToLists.producer';
import { DISTRIBUTE_POSTS_TO_LISTS_QUEUE_NAME } from '@verdzie/server/worker/distribute-post/distribute-post-to-lists-worker/distributePostToListsWorker.config';

@Module({
  imports: [
    BullModule.registerQueue({
      name: DISTRIBUTE_POSTS_TO_LISTS_QUEUE_NAME,
    }),
    UserListModule,
  ],
  providers: [DistributePostToListsProducer],
  exports: [DistributePostToListsProducer],
})
export class DistributePostToListsProducerModule {}
