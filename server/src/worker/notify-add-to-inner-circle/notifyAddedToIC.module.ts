import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotifyAddedToICProducer } from '@verdzie/server/worker/notify-add-to-inner-circle/notifyAddedToIC.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notify-added-to-ic-queue',
    }),
  ],
  providers: [NotifyAddedToICProducer],
  exports: [NotifyAddedToICProducer],
})
export class NotifyAddedToICModule {}
