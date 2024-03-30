import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { NotifyAuthorProducer } from './notifyAuthor.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notify-author-queue',
    }),
  ],
  providers: [NotifyAuthorProducer],
  exports: [NotifyAuthorProducer],
})
export class NotifyAuthorWorkerModule {}
