import { Module } from '@nestjs/common';
import { WorkflowStateService } from '@verdzie/server/scanner/workflow-state/workflow-state.service';
import { WildrRedisServiceModule } from '@verdzie/server/wildr-redis/wildr-redis.service.module';

@Module({
  imports: [WildrRedisServiceModule],
  providers: [WorkflowStateService],
  exports: [WorkflowStateService],
})
export class WorkflowStateServiceModule {}
