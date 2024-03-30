import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitlistEntity } from '@verdzie/server/waitlist/waitlist.entity';
import { WildrcoinWaitlistService } from '@verdzie/server/wildrcoin/wildrcoin-waitlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaitlistEntity])],
  providers: [WildrcoinWaitlistService],
  exports: [WildrcoinWaitlistService],
})
export class WildrcoinWaitlistServiceModule {}
