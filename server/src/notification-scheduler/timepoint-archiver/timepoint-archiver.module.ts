import { Module } from '@nestjs/common';
import { TimepointArchiverService } from '@verdzie/server/notification-scheduler/timepoint-archiver/timepoint-archiver.service';
import { TimepointArchiverProducerModule } from '@verdzie/server/worker/timepoint-archiver/timepoint-archiver-producer.module';

@Module({
  imports: [TimepointArchiverProducerModule],
  providers: [TimepointArchiverService],
  exports: [TimepointArchiverService],
})
export class TimepointArchiverModule {}
