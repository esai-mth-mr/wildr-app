import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserModule } from '@verdzie/server/user/user.module';
import { UserTimezoneUpdateConsumer } from '@verdzie/server/worker/user-timezone-update/user-timezone-update.consumer';
import {
  USER_TIMEZONE_UPDATE_QUEUE_NAME,
  UserTimezoneUpdateProducer,
} from '@verdzie/server/worker/user-timezone-update/user-timezone-update.producer';
import { Connection } from 'typeorm';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { getQueueToken } from '@nestjs/bull';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';

describe('UserTimezoneUpdate', () => {
  let producer: UserTimezoneUpdateProducer;
  let consumer: UserTimezoneUpdateConsumer;
  let conn: Connection;

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [WildrTypeormModule, WildrBullModule, UserModule],
      providers: [
        UserTimezoneUpdateProducer,
        {
          provide: getQueueToken(USER_TIMEZONE_UPDATE_QUEUE_NAME),
          useValue: {
            add: jest.fn().mockResolvedValue(undefined),
            on: jest.fn().mockResolvedValue(undefined),
          },
        },
        UserTimezoneUpdateConsumer,
      ],
    });
    producer = module.get(UserTimezoneUpdateProducer);
    consumer = module.get(UserTimezoneUpdateConsumer);
    conn = await getTestConnection();
    await conn.synchronize(true);
  });

  beforeEach(async () => {
    await conn.getRepository(UserEntity).delete({});
  });

  afterAll(async () => {
    await conn.close();
  });

  describe('Consumer', () => {
    it(`should update a user's timezone`, async () => {
      const user = UserEntityFake();
      user.localizationData = { timezoneOffset: '-04:00' };
      await conn.getRepository(UserEntity).insert(user);
      await consumer.processTimezoneUpdateJob({
        data: { userId: user.id, offset: '-05:00' },
      } as any);
      const updatedUser = await conn
        .getRepository(UserEntity)
        .findOneOrFail(user.id);
      expect(updatedUser.localizationData).toEqual({
        timezoneOffset: '-05:00',
      });
    });
  });
});
