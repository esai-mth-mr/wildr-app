import { Module } from '@nestjs/common';
import { UserModule } from '@verdzie/server/user/user.module';
import { InviteCodeModule } from '@verdzie/server/invite-code/inviteCode.module';
import { InviteCodeActionService } from '@verdzie/server/invite-code/inviteCodeAction.service';

@Module({
  imports: [UserModule, InviteCodeModule],
  providers: [InviteCodeActionService],
  exports: [InviteCodeActionService],
})
export class InviteCodeActionModule {}
