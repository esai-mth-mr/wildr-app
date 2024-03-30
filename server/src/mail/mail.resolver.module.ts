import { Module } from '@nestjs/common';
import { MailResolver } from '@verdzie/server/mail/mail.resolver';
import { MailServiceModule } from '@verdzie/server/mail/mail.service.module';

@Module({
  imports: [MailServiceModule],
  providers: [MailResolver],
  exports: [MailResolver],
})
export class MailResolverModule {}
