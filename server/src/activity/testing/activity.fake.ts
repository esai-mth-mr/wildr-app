import { faker } from '@faker-js/faker';
import { Activity } from '@verdzie/server/activity/activity';

export function ActivityFake(overrides?: Partial<Activity>): Activity {
  const activity = new Activity();
  activity.id = faker.random.alphaNumeric(16);
  activity.type = faker.helpers.arrayElement([0, 1, 2, 3]);
  activity.createdAt = faker.date.past();
  activity.updatedAt = faker.date.past();
  activity.totalCount = 0;
  activity.subjectIds = [];
  activity.objectId = faker.random.alphaNumeric(16);
  activity.objectType = faker.helpers.arrayElement([0, 1, 2, 3]);
  activity.miscId = faker.random.alphaNumeric(16);
  activity.miscObjectType = faker.helpers.arrayElement([0, 1, 2, 3]);
  activity.postId = faker.random.alphaNumeric(16);
  activity.commentId = faker.random.alphaNumeric(16);
  activity.replyId = faker.random.alphaNumeric(16);
  activity.reportId = faker.random.alphaNumeric(16);
  activity.verb = faker.helpers.arrayElement([0, 1, 2, 3]);
  activity.metaEvent = faker.helpers.arrayElement([0, 1, 2, 3]);
  activity.deletedIds = [];
  activity.contentBody = faker.lorem.sentence();
  activity.displayBodyStr = faker.lorem.sentence();
  return Object.assign(activity, overrides);
}
