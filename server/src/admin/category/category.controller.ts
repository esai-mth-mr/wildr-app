import { Controller, Get, Param, Post, Body, Put } from '@nestjs/common';
import { CategoryService } from './category.service';
import { PostCategoryEntity } from '@verdzie/server/post-category/postCategory.entity';
import { CreateCategoryDto } from '@verdzie/server/admin/category/dto/create-category.dto';
import { UpdateCategoryDto } from '@verdzie/server/admin/category/dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getAll(): Promise<PostCategoryEntity[]> {
    return await this.categoryService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string): Promise<PostCategoryEntity> {
    return this.categoryService.findOne(id);
  }

  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto
  ): Promise<PostCategoryEntity> {
    return this.categoryService.create({
      name: createCategoryDto.name,
      categoryType: createCategoryDto.type,
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ): Promise<PostCategoryEntity> {
    return this.categoryService.update({
      id,
      name: updateCategoryDto.name,
      categoryType: updateCategoryDto.type,
    });
  }

  @Put(':id/deprecate')
  deprecate(@Param('id') id: string): Promise<PostCategoryEntity> {
    return this.categoryService.deprecate(id);
  }
}
