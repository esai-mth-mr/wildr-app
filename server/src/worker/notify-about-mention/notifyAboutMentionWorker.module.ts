import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotifyAboutMentionProducer } from '@verdzie/server/worker/notify-about-mention/notifyAboutMention.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notify-about-mentions-queue',
    }),
  ],
  providers: [NotifyAboutMentionProducer],
  exports: [NotifyAboutMentionProducer],
})
export class NotifyAboutMentionWorkerModule {}
