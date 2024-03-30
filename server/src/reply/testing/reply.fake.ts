import { Reply } from '@verdzie/server/graphql';
import { faker } from '@faker-js/faker';
import { ContentFake } from '@verdzie/server/content/testing/content.fake';

export function ReplyFake(overrides: Partial<Reply> = {}): Reply {
  return {
    id: faker.random.alphaNumeric(16),
    ts: {
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
    },
    body: ContentFake(),
    ...overrides,
  };
}
