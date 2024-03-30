import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { NotifyFollowersAboutPostsProducer } from './notifyFollowersAboutPosts.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notify-followers-about-posts-queue',
    }),
  ],
  providers: [NotifyFollowersAboutPostsProducer],
  exports: [NotifyFollowersAboutPostsProducer],
})
export class NotifyFollowersAboutPostsWorkerModule {}
