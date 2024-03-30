import '../../tsconfig-paths-bootstrap';
import * as dotenv from 'dotenv';
import env from '../../env/admin-local-config';

import { createCategory } from '@verdzie/scripts/admin/util/category.utils';
import { PostCategoryLabel } from '@verdzie/server/post-category/postCategory.entity';

const categories: {
  name: string;
  label: PostCategoryLabel;
}[] = [
  {
    name: 'Business',
    label: 'Finance & Income',
  },
  {
    name: 'Personal Finance',
    label: 'Finance & Income',
  },
  {
    name: 'Financial Markets',
    label: 'Finance & Income',
  },
  {
    name: 'Career Advice',
    label: 'Finance & Income',
  },
  {
    name: 'Fitness & Exercise',
    label: 'Health & Wellness',
  },
  {
    name: 'Nutrition & Diet',
    label: 'Health & Wellness',
  },
  {
    name: 'Mental Health',
    label: 'Health & Wellness',
  },
  {
    name: 'Habits & Wellness',
    label: 'Health & Wellness',
  },
  {
    name: 'Comedy & Humor',
    label: 'Art & Entertainment',
  },
  {
    name: 'Music',
    label: 'Art & Entertainment',
  },
  {
    name: 'Movies & TV',
    label: 'Art & Entertainment',
  },
  {
    name: 'Visual Arts',
    label: 'Art & Entertainment',
  },
  {
    name: 'Pop Culture',
    label: 'Art & Entertainment',
  },
  {
    name: 'Photography',
    label: 'Art & Entertainment',
  },
  {
    name: 'Productivity Tips',
    label: 'Education & Learning',
  },
  {
    name: 'Books & Courses',
    label: 'Education & Learning',
  },
  {
    name: 'Science & Tech',
    label: 'Education & Learning',
  },
  {
    name: 'Travel',
    label: 'Lifestyle & Personal',
  },
  {
    name: 'Food & Cooking',
    label: 'Lifestyle & Personal',
  },
  {
    name: 'Fashion & Style',
    label: 'Lifestyle & Personal',
  },
  {
    name: 'Pets & Animals',
    label: 'Lifestyle & Personal',
  },
  {
    name: 'Gaming',
    label: 'Leisure & Hobbies',
  },
  {
    name: 'Sports',
    label: 'Leisure & Hobbies',
  },
  {
    name: 'Emerging Trends',
    label: 'Miscellaneous',
  },
  {
    name: 'Other Interests',
    label: 'Miscellaneous',
  },
];

async function main() {
  for (const category of categories) {
    await createCategory(category);
  }
}

main();
