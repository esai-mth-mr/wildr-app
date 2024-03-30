import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from '@verdzie/server/user/user.schema';
import { ActivityStreamModule } from '@verdzie/server/activity-stream/activity.stream.module';
import { FCMModule } from '@verdzie/server/fcm/fcm.module';
import { AdminUserController } from '@verdzie/server/admin/user/adminUser.controller';
import { AdminUserService } from '@verdzie/server/admin/user/adminUser.service';
import { UserModule } from '@verdzie/server/user/user.module';
import { AdminMailGunModule } from '@verdzie/server/admin/mail-gun/adminMailGun.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSchema]),
    ActivityStreamModule,
    AdminMailGunModule,
    FCMModule,
    UserModule,
  ],
  controllers: [AdminUserController],
  providers: [AdminUserService],
  exports: [AdminUserService],
})
export class AdminUserModule {}
