import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ReportProducer } from './report.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'report-queue',
    }),
  ],
  providers: [ReportProducer],
  exports: [ReportProducer],
})
export class ReportWorkerModule {}
