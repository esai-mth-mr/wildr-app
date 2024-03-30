import { Module } from '@nestjs/common';
import { InviteCodeResolver } from './inviteCode.resolver';
import { InviteCodeModule } from '@verdzie/server/invite-code/inviteCode.module';
import { InviteCodeActionModule } from '@verdzie/server/invite-code/inviteCodeAction.module';

@Module({
  imports: [InviteCodeModule, InviteCodeActionModule],
  providers: [InviteCodeResolver],
  exports: [InviteCodeResolver],
})
export class InviteCodeResolverModule {}
