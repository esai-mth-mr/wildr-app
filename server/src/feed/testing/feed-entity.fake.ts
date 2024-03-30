import { faker } from '@faker-js/faker';
import { FeedEntity, FeedPage } from '../feed.entity';

export function FeedPageFake(overrides: Partial<FeedPage> = {}): FeedPage {
  const ids = Array.from({ length: 10 }, () => faker.random.alphaNumeric(16));
  return {
    ids,
    idsWithScore: { idsMap: {} },
    lastSeenCursor: faker.random.alphaNumeric(16),
    ...overrides,
  };
}

export function FeedEntityFake(
  overrides: Partial<FeedEntity> = {}
): FeedEntity {
  const feed = new FeedEntity();
  feed.id = faker.random.alphaNumeric(16);

  return Object.assign(feed, overrides);
}
