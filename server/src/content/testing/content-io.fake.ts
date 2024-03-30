import {
  ContentSegmentIO,
  ContentIO,
  TagSegmentIO,
  UserSegmentIO,
  TextSegmentIO,
} from '../content.io';
import { faker } from '@faker-js/faker';

export const tagSegmentIOFake = (
  overrides: Partial<TagSegmentIO> = {}
): TagSegmentIO => ({
  type: 'TagSegmentIO',
  id: faker.random.alphaNumeric(16),
  noSpace: faker.datatype.boolean(),
  ...overrides,
});

export const userSegmentIOFake = (
  overrides: Partial<UserSegmentIO> = {}
): UserSegmentIO => ({
  type: 'UserSegmentIO',
  id: faker.random.alphaNumeric(16),
  ...overrides,
});

export const textSegmentIOFake = (
  overrides: Partial<TextSegmentIO> = {}
): TextSegmentIO => ({
  type: 'TextSegmentIO',
  chunk: faker.lorem.word(),
  noSpace: faker.datatype.boolean(),
  langCode: faker.random.alphaNumeric(2),
  ...overrides,
});

export const contentSegmentIOFake = (
  overrides: Partial<ContentSegmentIO> = {}
): ContentSegmentIO => ({
  segment: faker.helpers.arrayElement([
    tagSegmentIOFake(),
    userSegmentIOFake(),
    textSegmentIOFake(),
  ]),
  ...overrides,
});

export const contentIOFake = (
  overrides: Partial<ContentIO> = {}
): ContentIO => {
  const segments = Array.from({
    length: faker.datatype.number({ min: 0, max: 5 }),
  }).map(_ => contentSegmentIOFake());

  return {
    segments,
    ...overrides,
  };
};
