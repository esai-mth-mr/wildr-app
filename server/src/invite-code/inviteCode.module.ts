import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InviteCodeSchema } from './inviteCode.schema';
import { InviteCodeService } from './inviteCode.service';

@Module({
  imports: [TypeOrmModule.forFeature([InviteCodeSchema])],
  providers: [InviteCodeService],
  exports: [InviteCodeService],
})
export class InviteCodeModule {}
