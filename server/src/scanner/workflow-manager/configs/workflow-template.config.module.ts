import { Module } from '@nestjs/common';
import { WorkflowTemplateConfig } from '@verdzie/server/scanner/workflow-manager/configs/workflow-template.config';
import { TemplateProducerModule } from '@verdzie/server/worker/template/template.producer.module';

@Module({
  imports: [TemplateProducerModule],
  providers: [WorkflowTemplateConfig],
  exports: [WorkflowTemplateConfig],
})
export class WorkflowTemplateConfigModule {}
