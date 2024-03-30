import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { UserStatsSyncProducer } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.producer';
import { USER_STATS_SYNC_QUEUE_CONFIG } from './user-stats-sync-worker.config';

@Module({
  imports: [BullModule.registerQueue(USER_STATS_SYNC_QUEUE_CONFIG)],
  providers: [UserStatsSyncProducer],
  exports: [UserStatsSyncProducer],
})
export class UserStatsSyncProducerModule {}
