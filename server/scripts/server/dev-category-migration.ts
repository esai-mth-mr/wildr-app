import '../../env/admin-local-config';
import '../../tsconfig-paths-bootstrap';

import {
  PostCategoryEntity,
  PostCategoryType,
} from '@verdzie/server/post-category/postCategory.entity';
import config from '@verdzie/server/typeorm/typeormconfig-wildr';
import chalk from 'chalk';
import { nanoid } from 'nanoid';
import { createConnection } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const devCategories = [
  {
    id: 'K0eZO8-ZmxAVOIR6',
    name: 'fitness',
    created_at: '2022-08-18 18:45:29.034+00',
    type: 2,
    deprecated: false,
  },
  {
    id: 'gJBIxqNteB2mbolL',
    name: 'art',
    created_at: '2022-08-18 16:47:03.073+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'rbG2QxjxpN7kmH4E',
    name: 'photography',
    created_at: '2023-07-13 21:12:35.986+00',
    type: 4,
    deprecated: false,
  },
  {
    id: '6uDilPbDBIykj49d',
    name: 'crafts & DIY',
    created_at: '2022-08-26 23:43:04.639+00',
    type: 4,
    deprecated: false,
  },
  {
    id: '0JO1zxRyvuwBbq0i',
    name: 'dance',
    created_at: '2022-08-18 16:47:57.059+00',
    type: 4,
    deprecated: false,
  },
  {
    id: 'NijlNP_fdvK9AjrY',
    name: 'film',
    created_at: '2022-08-18 16:47:51.079+00',
    type: 4,
    deprecated: false,
  },
  {
    id: 'n9HLPBgRI3yV2-ke',
    name: 'christianity',
    created_at: '2022-10-13 01:11:28.476+00',
    type: 1,
    deprecated: true,
  },
  {
    id: '4xHHjydpw9Wp9pQc',
    name: 'islam',
    created_at: '2022-10-13 01:11:34.915+00',
    type: 1,
    deprecated: true,
  },
  {
    id: '4CJ7YJ9GN5AcZlAB',
    name: 'buddhism',
    created_at: '2022-10-13 01:15:05.374+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'Gz9oUBuCoMhTFCTZ',
    name: 'comedy',
    created_at: '2022-08-18 16:48:04.76+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'aarcK9M00Z95CjAq',
    name: 'philosophy',
    created_at: '2022-08-18 16:48:22.916+00',
    type: 1,
    deprecated: true,
  },
  {
    id: '6igR9R8TQQpJhjbq',
    name: 'spirituality',
    created_at: '2022-08-18 16:48:29.505+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'QJ05PCkz6SPqqsQv',
    name: 'visual art',
    created_at: '2022-08-18 16:47:34.082+00',
    type: 4,
    deprecated: false,
  },
  {
    id: 'fqQ9h-Qm1DS0GRze',
    name: 'music',
    created_at: '2022-08-18 16:47:15.073+00',
    type: 4,
    deprecated: false,
  },
  {
    id: 'tj72o3teJYNeXD8c',
    name: 'technology',
    created_at: '2022-08-18 17:17:08.235+00',
    type: 3,
    deprecated: false,
  },
  {
    id: 'XMrU4fawWKP2A9xO',
    name: 'writing',
    created_at: '2022-08-18 16:47:08.844+00',
    type: 3,
    deprecated: false,
  },
  {
    id: 'K0eZO8-ZmxAVOIR8',
    name: 'Sadhana',
    created_at: '2023-08-03 00:00:00+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'WGCEV4IVg48Ac0bx',
    name: 'miscellaneous',
    created_at: '2022-08-18 17:18:45.195+00',
    type: 1,
    deprecated: true,
  },
  {
    id: '4A3Xs90fmO6ILklL',
    name: 'politics',
    created_at: '2022-08-25 22:15:22.596+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'DTtvdhaVM1HlmgLE',
    name: 'vlogs',
    created_at: '2022-08-18 16:48:17.285+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'Sj3E46gMuOCU0euQ',
    name: 'cars',
    created_at: '2022-08-18 19:43:37.872+00',
    type: 1,
    deprecated: true,
  },
  {
    id: '-K5lVM5oZg9JxZqs',
    name: 'lifestyle',
    created_at: '2022-08-18 16:48:10.853+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'Ot-MwsTPK0iLZU-C',
    name: 'beauty',
    created_at: '2022-08-18 16:47:44.611+00',
    type: 1,
    deprecated: false,
  },
  {
    id: '-90EsvL31zBrC9VR',
    name: 'hinduism',
    created_at: '2022-10-13 01:11:20.6+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'bB07Akc5I0JT9pEv',
    name: 'sports',
    created_at: '2022-08-18 16:47:21.804+00',
    type: 2,
    deprecated: false,
  },
  {
    id: 'Xier19aDzHzpdt99',
    name: 'adventure',
    created_at: '2022-08-18 18:54:36.51+00',
    type: 2,
    deprecated: false,
  },
  {
    id: 'SVy1x4ti2d5Xdym_',
    name: 'travel',
    created_at: '2022-08-18 16:48:44.989+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'iqSQpX5q-tYUgwH-',
    name: 'pets',
    created_at: '2022-08-18 16:46:38.236+00',
    type: 1,
    deprecated: false,
  },
  {
    id: '1rtqLLuT52_2OL90',
    name: 'food',
    created_at: '2022-08-18 18:54:02.87+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'VkQcej_ZUWs6brGm',
    name: 'nature',
    created_at: '2022-08-25 22:14:54.697+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'j2DKr699hATTydzm',
    name: 'social',
    created_at: '2023-07-13 21:12:34.662+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'mJb7S-1GAmRKKcNk',
    name: 'mental health',
    created_at: '2023-07-13 21:12:34.859+00',
    type: 2,
    deprecated: false,
  },
  {
    id: 'IRqpx7xgFiWfYmal',
    name: 'selfcare',
    created_at: '2023-07-13 21:12:35.046+00',
    type: 2,
    deprecated: false,
  },
  {
    id: 'PdvrZi0dQzGFy2VP',
    name: 'meditation',
    created_at: '2023-07-13 21:12:35.237+00',
    type: 2,
    deprecated: false,
  },
  {
    id: 'shCGwJwd1XkIRWYt',
    name: 'reading',
    created_at: '2023-07-13 21:12:35.425+00',
    type: 3,
    deprecated: false,
  },
  {
    id: '6q_jov2MGXrZRTfH',
    name: 'science',
    created_at: '2023-07-13 21:12:35.61+00',
    type: 3,
    deprecated: false,
  },
  {
    id: 'BUkdjVBjZwGjSTFb',
    name: 'business',
    created_at: '2023-07-13 21:12:35.799+00',
    type: 3,
    deprecated: false,
  },
  {
    id: 'Z3dpbO4DZk2Vjg46',
    name: 'trending',
    created_at: '2023-07-13 21:12:36.169+00',
    type: 0,
    deprecated: false,
  },
  {
    id: 'RibXXTwUNCmvHcfX',
    name: 'other',
    created_at: '2023-07-13 21:12:36.372+00',
    type: 0,
    deprecated: false,
  },
  {
    id: 'DB_1a0BxI8R8yryH',
    name: 'fashion',
    created_at: '2022-08-18 16:46:48.647+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'i8bC6ahtV-ZMGRQV',
    name: 'gaming',
    created_at: '2022-08-18 16:46:55.552+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'EWAZzSdJ-J6voE2_',
    name: 'cooking',
    created_at: '2022-08-18 18:54:07.463+00',
    type: 1,
    deprecated: false,
  },
];

type UpdateMap = {
  [key: string]: {
    name?: string;
    type?: PostCategoryType;
    deprecated?: boolean;
    actions?: {
      mergeWith?: string;
    };
  };
};

const devUpdateMap: UpdateMap = {
  fitness: {
    name: 'Fitness & Exercise',
    type: PostCategoryType.HEALTH_WELLNESS,
  },
  beauty: {
    name: 'Fashion & Style',
    type: PostCategoryType.LIFESTYLE_PERSONAL,
  },
  Nature: {
    name: 'Travel',
    type: PostCategoryType.LIFESTYLE_PERSONAL,
  },
  Pets: {
    name: 'Pets & Animals',
    type: PostCategoryType.LIFESTYLE_PERSONAL,
  },
  Food: {
    name: 'Food & Cooking',
    type: PostCategoryType.LIFESTYLE_PERSONAL,
  },
  cooking: {
    deprecated: true,
    actions: {
      mergeWith: 'Food & Cooking',
    },
  },
  fashion: {
    deprecated: true,
    actions: {
      mergeWith: 'Fashion & Style',
    },
  },
  gaming: {
    name: 'Gaming & ESports',
    type: PostCategoryType.LEISURE_HOBBIES,
  },
  music: {
    name: 'Music',
    type: PostCategoryType.LEISURE_HOBBIES,
  },
  sports: {
    name: 'Sports',
    type: PostCategoryType.LEISURE_HOBBIES,
  },
  technology: {
    name: 'Science & Tech',
    type: PostCategoryType.EDUCATION_LEARNING,
  },
  writing: {
    name: 'Books & Courses',
    type: PostCategoryType.EDUCATION_LEARNING,
  },
  Travel: {
    deprecated: true,
    actions: {
      mergeWith: 'Travel',
    },
  },
  religion: {
    deprecated: true,
  },
  sadhana: {
    deprecated: true,
  },
  social: {
    deprecated: true,
  },
  science: {
    deprecated: true,
    actions: {
      mergeWith: 'Science & Tech',
    },
  },
  reading: {
    deprecated: true,
    actions: {
      mergeWith: 'Books & Courses',
    },
  },
  'visual art': {
    deprecated: true,
    actions: {
      mergeWith: 'Visual Arts',
    },
  },
  meditation: {
    name: 'Mental Health',
    type: PostCategoryType.HEALTH_WELLNESS,
  },
  'mental health': {
    deprecated: true,
    actions: {
      mergeWith: 'Mental Health',
    },
  },
  selfcare: {
    name: 'Nutrition & Diet',
    type: PostCategoryType.HEALTH_WELLNESS,
  },
  business: {
    name: 'Earning & Business',
    type: PostCategoryType.FINANCE_INCOME,
  },
  photography: {
    name: 'Photography',
    type: PostCategoryType.ART_ENTERTAINMENT,
  },
  film: {
    name: 'Movies & TV',
    type: PostCategoryType.LEISURE_HOBBIES,
  },
  dance: {
    deprecated: true,
    actions: {
      mergeWith: 'Music',
    },
  },
  'crafts & DIY': {
    name: 'Crafts & DIY',
    type: PostCategoryType.EDUCATION_LEARNING,
  },
  other: {
    name: 'Other Interests',
    type: PostCategoryType.MISC,
  },
  trending: {
    deprecated: true,
    actions: {
      mergeWith: 'Emerging Trends',
    },
  },
  habits: {
    name: 'Habits',
    type: PostCategoryType.HEALTH_WELLNESS,
  },
  Adventure: {
    deprecated: true,
    actions: {
      mergeWith: 'Travel',
    },
  },
  comedy: {
    deprecated: false,
    name: 'Comedy & Humor',
    type: PostCategoryType.ART_ENTERTAINMENT,
    actions: {
      mergeWith: 'Comedy & Humor',
    },
  },
};

const newDevCategories = [
  {
    name: 'Personal Finance',
    type: PostCategoryType.FINANCE_INCOME,
  },
  {
    name: 'Financial Markets',
    type: PostCategoryType.FINANCE_INCOME,
  },
  {
    name: 'Career Advice',
    type: PostCategoryType.FINANCE_INCOME,
  },
  {
    name: 'Pop Culture',
    type: PostCategoryType.ART_ENTERTAINMENT,
  },
  {
    name: 'Productivity Tips',
    type: PostCategoryType.EDUCATION_LEARNING,
  },
];

async function main() {
  const conn = await createConnection(config as PostgresConnectionOptions);
  const categoryRepo = conn.getRepository(PostCategoryEntity);
  for (const update of Object.entries(devUpdateMap)) {
    const [name, updateData] = update;
    const category = devCategories.find(
      c => c.name.toLowerCase() === name.toLowerCase()
    );
    if (!category) {
      console.log(chalk.red(`Could not find category ${name}`));
      continue;
    }
    if (updateData.deprecated) {
      console.log(chalk.blue(`Deprecating category ${name}`));
      await categoryRepo.update(category.id, { deprecated: true });
    } else {
      console.log(chalk.blue(`Updating category ${name}`));
      const categoryUpdates = await categoryRepo.findOneOrFail(category.id);
      if (updateData.name) categoryUpdates.name = updateData.name;
      if (updateData.type) categoryUpdates.type = updateData.type;
      if (updateData.deprecated !== undefined) {
        categoryUpdates.deprecated = updateData.deprecated;
      }
      await categoryRepo.update(category.id, categoryUpdates);
    }
  }
  for (const newCategory of newDevCategories) {
    console.log(chalk.blue(`Creating category ${newCategory.name}`));
    const existingCategory = await categoryRepo.findOne({
      where: { name: newCategory.name },
    });
    if (existingCategory) {
      console.log(chalk.yellow(`Category ${newCategory.name} already exists`));
      continue;
    }
    const c = new PostCategoryEntity();
    c.id = nanoid(16);
    if (newCategory.name) c.name = newCategory.name;
    if (newCategory.type) c.type = newCategory.type;
    c.createdAt = new Date();
    await categoryRepo.insert(c);
  }
  await conn.close();
}

main();
