import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotifyAboutRepostProducer } from '@verdzie/server/worker/notify-about-repost/notifyAboutRepost.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'repost-notification-queue',
    }),
  ],
  providers: [NotifyAboutRepostProducer],
  exports: [NotifyAboutRepostProducer],
})
export class NotifyAboutRepostWorkerModule {}
