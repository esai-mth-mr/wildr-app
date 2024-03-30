import { Content } from '@verdzie/server/graphql';
import { faker } from '@faker-js/faker';

export function ContentFake(overrides: Partial<Content> = {}): Content {
  return {
    segments: Array.from({ length: faker.datatype.number({ min: 0, max: 5 }) }),
    ...overrides,
  };
}
