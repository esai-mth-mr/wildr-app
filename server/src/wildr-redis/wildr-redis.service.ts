import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Inject, Injectable } from '@nestjs/common';
import { logAndReturnErr } from '@verdzie/server/exceptions/wildr.exception';
import {
  RedisGetException,
  RedisJSONParseException,
  RedisSetException,
} from '@verdzie/server/wildr-redis/redis.exceptions';
import { REDIS_NAMESPACE } from '@verdzie/server/wildr-redis/wildr-redis.module';
import Redis, { Command } from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, fromPromise, ok } from 'neverthrow';
import { Logger } from 'winston';

@Injectable()
export class WildrRedisService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRedis(REDIS_NAMESPACE)
    private readonly redis: Redis
  ) {
    this.logger = this.logger.child({ context: WildrRedisService.name });
  }

  async jsonSet({
    key,
    path = '$',
    value,
  }: {
    key: string;
    path?: string;
    value: string | number | object;
  }): Promise<Result<true, RedisSetException>> {
    const context = { key, path, value };
    if (typeof value === 'object') value = JSON.stringify(value);
    const command = new Command('JSON.SET', [key, path, value]);
    const result = await fromPromise(
      this.redis.sendCommand(command) as Promise<Buffer>,
      error => new RedisSetException({ error, ...context })
    );
    if (result.isErr()) {
      return logAndReturnErr({ error: result.error, logger: this.logger });
    }
    return ok(true);
  }

  async jsonGet<T>({
    key,
    path = '.',
  }: {
    key: string;
    path?: string;
  }): Promise<Result<T, RedisSetException>> {
    const context = { key, path };
    const command = new Command('JSON.GET', [key, path]);
    const result = await fromPromise(
      this.redis.sendCommand(command) as Promise<string>,
      error => new RedisGetException({ error, ...context })
    );
    if (result.isErr()) return err(result.error);
    try {
      const json = JSON.parse(Buffer.from(result.value).toString());
      return ok(json);
    } catch (error) {
      return logAndReturnErr({
        error: new RedisJSONParseException({ error, ...context }),
        logger: this.logger,
      });
    }
  }

  async setKeyExpire({
    key,
    seconds,
  }: {
    key: string;
    seconds: number;
  }): Promise<Result<true, RedisSetException>> {
    const context = { key, seconds };
    const command = new Command('EXPIRE', [key, seconds]);
    const result = await fromPromise(
      this.redis.sendCommand(command) as Promise<number>,
      error => new RedisSetException({ error, ...context })
    );
    if (result.isErr())
      return logAndReturnErr({ error: result.error, logger: this.logger });
    return ok(true);
  }
}
