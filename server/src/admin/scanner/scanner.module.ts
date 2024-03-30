import { Module } from '@nestjs/common';
import { AdminScannerController } from '@verdzie/server/admin/scanner/admin-scanner.controller';
import { AdminScannerService } from '@verdzie/server/admin/scanner/admin-scanner.service';
import { ScanInitializerProducerModule } from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.producer.module';

@Module({
  imports: [ScanInitializerProducerModule],
  providers: [AdminScannerService],
  controllers: [AdminScannerController],
})
export class AdminScannerModule {}
