import { Module } from '@nestjs/common';
import { CategoryTypeController } from './category-type.controller';

@Module({
  controllers: [CategoryTypeController],
})
export class CategoryTypeModule {}
