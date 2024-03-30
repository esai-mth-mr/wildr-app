import { Module } from '@nestjs/common';
import { MailGunService } from '@verdzie/server/mail-gun/mail-gun.service';

@Module({
  providers: [MailGunService],
  exports: [MailGunService],
})
export class MailGunModule {}
