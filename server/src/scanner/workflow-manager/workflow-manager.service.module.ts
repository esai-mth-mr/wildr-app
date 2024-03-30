import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { UserStatsSyncWorkflowConfigModule } from '@verdzie/server/scanner/workflow-manager/configs/user-stats-sync.workflow-config.module';
import { WorkflowTemplateConfigModule } from '@verdzie/server/scanner/workflow-manager/configs/workflow-template.config.module';
import { WorkflowManagerService } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';
import { WorkflowStateServiceModule } from '@verdzie/server/scanner/workflow-state/workflow-state.service.module';
import { TEMPLATE_QUEUE_NAME } from '@verdzie/server/worker/template/template.producer';
import { TemplateProducerModule } from '@verdzie/server/worker/template/template.producer.module';
import { WorkflowManagerProducerModule } from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager.producer.module';

@Module({
  imports: [
    WorkflowStateServiceModule,
    WorkflowManagerProducerModule,
    TemplateProducerModule,
    WorkflowTemplateConfigModule,
    BullModule.registerQueue({
      name: TEMPLATE_QUEUE_NAME,
    }),
    UserStatsSyncWorkflowConfigModule,
  ],
  providers: [WorkflowManagerService],
  exports: [WorkflowManagerService],
})
export class WorkflowManagerServiceModule {}
