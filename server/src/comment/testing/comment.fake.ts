import { ParticipationType, Comment } from '@verdzie/server/graphql';
import { faker } from '@faker-js/faker';
import { ContentFake } from '@verdzie/server/content/testing/content.fake';

export function CommentFake(overrides: Partial<Comment> = {}): Comment {
  return {
    id: faker.random.alphaNumeric(16),
    ts: {
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
    },
    body: ContentFake(),
    participationType: ParticipationType.OPEN,
    ...overrides,
  };
}
