import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { DeleteRepliesProducer } from './deleteReplies.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'delete-replies-queue',
    }),
  ],
  providers: [DeleteRepliesProducer],
  exports: [DeleteRepliesProducer],
})
export class DeleteRepliesWorkerModule {}
