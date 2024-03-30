import { nanoid } from 'nanoid';
import { UserEntity } from '../user.entity';
import { faker } from '@faker-js/faker';

export function UserEntityFake(
  overrides: Partial<UserEntity> = {}
): UserEntity {
  const user = new UserEntity();

  user.id = nanoid(16);
  user.handle = faker.internet.userName() + faker.random.alphaNumeric(4);
  user.name = faker.name.firstName() + ' ' + faker.name.lastName();
  user.phoneNumber = faker.helpers.arrayElement([
    faker.phone.number(),
    undefined,
  ]);
  user.email = faker.helpers.arrayElement([faker.internet.email(), undefined]);
  user.avatarImage = faker.internet.url();
  user.gender = faker.helpers.arrayElement([0, 1, 2, 3]);
  user.bio = faker.helpers.arrayElement([faker.lorem.sentence(), undefined]);
  user.pronoun = faker.helpers.arrayElement([faker.word.noun(), undefined]);
  user.firebaseUID = faker.random.alphaNumeric(16);
  user.fcmToken = faker.random.alphaNumeric(16);
  user.localizationData = {
    timezoneOffset: '-07:00',
  };

  return Object.assign(user, overrides);
}
