import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserTimezoneUpdateConsumer } from '@verdzie/server/worker/user-timezone-update/user-timezone-update.consumer';
import { err, ok } from 'neverthrow';

describe('UserTimezoneUpdateConsumer', () => {
  let consumer: UserTimezoneUpdateConsumer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [UserTimezoneUpdateConsumer],
    });
    consumer = module.get(UserTimezoneUpdateConsumer);
  });

  describe('processTimezoneUpdateJob', () => {
    it('should update the user timezone', async () => {
      consumer['userService'].updateUserTimezoneOffset = jest
        .fn()
        .mockResolvedValueOnce(ok(undefined));
      await consumer.processTimezoneUpdateJob({
        data: {
          userId: 'test-user-id',
          offset: '-07:00',
        },
      } as any);
      expect(
        consumer['userService'].updateUserTimezoneOffset
      ).toHaveBeenCalledWith({
        userId: 'test-user-id',
        offset: '-07:00',
      });
    });

    it('should throw error if service returns an error', async () => {
      consumer['userService'].updateUserTimezoneOffset = jest
        .fn()
        .mockResolvedValueOnce(err(new Error('test error')));
      try {
        await consumer.processTimezoneUpdateJob({
          data: {
            userId: 'test-user-id',
            offset: '-07:00',
          },
        } as any);
        throw new Error('should have thrown');
      } catch (error) {
        expect(error).toEqual(new Error('test error'));
      }
    });
  });
});
