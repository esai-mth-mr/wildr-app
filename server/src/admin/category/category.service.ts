import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { generateId } from '@verdzie/server/common/generateId';
import {
  PostCategoryEntity,
  PostCategoryType,
} from '@verdzie/server/post-category/postCategory.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(PostCategoryEntity)
    private categoryRepository: Repository<PostCategoryEntity>
  ) {}

  findAll(): Promise<PostCategoryEntity[]> {
    return this.categoryRepository.find();
  }

  findOne(id: string): Promise<PostCategoryEntity> {
    return this.categoryRepository.findOneOrFail(id);
  }

  async create({
    name,
    categoryType,
  }: {
    name: string;
    categoryType: PostCategoryType;
  }): Promise<PostCategoryEntity> {
    return this.categoryRepository.save({
      id: generateId(),
      name,
      _type: categoryType,
      createdAt: new Date(),
    });
  }

  async update({
    id,
    name,
    categoryType,
  }: {
    id: string;
    name: string;
    categoryType?: PostCategoryType;
  }): Promise<PostCategoryEntity> {
    const category = await this.categoryRepository.findOne(id);
    if (!category) throw new NotFoundException('Category not found');
    category.name = name;
    category.type = categoryType || category.type;
    return this.categoryRepository.save(category);
  }

  async deprecate(id: string): Promise<PostCategoryEntity> {
    const category = await this.categoryRepository.findOne(id);
    if (!category) throw new NotFoundException('Category not found');
    category.deprecated = true;
    return this.categoryRepository.save(category);
  }
}
