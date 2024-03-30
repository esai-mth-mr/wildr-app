import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface';
import { getLogger } from '@verdzie/server/winstonBeanstalk.module';

export const DEFAULT_RATE_LIMITER_KEY = 'default-rate-limiter';
export const LOW_RATE_LIMITER_KEY = 'low-rate-limiter';

@Injectable()
export class GqlRateLimiterGuard extends ThrottlerGuard {
  configKey = 'default';

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const clientIp =
      req.headers['x-forwarded-for']?.split(',').shift() ||
      req.connection.remoteAddress;
    if (!clientIp) {
      getLogger().warn('client ip not found in rate limiter', {
        methodName: GqlRateLimiterGuard.prototype.getTracker.name,
        context: GqlRateLimiterGuard.name,
      });
    }
    return clientIp;
  }

  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    const req = ctx?.req;
    const res = ctx?.req?.res;
    if (!req || !res) {
      getLogger().warn('req or res not found in rate limiter', {
        methodName: GqlRateLimiterGuard.prototype.handleRequest.name,
        context: GqlRateLimiterGuard.name,
      });
    }
    return {
      req,
      res,
    };
  }

  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: ThrottlerOptions
  ): Promise<boolean> {
    if (throttler.name === this.configKey) {
      return super.handleRequest(context, limit, ttl, throttler);
    }
    return true;
  }

  protected async getErrorMessage(
    _context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail
  ): Promise<string> {
    return RATE_LIMIT_ERROR_MESSAGE;
  }
}

export const RATE_LIMIT_ERROR_MESSAGE = 'Too Many Requests';

@Injectable()
export class LowGqlRateLimiterGuard extends GqlRateLimiterGuard {
  configKey = LOW_RATE_LIMITER_KEY;
}
