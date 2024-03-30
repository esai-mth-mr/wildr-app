import { faker } from '@faker-js/faker';
import { PostEntityStats } from '../postStats';

export const postStatsFake = (): PostEntityStats => {
  return {
    likeCount: faker.datatype.number(),
    realCount: faker.datatype.number(),
    applauseCount: faker.datatype.number(),
    shareCount: faker.datatype.number(),
    repostCount: faker.datatype.number(),
    commentCount: faker.datatype.number(),
    reportCount: faker.datatype.number(),
  };
};
