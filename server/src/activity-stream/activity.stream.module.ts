import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityStreamSchema } from './activity.stream.schema';
import { ActivityStreamService } from './activity.stream.service';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityStreamSchema])],
  providers: [ActivityStreamService],
  exports: [ActivityStreamService],
})
export class ActivityStreamModule {}
