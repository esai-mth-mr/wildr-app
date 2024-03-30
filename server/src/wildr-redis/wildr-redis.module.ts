import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Global, Module } from '@nestjs/common';
import { defaultRedis } from '@verdzie/server/bull/wildr-bull.module';

export const REDIS_NAMESPACE = 'default';

@Global()
@Module({
  imports: [
    RedisModule.forRoot({
      config: defaultRedis,
    }),
  ],
})
export class WildrRedisModule {}
