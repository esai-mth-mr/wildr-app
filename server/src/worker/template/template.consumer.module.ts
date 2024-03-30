import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { WorkflowManagerServiceModule } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service.module';
import { TemplateConsumer } from '@verdzie/server/worker/template/template.consumer';
import { TEMPLATE_QUEUE_NAME } from '@verdzie/server/worker/template/template.producer';
import { TemplateProducerModule } from '@verdzie/server/worker/template/template.producer.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: TEMPLATE_QUEUE_NAME,
    }),
    TemplateProducerModule,
    WorkflowManagerServiceModule,
  ],
  providers: [TemplateConsumer],
  exports: [TemplateConsumer],
})
export class TemplateConsumerModule {}
