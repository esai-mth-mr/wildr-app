import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { PostCategoryEntity } from '@verdzie/server/post-category/postCategory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostCategoryEntity])],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
