import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserTimezoneUpdateProducer } from '@verdzie/server/worker/user-timezone-update/user-timezone-update.producer';
import { TIMEZONE_OFFSET_HEADER } from '@verdzie/server/request/request.constants';
import { UserEntity } from '@verdzie/server/user/user.entity';

// [+-] - plus or minus at start
// ([0]\d|[1][0-4]) - 00-09 or 10-14
// \: - colon
// [03][0] - 00 or 30
const timezoneOffsetRegex = /[+-]([0]\d|[1][0-4])\:[03][0]/;

export const isValidTimezoneOffset = (offset?: string) => {
  if (!offset) return false;
  return timezoneOffsetRegex.test(offset);
};

@Injectable()
export class UserTimezoneUpdateInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userTimezoneUpdateProducer: UserTimezoneUpdateProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.getArgByIndex(2)?.req;
    if (!request) {
      this.logger.warn('Request not found in context');
      return next.handle();
    }
    const timezoneOffset = request.headers[TIMEZONE_OFFSET_HEADER];
    if (!timezoneOffset) return next.handle();
    if (typeof timezoneOffset !== 'string') return next.handle();
    const user = request.user as UserEntity | undefined;
    if (!user) {
      this.logger.warn('User not found in request, cannot update timezone');
      return next.handle();
    }
    if (user.localizationData?.timezoneOffset !== timezoneOffset) {
      if (!isValidTimezoneOffset(timezoneOffset)) {
        this.logger.error('Invalid timezone offset', {
          userId: user.id,
          offset: request?.headers?.[TIMEZONE_OFFSET_HEADER],
        });
        return next.handle();
      }
      this.userTimezoneUpdateProducer
        .createTimezoneUpdateJob({
          userId: user.id,
          offset: timezoneOffset,
        })
        .catch(error => {
          this.logger.error('Failed to create timezone update job', {
            error,
            userId: user.id,
            offset: request?.headers?.[TIMEZONE_OFFSET_HEADER],
          });
        });
    }
    return next.handle();
  }
}
