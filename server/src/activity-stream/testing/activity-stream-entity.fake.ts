import { faker } from '@faker-js/faker';
import { ActivityStreamEntity } from '@verdzie/server/activity-stream/activity.stream.entity';

export function ActivityStreamEntityFake(
  overrides: Partial<ActivityStreamEntity> = {}
): ActivityStreamEntity {
  const activityStream = new ActivityStreamEntity();
  activityStream.id = faker.random.alphaNumeric(16);
  activityStream.activities = [];
  return Object.assign(activityStream, overrides);
}
