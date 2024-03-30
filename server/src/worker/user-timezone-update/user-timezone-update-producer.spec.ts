import { getQueueToken } from '@nestjs/bull';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import {
  USER_TIMEZONE_UPDATE_JOB_NAME,
  USER_TIMEZONE_UPDATE_QUEUE_NAME,
  UserTimezoneUpdateProducer,
} from '@verdzie/server/worker/user-timezone-update/user-timezone-update.producer';

describe('UserTimezoneUpdateProducer', () => {
  let producer: UserTimezoneUpdateProducer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        UserTimezoneUpdateProducer,
        {
          provide: getQueueToken(USER_TIMEZONE_UPDATE_QUEUE_NAME),
          useValue: {
            add: jest.fn(),
            on: jest.fn(),
          },
        },
      ],
    });
    producer = module.get(UserTimezoneUpdateProducer);
  });

  describe('createTimezoneUpdateJob', () => {
    it('should produce a job', async () => {
      await producer.createTimezoneUpdateJob({
        userId: 'test-user-id',
        offset: '-07:00',
      });
      expect(producer['queue'].add).toHaveBeenCalledWith(
        USER_TIMEZONE_UPDATE_JOB_NAME,
        { userId: 'test-user-id', offset: '-07:00' },
        {}
      );
    });
  });
});
