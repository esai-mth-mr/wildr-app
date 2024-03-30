import '../../tsconfig-paths-bootstrap';
import * as dotenv from 'dotenv';
import '../../env/admin-local-config';

import { updateCategory } from '@verdzie/scripts/admin/util/category.utils';
import { getAllCategories } from '@verdzie/scripts/admin/util/category.utils';
import { PostCategoryEntity } from '@verdzie/server/post-category/postCategory.entity';

function hasUpperCase(s: string) {
  return s !== s.toLowerCase();
}

async function main() {
  const categories: PostCategoryEntity[] = await getAllCategories();
  for (const category of categories) {
    if (hasUpperCase(category.name)) {
      const data = await updateCategory({
        id: category.id,
        name: category.name.toLowerCase(),
        type: category.type,
      });
      console.log(data);
    }
  }
}

main();
