import { ReplyEntity } from '../reply.entity';
import { contentIOFake } from '../../content/testing/content-io.fake';
import { activityDataFake } from '../../activity/testing/activity-data.fake';
import { faker } from '@faker-js/faker';

export function ReplyEntityFake(overrides?: Partial<ReplyEntity>): ReplyEntity {
  const reply = new ReplyEntity();

  reply.id = faker.random.alphaNumeric(16);
  reply.authorId = faker.random.alphaNumeric(16);
  reply.createdAt = faker.date.past();
  reply.updatedAt = faker.date.past();
  reply.content = contentIOFake();
  reply.body = faker.lorem.sentence();
  reply.activityData = activityDataFake();

  return Object.assign(reply, overrides);
}
