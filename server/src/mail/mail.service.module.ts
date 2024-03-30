import { Module } from '@nestjs/common';
import { MailGunModule } from '@verdzie/server/mail-gun/mail-gun.module';
import { MailService } from '@verdzie/server/mail/mail.service';

@Module({
  imports: [MailGunModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailServiceModule {}
