import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallets } from './wallets.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wallets])],
  controllers: [WalletsController],
  providers: [WalletsService],
})
export class WalletsModule {}