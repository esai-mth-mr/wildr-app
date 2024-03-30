import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PostCategoryService } from '@verdzie/server/post-category/postCategory.service';
import { PostCategoryEntity } from '@verdzie/server/post-category/postCategory.entity';
import { CreateCategoryBody } from '@verdzie/server/admin/category-interests/adminCategoryInterests.controller';

@Injectable()
export class AdminCategoryInterestsService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly postCategoryService: PostCategoryService
  ) {
    this.logger = this.logger.child({
      context: 'AdminCategoryInterestsService',
    });
  }

  async getCategories(): Promise<PostCategoryEntity[]> {
    return await this.postCategoryService.getAllCategories();
  }

  async addCategory(data: CreateCategoryBody): Promise<boolean> {
    try {
      await this.postCategoryService.createCategory({ ...data });
    } catch (e) {
      //console.log(e);
      return false;
    }
    return true;
  }

  deleteCategory(category: string): boolean {
    this.logger.debug(category);
    return false;
  }
}
