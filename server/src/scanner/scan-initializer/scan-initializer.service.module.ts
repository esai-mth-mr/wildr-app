import { Module } from '@nestjs/common';
import { ScanInitializerService } from '@verdzie/server/scanner/scan-initializer/scan-initializer.service';
import { TaskInitializerProducerModule } from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.producer.module';
import { WorkflowStateServiceModule } from '@verdzie/server/scanner/workflow-state/workflow-state.service.module';
import { WorkflowManagerServiceModule } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service.module';

@Module({
  imports: [
    TaskInitializerProducerModule,
    WorkflowStateServiceModule,
    WorkflowManagerServiceModule,
  ],
  providers: [ScanInitializerService],
  exports: [ScanInitializerService],
})
export class ScanInitializerServiceModule {}
