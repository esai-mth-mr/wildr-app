import {
  UserTimezoneUpdateInterceptor,
  isValidTimezoneOffset,
} from '@verdzie/server/interceptors/user-timezone-update.interceptor';
import { TIMEZONE_OFFSET_HEADER } from '@verdzie/server/request/request.constants';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';

describe(UserTimezoneUpdateInterceptor.name, () => {
  let interceptor: UserTimezoneUpdateInterceptor;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [UserTimezoneUpdateInterceptor],
    });
    interceptor = module.get(UserTimezoneUpdateInterceptor);
  });

  describe('isValidTimezoneOffset', () => {
    it('should allow for +00:00', () => {
      expect(isValidTimezoneOffset('+00:00')).toBe(true);
    });

    it('should allow for -00:00', () => {
      expect(isValidTimezoneOffset('-00:00')).toBe(true);
    });

    it('should allow for -00:30', () => {
      expect(isValidTimezoneOffset('-00:30')).toBe(true);
    });

    it('should allow for +14:00', () => {
      expect(isValidTimezoneOffset('+14:00')).toBe(true);
    });

    it('should allow for -14:00', () => {
      expect(isValidTimezoneOffset('-14:00')).toBe(true);
    });

    it('should not allow for +15:00', () => {
      expect(isValidTimezoneOffset('+15:00')).toBe(false);
    });

    it('should not allow for -15:00', () => {
      expect(isValidTimezoneOffset('-15:00')).toBe(false);
    });

    it('should allow for +05:30', () => {
      expect(isValidTimezoneOffset('+05:30')).toBe(true);
    });

    it('should allow for +04:30', () => {
      expect(isValidTimezoneOffset('+04:30')).toBe(true);
    });

    it('should allow for -04:30', () => {
      expect(isValidTimezoneOffset('-04:30')).toBe(true);
    });

    it('should not allow for -01:03', () => {
      expect(isValidTimezoneOffset('-01:03')).toBe(false);
    });

    it('should not allow for +04:60', () => {
      expect(isValidTimezoneOffset('+04:60')).toBe(false);
    });

    it('should allow for -07:00', () => {
      expect(isValidTimezoneOffset('-07:00')).toBe(true);
    });

    it('should allow for +07:00', () => {
      expect(isValidTimezoneOffset('+07:00')).toBe(true);
    });

    it('should allow for +12:30', () => {
      expect(isValidTimezoneOffset('+12:30')).toBe(true);
    });
  });

  describe(UserTimezoneUpdateInterceptor.prototype.intercept, () => {
    it('should update the user timezone', async () => {
      const user = UserEntityFake();
      user.localizationData = { timezoneOffset: '-04:00' };
      interceptor['userTimezoneUpdateProducer'].createTimezoneUpdateJob = jest
        .fn()
        .mockResolvedValueOnce(null);
      const context = {
        getArgByIndex: jest.fn().mockReturnValueOnce({
          req: {
            user,
            headers: {
              [TIMEZONE_OFFSET_HEADER]: '-07:00',
            },
          },
        }),
      };
      interceptor.intercept(context as any, { handle: jest.fn() } as any);
      expect(
        interceptor['userTimezoneUpdateProducer'].createTimezoneUpdateJob
      ).toHaveBeenCalledWith({
        userId: user.id,
        offset: '-07:00',
      });
    });

    it('should not update the user timezone', async () => {
      const user = UserEntityFake();
      user.localizationData = { timezoneOffset: '-04:00' };
      interceptor['userTimezoneUpdateProducer'].createTimezoneUpdateJob = jest
        .fn()
        .mockResolvedValueOnce(null);
      const context = {
        getArgByIndex: jest.fn().mockReturnValueOnce({
          req: {
            user,
            headers: {},
          },
        }),
      };
      interceptor.intercept(context as any, { handle: jest.fn() } as any);
      expect(
        interceptor['userTimezoneUpdateProducer'].createTimezoneUpdateJob
      ).not.toHaveBeenCalled();
    });

    it('should not update the user timezone with bad offset', async () => {
      const user = UserEntityFake();
      user.localizationData = { timezoneOffset: '-12:00' };
      interceptor['userTimezoneUpdateProducer'].createTimezoneUpdateJob = jest
        .fn()
        .mockResolvedValueOnce(null);
      const context = {
        getArgByIndex: jest.fn().mockReturnValueOnce({
          req: {
            user,
            headers: {
              [TIMEZONE_OFFSET_HEADER]: '-15:00',
            },
          },
        }),
      };
      interceptor.intercept(context as any, { handle: jest.fn() } as any);
      expect(
        interceptor['userTimezoneUpdateProducer'].createTimezoneUpdateJob
      ).not.toHaveBeenCalled();
    });

    it('should catch errors from timezone update', async () => {
      const user = UserEntityFake();
      user.localizationData = { timezoneOffset: '-04:00' };
      interceptor['userTimezoneUpdateProducer'].createTimezoneUpdateJob = jest
        .fn()
        .mockRejectedValueOnce(new Error('Test'));
      const context = {
        getArgByIndex: jest.fn().mockReturnValueOnce({
          req: {
            user,
            headers: {
              [TIMEZONE_OFFSET_HEADER]: '-07:00',
            },
          },
        }),
      };
      interceptor.intercept(context as any, { handle: jest.fn() } as any);
      expect(
        interceptor['userTimezoneUpdateProducer'].createTimezoneUpdateJob
      ).toHaveBeenCalledWith({
        userId: user.id,
        offset: '-07:00',
      });
    });
  });
});
