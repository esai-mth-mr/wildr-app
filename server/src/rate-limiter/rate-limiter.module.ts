import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  DEFAULT_RATE_LIMITER_KEY,
  LOW_RATE_LIMITER_KEY,
} from '@verdzie/server/rate-limiter/gql-rate-limiter.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: DEFAULT_RATE_LIMITER_KEY,
        ttl: Number(process.env.RATE_LIMITER_TTL) || 1000,
        limit: Number(process.env.RATE_LIMITER_LIMIT) || 10,
      },
      {
        name: LOW_RATE_LIMITER_KEY,
        ttl: Number(process.env.RATE_LIMITER_TTL) || 60000,
        limit: Number(process.env.RATE_LIMITER_LIMIT) || 1,
      },
    ]),
  ],
})
export class WildrRateLimiterModule {}
