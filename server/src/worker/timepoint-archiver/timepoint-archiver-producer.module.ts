import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  TIMEPOINT_ARCHIVER_QUEUE_NAME,
  TimepointArchiverProducer,
} from '@verdzie/server/worker/timepoint-archiver/timepoint-archiver.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: TIMEPOINT_ARCHIVER_QUEUE_NAME,
    }),
  ],
  providers: [TimepointArchiverProducer],
  exports: [TimepointArchiverProducer],
})
export class TimepointArchiverProducerModule {}
