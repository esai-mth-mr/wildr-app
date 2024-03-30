import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  TIMEPOINT_SCHEDULING_QUEUE_NAME,
  TimepointSchedulingProducer,
} from '@verdzie/server/worker/timepoint-scheduling/timepoint-scheduling.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: TIMEPOINT_SCHEDULING_QUEUE_NAME,
    }),
  ],
  providers: [TimepointSchedulingProducer],
  exports: [TimepointSchedulingProducer],
})
export class TimepointSchedulingProducerModule {}
