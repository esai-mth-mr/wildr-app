import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { InviteCodeSchema } from '@verdzie/server/invite-code/inviteCode.schema';
import { InviteCodeModule } from '@verdzie/server/invite-code/inviteCode.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { AdminInviteService } from '@verdzie/server/admin/invite/adminInvite.service';
import { AdminInviteController } from '@verdzie/server/admin/invite/adminInvite.controller';
import { GoogleApiModule } from '@verdzie/server/google-api/google-api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InviteCodeSchema]),
    InviteCodeModule,
    UserModule,
    GoogleApiModule,
  ],
  controllers: [AdminInviteController],
  providers: [AdminInviteService],
  exports: [AdminInviteService],
})
export class AdminInviteModule {}
