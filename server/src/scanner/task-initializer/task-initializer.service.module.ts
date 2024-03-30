import { Module } from '@nestjs/common';
import { TaskInitializerService } from '@verdzie/server/scanner/task-initializer/task-initializer.service';
import { WorkflowManagerServiceModule } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service.module';
import { WorkflowStateServiceModule } from '@verdzie/server/scanner/workflow-state/workflow-state.service.module';
import { WildrRedisService } from '@verdzie/server/wildr-redis/wildr-redis.service';

@Module({
  imports: [WorkflowStateServiceModule, WorkflowManagerServiceModule],
  providers: [WildrRedisService, TaskInitializerService],
  exports: [TaskInitializerService],
})
export class TaskInitializerServiceModule {}
