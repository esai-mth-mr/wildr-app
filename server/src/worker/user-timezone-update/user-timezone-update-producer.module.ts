import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  USER_TIMEZONE_UPDATE_QUEUE_NAME,
  UserTimezoneUpdateProducer,
} from '@verdzie/server/worker/user-timezone-update/user-timezone-update.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: USER_TIMEZONE_UPDATE_QUEUE_NAME,
    }),
  ],
  providers: [UserTimezoneUpdateProducer],
  exports: [UserTimezoneUpdateProducer],
})
export class UserTimezoneUpdateProducerModule {}
