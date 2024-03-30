import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimepointSchema } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.schema';
import { TimepointRecipientDistributionService } from '@verdzie/server/notification-scheduler/orchestrator/timepoint-recipient-distribution/timepoint-recipient-distribution.service';
import { ScheduledNotificationBuilderProducerModule } from '@verdzie/server/worker/scheduled-notification-builder/scheduled-notification-builder-producer.module';
import { TimepointRecipientDistributionProducerModule } from '@verdzie/server/worker/timepoint-recipient-distribution/timepoint-recipient-distribution-producer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimepointSchema]),
    TimepointRecipientDistributionProducerModule,
    ScheduledNotificationBuilderProducerModule,
  ],
  providers: [TimepointRecipientDistributionService],
  exports: [TimepointRecipientDistributionService, TypeOrmModule],
})
export class TimepointRecipientDistributionModule {}
