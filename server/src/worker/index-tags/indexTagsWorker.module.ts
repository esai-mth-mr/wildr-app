import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { IndexTagsProducer } from './indexTags.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'index-tags-queue',
    }),
  ],
  providers: [IndexTagsProducer],
  exports: [IndexTagsProducer],
})
export class IndexTagsWorkerModule {}
