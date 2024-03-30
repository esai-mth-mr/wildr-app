import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { TIMEZONE_OFFSET_HEADER } from '@verdzie/server/request/request.constants';

describe(FirebaseAuthGuard.name, () => {
  let guard: FirebaseAuthGuard;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [FirebaseAuthGuard],
    });
    guard = module.get(FirebaseAuthGuard);
  });

  const getHTTPExecutionContext = (jwt: string | null) => {
    const request = {
      headers: {
        authorization: jwt,
        [TIMEZONE_OFFSET_HEADER]: '-07:00',
      },
    };
    const context = {
      getType: () => 'http',
      getArgs() {
        return [{}, { req: request }, {}];
      },
      getClass() {
        return {};
      },
      getHandler() {
        return {};
      },
    } as ExecutionContext;
    return context;
  };

  describe(FirebaseAuthGuard.prototype.canActivate, () => {
    it('should return false if jwt is null', async () => {
      const result = await guard.canActivate(getHTTPExecutionContext(null));
      expect(result).toBe(false);
    });

    it('should return false if jwt is invalid', async () => {
      const result = await guard.canActivate(
        getHTTPExecutionContext('Basic token')
      );
      expect(result).toBe(false);
    });

    it('should return true if jwt is valid', async () => {
      guard['firebaseAuthService'].validateTokenAndGetAssociatedAccountDetails =
        jest.fn().mockResolvedValueOnce(UserEntityFake());
      const result = await guard.canActivate(
        getHTTPExecutionContext('Bearer token')
      );
      expect(result).toBe(true);
    });
  });
});
