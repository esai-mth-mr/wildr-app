import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedSchema } from './feed.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitiesWithPagesModule } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.module';

@Module({
  imports: [TypeOrmModule.forFeature([FeedSchema]), EntitiesWithPagesModule],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
