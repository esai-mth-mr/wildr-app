import { Controller, Get } from '@nestjs/common';
import { CategoryTypeDto } from '@verdzie/server/admin/category-type/dto/category-type.dto';
import {
  PostCategoryType,
  toPostCategoryTypeLabel,
} from '@verdzie/server/post-category/postCategory.entity';

@Controller('category-type')
export class CategoryTypeController {
  @Get()
  getAll(): CategoryTypeDto[] {
    const types = [];
    for (const type of Object.values(PostCategoryType)) {
      if (typeof type !== 'string' && toPostCategoryTypeLabel(type)) {
        const typeLabel = toPostCategoryTypeLabel(type);
        if (typeof typeLabel !== 'string') {
          continue;
        }
        types.push({
          type: type,
          label: typeLabel,
        });
      }
    }
    return types;
  }
}
