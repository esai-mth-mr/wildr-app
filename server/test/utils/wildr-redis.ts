import Redis from 'ioredis';
import { defaultRedis } from '@verdzie/server/bull/wildr-bull.module';

let conn: Redis;

export async function getRedisConnection() {
  if (!conn) {
    conn = new Redis(defaultRedis);
  }
  return conn;
}

export async function findJobs({
  queue,
}: {
  queue: string;
}): Promise<undefined | Record<string, any>[]> {
  const redis = await getRedisConnection();
  let cursor = '0';
  const keys = [];
  do {
    const [newCursor, matchingKeys] = await redis.scan(
      cursor,
      'MATCH',
      `bull:${queue}*`
    );
    keys.push(...matchingKeys);
    cursor = newCursor;
  } while (cursor !== '0');
  const tasks = [];
  for (const key of keys) {
    if (!isNaN(parseInt(key.split(':')[2]))) {
      tasks.push(redis.hgetall(key));
    }
    continue;
  }
  const foundJobs = await Promise.all(tasks);
  return foundJobs.map(job => ({
    ...job,
    data: JSON.parse(job.data),
  }));
}

export async function findJob({
  queue,
  number = 1,
}: {
  queue: string;
  number?: number;
}): Promise<undefined | Record<string, any>> {
  const job = await (
    await getRedisConnection()
  ).hgetall(`bull:${queue}:${number}`);
  if (Object.entries(job).length === 0) return;
  return {
    ...job,
    data: JSON.parse(job.data),
  };
}
