import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  TEMPLATE_QUEUE_NAME,
  TemplateProducer,
} from '@verdzie/server/worker/template/template.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: TEMPLATE_QUEUE_NAME,
    }),
  ],
  providers: [TemplateProducer],
  exports: [TemplateProducer],
})
export class TemplateProducerModule {}
