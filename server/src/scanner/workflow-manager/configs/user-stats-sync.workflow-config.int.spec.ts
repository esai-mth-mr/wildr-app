import { getRedisToken } from '@liaoliaots/nestjs-redis';
import { UserStatsSyncWorkflowConfig } from '@verdzie/server/scanner/workflow-manager/configs/user-stats-sync.workflow-config';
import { WorkflowMetadata } from '../workflow-manager.types';
import { WorkflowId } from '../workflow-manager.types';
import { findJob, getRedisConnection } from '@verdzie/test/utils/wildr-redis';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { REDIS_NAMESPACE } from '@verdzie/server/wildr-redis/wildr-redis.module';
import { USER_STATS_SYNC_QUEUE_NAME } from '@verdzie/server/worker/user-stats-sync/user-stats-sync-worker.config';
import Redis from 'ioredis';
import { UserStatsSyncProducerModule } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.producer.module';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';

describe(UserStatsSyncWorkflowConfig.name, () => {
  let redis: Redis;

  beforeAll(async () => {
    redis = await getRedisConnection();
  });

  beforeEach(async () => {
    await redis.flushall();
  });

  afterAll(async () => {
    await redis.flushall();
    await redis.quit();
  });

  describe(UserStatsSyncWorkflowConfig.prototype.produceJob, () => {
    it('should create a job with ids and metadata', async () => {
      const module = await createMockedTestingModule({
        imports: [WildrBullModule, UserStatsSyncProducerModule],
        providers: [
          UserStatsSyncWorkflowConfig,
          { provide: getRedisToken(REDIS_NAMESPACE), useValue: redis },
        ],
      });
      const config = module.get(UserStatsSyncWorkflowConfig);
      const workflowMetadata: WorkflowMetadata = {
        workflowId: WorkflowId.USER_STATS_SYNC,
        workflowInstanceId: 'workflowInstanceId',
        shardId: 0,
        taskId: 'taskId',
      };
      const ids = ['id1'];
      const job = await config.produceJob({ workflowMetadata, ids });
      expect(job.isOk()).toBe(true);
      const createdJob = await findJob({
        queue: USER_STATS_SYNC_QUEUE_NAME,
      });
      expect(createdJob).toBeDefined();
      expect(createdJob?.data).toEqual({
        userId: ids[0],
        workflowMetadata,
      });
    });
  });
});
