import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HIGH_LOAD_JOB_CONFIG_KEY } from '@verdzie/server/bull/wildr-bull.module';
import { UserSchema } from '@verdzie/server/user/user.schema';
import { UpdateUserExploreFeedConsumer } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.consumer';
import { UPDATE_USER_EXPLORE_FEED_QUEUE_NAME } from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.producer';
import { UpdateViewCountModule } from '@verdzie/server/worker/update-view-count/updateViewCount.module';

@Module({
  imports: [
    UpdateViewCountModule,
    TypeOrmModule.forFeature([UserSchema]),
    BullModule.registerQueue({
      name: UPDATE_USER_EXPLORE_FEED_QUEUE_NAME,
      configKey: HIGH_LOAD_JOB_CONFIG_KEY,
    }),
  ],
  providers: [UpdateUserExploreFeedConsumer],
  exports: [UpdateUserExploreFeedConsumer],
})
export class UpdateUserExploreFeedConsumerModule {}
