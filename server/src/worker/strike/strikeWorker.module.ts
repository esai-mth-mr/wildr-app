import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { StrikeProducer } from './strike.producer';
import { StrikeModule } from '@verdzie/server/strike/strike.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'strike-queue',
    }),
    StrikeModule,
  ],
  providers: [StrikeProducer],
  exports: [StrikeProducer],
})
export class StrikeWorkerModule {}
