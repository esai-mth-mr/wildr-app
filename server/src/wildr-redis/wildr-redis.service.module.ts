import { Module } from '@nestjs/common';
import { WildrRedisService } from '@verdzie/server/wildr-redis/wildr-redis.service';

@Module({
  providers: [WildrRedisService],
  exports: [WildrRedisService],
})
export class WildrRedisServiceModule {}
