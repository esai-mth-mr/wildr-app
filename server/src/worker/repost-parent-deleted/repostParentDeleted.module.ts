import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { RepostParentDeletedProducer } from '@verdzie/server/worker/repost-parent-deleted/repostParentDeleted.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'repost-parent-deleted-queue',
    }),
  ],
  providers: [RepostParentDeletedProducer],
  exports: [RepostParentDeletedProducer],
})
@Module({})
export class RepostParentDeletedModule {}
