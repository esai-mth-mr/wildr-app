import { faker } from '@faker-js/faker';
import { ID_SEPARATOR, generateId } from '@verdzie/server/common/generateId';
import {
  TimepointEntity,
  TimepointState,
} from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.entity';

export function TimepointEntityFake(
  overrides: Partial<TimepointEntity> = {}
): TimepointEntity {
  return new TimepointEntity({
    id:
      faker.date.future().getHours() +
      ID_SEPARATOR +
      generateId() +
      ID_SEPARATOR +
      faker.random.numeric(1),
    processMetadata: {
      startDate: faker.date.past(),
      lastProcessedAt: faker.date.past(),
      expirationDate: faker.date.future(),
    },
    state: faker.helpers.arrayElement([
      TimepointState.ACTIVE,
      TimepointState.TO_BE_ARCHIVED,
    ]),
    ...overrides,
  });
}
