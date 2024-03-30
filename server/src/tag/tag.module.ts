import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexTagsWorkerModule } from '../worker/index-tags/indexTagsWorker.module';
import { TagResolver } from './tag.resolver';
import { TagSchema } from './tag.schema';
import { TagService } from './tag.service';

@Module({
  imports: [TypeOrmModule.forFeature([TagSchema]), IndexTagsWorkerModule],
  providers: [TagService, TagResolver],
  exports: [TagService],
})
export class TagModule {}
