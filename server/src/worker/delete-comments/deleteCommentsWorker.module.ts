import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { DeleteCommentsProducer } from './deleteComments.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'delete-comments-queue',
    }),
  ],
  providers: [DeleteCommentsProducer],
  exports: [DeleteCommentsProducer],
})
export class DeleteCommentsWorkerModule {}
