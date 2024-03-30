import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimepointSchema } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.schema';
import { TimepointService } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.service';
import { NotificationConfigModule } from '@verdzie/server/notification-scheduler/notification-config/notification-config.module';
import { UserSchema } from '@verdzie/server/user/user.schema';
import { TimepointArchiverProducerModule } from '@verdzie/server/worker/timepoint-archiver/timepoint-archiver-producer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimepointSchema, UserSchema]),
    NotificationConfigModule,
    TimepointArchiverProducerModule,
  ],
  providers: [TimepointService],
  exports: [TimepointService],
})
export class TimepointModule {}
