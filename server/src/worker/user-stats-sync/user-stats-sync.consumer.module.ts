import { Module } from '@nestjs/common';
import { WorkflowManagerServiceModule } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service.module';
import { UserStatsSyncConsumer } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.consumer';
import { UserStatsSyncProducerModule } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.producer.module';
import { UserStatsSyncServiceModule } from '@verdzie/server/user/user-stats-sync.service.module';

@Module({
  imports: [
    UserStatsSyncProducerModule,
    UserStatsSyncServiceModule,
    WorkflowManagerServiceModule,
  ],
  providers: [UserStatsSyncConsumer],
  exports: [UserStatsSyncConsumer],
})
export class UserStatsSyncConsumerModule {}
