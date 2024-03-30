import { generateId } from '@verdzie/server/common/generateId';
import { PostCategoryEntity, PostCategoryType } from '../postCategory.entity';
import { faker } from '@faker-js/faker';

export function PostCategoryEntityFake(
  overrides: Partial<PostCategoryEntity> = {}
): PostCategoryEntity {
  const category = new PostCategoryEntity();
  category.id = generateId();
  category.name = faker.word.adjective();
  category.createdAt = faker.date.past();
  category._type = faker.helpers.arrayElement([
    PostCategoryType.ART_ENTERTAINMENT,
    PostCategoryType.EDUCATION_LEARNING,
    PostCategoryType.HEALTH_WELLNESS,
    PostCategoryType.MISC,
    PostCategoryType.LIFESTYLE_PERSONAL,
  ]);
  category.deprecated = faker.helpers.arrayElement([false, undefined]);
  return Object.assign(category, overrides);
}
