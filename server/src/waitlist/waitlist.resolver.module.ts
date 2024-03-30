import { Module } from '@nestjs/common';
import { WaitlistResolver } from '@verdzie/server/waitlist/waitlist.resolver';
import { WildrcoinWaitlistServiceModule } from '@verdzie/server/wildrcoin/wildrcoin-waitlist.service.module';

@Module({
  imports: [WildrcoinWaitlistServiceModule],
  providers: [WaitlistResolver],
  exports: [WaitlistResolver],
})
export class WaitlistResolverModule {}
