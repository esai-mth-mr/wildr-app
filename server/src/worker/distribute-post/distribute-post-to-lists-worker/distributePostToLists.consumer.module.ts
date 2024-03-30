import { Module } from '@nestjs/common';
import { UserListModule } from '@verdzie/server/user-list/userList.module';
import { DistributePostToListsConsumer } from '@verdzie/server/worker/distribute-post/distribute-post-to-lists-worker/distributePostToLists.consumer';
import { DistributePostToListsProducerModule } from '@verdzie/server/worker/distribute-post/distribute-post-to-lists-worker/distributePostToLists.producer.module';

@Module({
  imports: [DistributePostToListsProducerModule, UserListModule],
  providers: [DistributePostToListsConsumer],
  exports: [DistributePostToListsConsumer],
})
export class DistributePostToListsConsumerModule {}
