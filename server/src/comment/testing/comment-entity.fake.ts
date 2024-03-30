import { CommentEntity } from '../comment.entity';
import { contentIOFake } from '../../content/testing/content-io.fake';
import { activityDataFake } from '../../activity/testing/activity-data.fake';
import { faker } from '@faker-js/faker';

export function CommentEntityFake(
  overrides?: Partial<CommentEntity>
): CommentEntity {
  const comment = new CommentEntity();

  comment.id = faker.random.alphaNumeric(16);
  comment.authorId = faker.random.alphaNumeric(16);
  comment.createdAt = faker.date.past();
  comment.updatedAt = faker.date.past();
  comment.content = contentIOFake();
  comment.body = faker.lorem.sentence();
  comment.activityData = activityDataFake();

  return Object.assign(comment, overrides);
}
