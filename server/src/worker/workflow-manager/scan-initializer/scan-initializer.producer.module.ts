import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  SCAN_INITIALIZER_QUEUE_NAME,
  ScanInitializerProducer,
} from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SCAN_INITIALIZER_QUEUE_NAME,
    }),
  ],
  providers: [ScanInitializerProducer],
  exports: [ScanInitializerProducer],
})
export class ScanInitializerProducerModule {}
