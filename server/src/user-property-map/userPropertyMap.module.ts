import { Module } from '@nestjs/common';
import { UserPropertyMapService } from './userPropertyMap.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPropertyMapSchema } from './userPropertyMap.schema';

@Module({
  imports: [TypeOrmModule.forFeature([UserPropertyMapSchema])],
  providers: [UserPropertyMapService],
  exports: [UserPropertyMapService],
})
export class UserPropertyMapModule {}
