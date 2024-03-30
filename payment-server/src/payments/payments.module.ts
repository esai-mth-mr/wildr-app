import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonServices } from 'src/common/common.services';
import { Wallets } from 'src/wallets/wallets.entity';
import { PaymentsController } from './payments.controller';
import { Payments } from './payments.entity';
import { PaymentsService } from './payments.service';
import { Tokens } from './tokens.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payments, Wallets, Tokens])],
  controllers: [PaymentsController],
  providers: [PaymentsService, CommonServices],
})
export class PaymentsModule {}