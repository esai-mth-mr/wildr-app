import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import Bull, { JobOptions } from 'bull';

export const defaultRedis = {
  host: process.env.WORKER_ELASTIC_CACHE_ENDPOINT,
  port: 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 10000 /* 10s */);
    console.log(
      '[Redis] Retrying connection to host: %s port: %d, attempt: %d, delay: %d',
      process.env.WORKER_ELASTIC_CACHE_ENDPOINT,
      6379,
      times,
      delay
    );
    return delay;
  },
};

const defaultJobOptions: JobOptions = {
  attempts: 5,
  timeout: 3 * 60 * 1000 /* 3min */,
  backoff: { type: 'exponential', delay: 30 * 1000 /* 30s */ },
  removeOnComplete: true,
};

export const HIGH_LOAD_JOB_CONFIG_KEY = 'high-load-job-config-key';
export const MEDIUM_LOAD_JOB_CONFIG_KEY = 'medium-load-job-config-key';

const highLoadLimiter: Bull.RateLimiter = {
  max: 4,
  duration: 1000,
};

const mediumLoadLimiter: Bull.RateLimiter = {
  max: 15,
  duration: 1000,
};

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      redis: defaultRedis,
      defaultJobOptions,
    }),
    BullModule.forRoot(HIGH_LOAD_JOB_CONFIG_KEY, {
      redis: defaultRedis,
      defaultJobOptions,
      limiter: highLoadLimiter,
    }),
    BullModule.forRoot(MEDIUM_LOAD_JOB_CONFIG_KEY, {
      redis: defaultRedis,
      defaultJobOptions,
      limiter: mediumLoadLimiter,
    }),
  ],
})
export class WildrBullModule {}
