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

const prodCategories = [
  {
    id: 'w3w_XX-H3MI5KBMw',
    name: 'Mountains',
    created_at: '2023-08-02 15:14:34.537+00',
    type: 1,
    deprecated: true,
  },
  {
    id: '1108Q_b9QTIe6i7K',
    name: 'art',
    created_at: '2022-08-31 01:50:40.077+00',
    type: 4,
    deprecated: true,
  },
  {
    id: 'NM_txJbCvJepQ5I4',
    name: 'Adventure',
    created_at: '2022-08-31 01:50:40.183+00',
    type: 1,
    deprecated: true,
  },
  {
    id: '4jS51i02Qzlk4G0I',
    name: 'International Music',
    created_at: '2022-10-14 18:17:05.025+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'gvv_qd-zz_ZG1n7V',
    name: 'Christianity',
    created_at: '2022-10-12 19:52:34.871+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'fbigF49FyRGpsf_V',
    name: 'Hinduism',
    created_at: '2022-10-12 19:48:38.394+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'If4aCkmMe100fzGQ',
    name: 'Buddhism',
    created_at: '2022-10-12 19:49:00.138+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 't0JtcB7NVD6_htjk',
    name: 'Judaism',
    created_at: '2022-10-12 19:49:57.049+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'Vai5NfXf1RMx5kHI',
    name: 'Islam',
    created_at: '2022-10-12 19:48:46.533+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'Sy8OQweoeWp5ewJX',
    name: 'cars',
    created_at: '2022-08-31 01:50:40.401+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'hkGPFnqANuWR7dGW',
    name: 'everything else',
    created_at: '2022-08-31 01:50:40.891+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'QBQBqMPqLXC_aM8p',
    name: 'politics',
    created_at: '2022-08-31 01:50:41.951+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'JE1vidhqOo4CO4H1',
    name: 'Philosophy',
    created_at: '2022-09-07 22:17:36.379+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'yT8LhsFm3-c4eA2H',
    name: 'Quotes',
    created_at: '2022-10-12 19:54:05.172+00',
    type: 3,
    deprecated: true,
  },
  {
    id: 'AI1Vh4GETCRqhsrq',
    name: 'Wisdom',
    created_at: '2022-09-07 22:32:06.88+00',
    type: 1,
    deprecated: true,
  },
  {
    id: 'sfIRdOtcrhPdS0MJ',
    name: 'comedy',
    created_at: '2022-08-31 01:50:40.498+00',
    type: 1,
    deprecated: true,
  },
  {
    id: '6LAxurTL18Ap84ik',
    name: 'Memes',
    created_at: '2022-09-28 20:50:28.808+00',
    type: 0,
    deprecated: true,
  },
  {
    id: 'BuFQjX6Ml-gHGpye',
    name: 'beauty',
    created_at: '2022-08-31 01:50:40.29+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'd0ApTvK7-Zja-B82',
    name: 'Nature',
    created_at: '2022-08-31 01:50:41.756+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'PNBUgQ_Et5rBvExz',
    name: 'Pets',
    created_at: '2022-08-31 01:50:41.664+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'jl8cjnDo5uol97qu',
    name: 'Food',
    created_at: '2022-08-31 01:50:41.278+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'bVOiG1GsHw_UMa2O',
    name: 'cooking',
    created_at: '2022-08-31 01:50:40.594+00',
    type: 1,
    deprecated: false,
  },
  {
    id: '40QOok4q7zxtlUpe',
    name: 'fashion',
    created_at: '2022-08-31 01:50:41.082+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'zYVnPXQCCNg2S-zs',
    name: 'gaming',
    created_at: '2022-08-31 01:50:41.375+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'zWYTOE7AGCL2mcSM',
    name: 'music',
    created_at: '2022-08-31 01:50:41.466+00',
    type: 1,
    deprecated: false,
  },
  {
    id: '3-uK4bOl7KxXZxcC',
    name: 'sports',
    created_at: '2022-08-31 01:50:41.848+00',
    type: 1,
    deprecated: false,
  },
  {
    id: '-_c81YuIL3Y6hnSM',
    name: 'technology',
    created_at: '2022-08-31 01:50:42.052+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'WnjXfhXtSJ9FGpO8',
    name: 'writing',
    created_at: '2022-08-31 01:50:42.147+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'KolOIxk5eWlRJ73S',
    name: 'Travel',
    created_at: '2022-09-07 22:19:20.353+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'kibtAL6LKBBJyLG-',
    name: 'religion',
    created_at: '2022-09-07 22:18:05.391+00',
    type: 1,
    deprecated: false,
  },
  {
    id: '2LnXLoLsypX1y4wd',
    name: 'social',
    created_at: '2023-08-02 16:05:15.097+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'SysCwwgRXCSi2_TB',
    name: 'science',
    created_at: '2023-08-02 16:05:57.729+00',
    type: 1,
    deprecated: false,
  },
  {
    id: 'Nu7a8fx_zMe7eLPA',
    name: 'fitness',
    created_at: '2022-08-31 01:50:41.182+00',
    type: 2,
    deprecated: false,
  },
  {
    id: 'DuGUELuvmxEv0xnQ',
    name: 'reading',
    created_at: '2022-09-28 18:46:34.776+00',
    type: 3,
    deprecated: false,
  },
  {
    id: 'NKJPGs4eoj6Z1XUQ',
    name: 'visual arts',
    created_at: '2023-08-02 16:06:23.915+00',
    type: 4,
    deprecated: false,
  },
  {
    id: 'Sgt1hSGkdccWRN3O',
    name: 'meditation',
    created_at: '2023-08-02 16:05:31.824+00',
    type: 2,
    deprecated: false,
  },
  {
    id: 'LH_5q9EK2-ZTPXFG',
    name: 'mental health',
    created_at: '2023-08-02 16:05:40.185+00',
    type: 2,
    deprecated: false,
  },
  {
    id: '7pyjek9r4Mmn0Q_v',
    name: 'selfcare',
    created_at: '2023-08-02 16:05:28.119+00',
    type: 2,
    deprecated: false,
  },
  {
    id: 'mv5quqaYNrKz_2H6',
    name: 'business',
    created_at: '2023-08-02 16:05:52.778+00',
    type: 3,
    deprecated: false,
  },
  {
    id: '3hwx95INsUmUPVG8',
    name: 'photography',
    created_at: '2023-08-02 16:06:16.568+00',
    type: 4,
    deprecated: false,
  },
  {
    id: 'vl5YgLqG5h0kGZi6',
    name: 'film',
    created_at: '2022-08-31 01:50:40.982+00',
    type: 4,
    deprecated: false,
  },
  {
    id: 'iPvcv-mgG6iohdlx',
    name: 'dance',
    created_at: '2022-08-31 01:50:40.794+00',
    type: 4,
    deprecated: false,
  },
  {
    id: '1aG6MyyQyDLsvxXQ',
    name: 'crafts & DIY',
    created_at: '2022-08-31 01:50:40.697+00',
    type: 4,
    deprecated: false,
  },
  {
    id: 'zpilZZjJfhzCxwPJ',
    name: 'other',
    created_at: '2022-08-31 01:50:41.563+00',
    type: 0,
    deprecated: false,
  },
  {
    id: 'FgYZBxRb0V-U-S7M',
    name: 'memes',
    created_at: '2023-08-02 16:06:40.385+00',
    type: 0,
    deprecated: false,
  },
  {
    id: 'tmDB5MV-YgdBZzzG',
    name: 'trending',
    created_at: '2023-08-02 16:06:35.049+00',
    type: 0,
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

const prodUpdateMap: UpdateMap = {
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
  'visual arts': {
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
  memes: {
    name: 'Emerging Trends',
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
  Mountains: {
    deprecated: true,
    actions: {
      mergeWith: 'Travel',
    },
  },
  Adventure: {
    deprecated: true,
    actions: {
      mergeWith: 'Travel',
    },
  },
  'International Music': {
    deprecated: true,
    actions: {
      mergeWith: 'Music',
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

const newProdCategories = [
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
    Name: 'Pop Culture',
    type: PostCategoryType.ART_ENTERTAINMENT,
  },
  {
    Name: 'Productivity Tips',
    type: PostCategoryType.EDUCATION_LEARNING,
  },
];

async function main() {
  const conn = await createConnection(config as PostgresConnectionOptions);
  const categoryRepo = conn.getRepository(PostCategoryEntity);
  for (const update of Object.entries(prodUpdateMap)) {
    const [name, updateData] = update;
    const category = prodCategories.find(
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
  for (const newCategory of newProdCategories) {
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
