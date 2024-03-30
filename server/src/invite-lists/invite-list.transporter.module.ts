import { Module } from '@nestjs/common';
import { InviteListTransporter } from '@verdzie/server/invite-lists/invite-list.transporter';
import { UserModule } from '@verdzie/server/user/user.module';

@Module({
  imports: [UserModule],
  providers: [InviteListTransporter],
  exports: [InviteListTransporter],
})
export class InviteListTransporterModule {}
