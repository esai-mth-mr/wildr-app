import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { HIGH_LOAD_JOB_CONFIG_KEY } from '@verdzie/server/bull/wildr-bull.module';
import {
  UPDATE_USER_EXPLORE_FEED_QUEUE_NAME,
  UpdateUserExploreFeedProducer,
} from '@verdzie/server/worker/update-user-explore-feed/updateUserExploreFeed.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: UPDATE_USER_EXPLORE_FEED_QUEUE_NAME,
      configKey: HIGH_LOAD_JOB_CONFIG_KEY,
    }),
  ],
  providers: [UpdateUserExploreFeedProducer],
  exports: [UpdateUserExploreFeedProducer],
})
export class UpdateUserExploreFeedProducerModule {}
