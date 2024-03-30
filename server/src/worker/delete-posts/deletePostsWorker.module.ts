import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { DeletePostsProducer } from './deletePosts.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'delete-posts-queue',
    }),
  ],
  providers: [DeletePostsProducer],
  exports: [DeletePostsProducer],
})
export class DeletePostsWorkerModule {}
