import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { UserStatsSyncWorkflowConfig } from '@verdzie/server/scanner/workflow-manager/configs/user-stats-sync.workflow-config';
import { USER_STATS_SYNC_QUEUE_CONFIG } from '@verdzie/server/worker/user-stats-sync/user-stats-sync-worker.config';
import { UserStatsSyncProducerModule } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.producer.module';

@Module({
  imports: [
    BullModule.registerQueue(USER_STATS_SYNC_QUEUE_CONFIG),
    UserStatsSyncProducerModule,
  ],
  providers: [UserStatsSyncWorkflowConfig],
  exports: [UserStatsSyncWorkflowConfig],
})
export class UserStatsSyncWorkflowConfigModule {}
