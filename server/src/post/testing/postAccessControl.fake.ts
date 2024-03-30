import {
  PostAccessControl,
  CommentPostingAccessData,
  CommentVisibilityAccessData,
  PostVisibilityAccessData,
  RepostAccessData,
} from '../postAccessControl';
import { faker } from '@faker-js/faker';

export const commentPostingAccessDataFake = (
  overrides?: Partial<CommentPostingAccessData>
): CommentPostingAccessData => {
  return {
    access: faker.datatype.number({ min: 0, max: 5 }),
    listIds: [],
    ...overrides,
  };
};

export const repostAccessDataFake = (
  overrides?: Partial<RepostAccessData>
): RepostAccessData => {
  return {
    access: faker.datatype.number({ min: 0, max: 5 }),
    listIds: [],
    ...overrides,
  };
};

export const commentVisibilityAccessDataFake = (
  overrides?: Partial<CommentVisibilityAccessData>
): CommentVisibilityAccessData => {
  return {
    access: faker.datatype.number({ min: 0, max: 5 }),
    listIds: [],
    ...overrides,
  };
};

export const postVisibilityAccessDataFake = (
  overrides?: Partial<PostVisibilityAccessData>
): PostVisibilityAccessData => {
  return {
    access: faker.datatype.number({ min: 2, max: 5 }),
    listIds: [],
    ...overrides,
  };
};

export const postAccessControlFake = (
  overrides?: Partial<PostAccessControl>
): PostAccessControl => {
  return {
    postVisibilityAccessData: postVisibilityAccessDataFake(),
    commentVisibilityAccessData: commentVisibilityAccessDataFake(),
    commentPostingAccessData: commentPostingAccessDataFake(),
    repostAccessData: repostAccessDataFake(),
    ...overrides,
  };
};
