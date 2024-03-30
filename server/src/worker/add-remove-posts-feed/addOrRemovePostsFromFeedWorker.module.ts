import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { AddOrRemovePostsFromFeedProducer } from './addOrRemovePostsFromFeed.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'add-remove-posts-from-feed-queue',
    }),
  ],
  providers: [AddOrRemovePostsFromFeedProducer],
  exports: [AddOrRemovePostsFromFeedProducer],
})
export class AddOrRemovePostsFromFeedWorkerModule {}
