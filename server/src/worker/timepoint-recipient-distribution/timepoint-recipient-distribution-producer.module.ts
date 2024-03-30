import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  TIMEPOINT_RECIPIENT_DISTRIBUTION_QUEUE_NAME,
  TimepointRecipientDistributionProducer,
} from '@verdzie/server/worker/timepoint-recipient-distribution/timepoint-recipient-distribution.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: TIMEPOINT_RECIPIENT_DISTRIBUTION_QUEUE_NAME,
    }),
  ],
  providers: [TimepointRecipientDistributionProducer],
  exports: [TimepointRecipientDistributionProducer],
})
export class TimepointRecipientDistributionProducerModule {}
