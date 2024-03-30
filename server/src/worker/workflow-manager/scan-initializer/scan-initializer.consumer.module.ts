import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ScanInitializerServiceModule } from '@verdzie/server/scanner/scan-initializer/scan-initializer.service.module';
import { ScanInitializerConsumer } from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.consumer';
import { SCAN_INITIALIZER_QUEUE_NAME } from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.producer';
import { ScanInitializerProducerModule } from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.producer.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SCAN_INITIALIZER_QUEUE_NAME,
    }),
    ScanInitializerProducerModule,
    ScanInitializerServiceModule,
  ],
  providers: [ScanInitializerConsumer],
  exports: [ScanInitializerConsumer],
})
export class ScanInitializerConsumerModule {}
