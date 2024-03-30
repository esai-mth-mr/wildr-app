import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonServices } from 'src/common/common.services';
import { TippingController } from './tipping.controller';
import { TippingService } from './tipping.service';
import { Tipping } from './tipping.entity';
import { Wallets } from 'src/wallets/wallets.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tipping, Wallets])],
  controllers: [TippingController],
  providers: [TippingService, CommonServices],
})
export class TippingModule {}