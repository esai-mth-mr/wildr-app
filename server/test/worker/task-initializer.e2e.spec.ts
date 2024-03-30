import {
  WildrBullModule,
  defaultRedis,
} from '@verdzie/server/bull/wildr-bull.module';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { findJobs, getRedisConnection } from '@verdzie/test/utils/wildr-redis';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { TaskInitializerConsumer } from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.consumer';
import { TaskInitializerConsumerModule } from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.consumer.module';
import {
  TASK_INITIALIZER_QUEUE_NAME,
  TaskInitializerProducer,
} from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.producer';
import { TaskInitializerProducerModule } from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.producer.module';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import Redis from 'ioredis';
import { Connection, Repository } from 'typeorm';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Test, TestingModule } from '@nestjs/testing';
import { OpenTelemetryMetricsModule } from '@verdzie/server/opentelemetry/openTelemetry.module';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { ScanInitializerServiceModule } from '@verdzie/server/scanner/scan-initializer/scan-initializer.service.module';
import {
  WorkflowShardState,
  WorkflowStateService,
  WorkflowStatus,
} from '@verdzie/server/scanner/workflow-state/workflow-state.service';
import { TEMPLATE_QUEUE_NAME } from '@verdzie/server/worker/template/template.producer';
import { WildrRedisService } from '@verdzie/server/wildr-redis/wildr-redis.service';

describe('TaskInitializer', () => {
  let consumer: TaskInitializerConsumer;
  let producer: TaskInitializerProducer;
  let conn: Connection;
  let redis: Redis;
  let module: TestingModule;
  let userRepo: Repository<UserEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        OpenTelemetryMetricsModule,
        WinstonBeanstalkModule.forRoot(),
        WildrTypeormModule,
        WildrBullModule,
        RedisModule.forRoot({
          config: defaultRedis,
        }),
        ScanInitializerServiceModule,
        TaskInitializerConsumerModule,
        TaskInitializerProducerModule,
      ],
    }).compile();
    conn = await getTestConnection();
    await conn.synchronize(true);
    redis = await getRedisConnection();
    await redis.flushall();
    consumer = module.get<TaskInitializerConsumer>(TaskInitializerConsumer);
    producer = module.get<TaskInitializerProducer>(TaskInitializerProducer);
    userRepo = conn.getRepository(UserEntity);
  });

  const cleanDb = async () => {
    await userRepo.delete({});
  };

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await conn.close();
    await redis.flushall();
    await redis.quit();
    await module.close();
  });

  describe('Producer', () => {
    it('should producer jobs', async () => {
      const jobData = {
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: 'testInstance',
        startId: 'testStart',
        endId: 'testEnd',
        shard: 1,
      };
      await producer.createTaskInitializerJobs(
        Array.from({ length: 3 }, () => ({ ...jobData }))
      );
      const jobs = await findJobs({
        queue: TASK_INITIALIZER_QUEUE_NAME,
      });
      expect(jobs).toHaveLength(3);
      if (jobs?.length) {
        for (const job of jobs) {
          // @ts-ignore
          expect(job?.data).toMatchObject(jobData);
        }
      }
    });
  });

  describe('Consumer', () => {
    it('should create bull jobs in the configured queue', async () => {
      const users = Array.from({ length: 100 }, () => UserEntityFake());
      await userRepo.insert(users);
      const orderedUsers = await userRepo.find({ order: { id: 'ASC' } });
      const startId = orderedUsers[15].id;
      const endId = orderedUsers[30].id;
      const workflowInstanceId = 'test-workflow-id';
      const jobData = {
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        startId,
        endId,
        shard: 0,
      };
      const job = JobFake({ data: jobData });
      const stateService = module.get(WorkflowStateService);
      await stateService.createWorkflowInstanceState({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        shardCount: 1,
      });
      await consumer.processTaskInitializerJob(job);
      const jobs = await findJobs({
        queue: TEMPLATE_QUEUE_NAME,
      });
      expect(jobs?.length).toBe(2);
      if (jobs?.length) {
        for (const job of jobs) {
          expect(job.data.workflowMetadata).toMatchObject({
            workflowId: WorkflowId.TEMPLATE,
            workflowInstanceId,
            shardId: 0,
            taskId: expect.any(String),
          });
        }
      }
      const allIds = jobs?.reduce((acc, j) => {
        acc.push(...j.data.ids);
        return acc;
      }, []);
      const expectedIds = orderedUsers.slice(15, 30).map(u => u.id);
      expect(expectedIds.every(id => allIds?.includes(id)));
    });

    it('should update shards state', async () => {
      const users = Array.from({ length: 100 }, () => UserEntityFake());
      await userRepo.insert(users);
      const orderedUsers = await userRepo.find({ order: { id: 'ASC' } });
      const startId = orderedUsers[15].id;
      const endId = orderedUsers[30].id;
      const workflowInstanceId = 'test-workflow-id';
      const jobData = {
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        startId,
        endId,
        shard: 0,
      };
      const job = JobFake({ data: jobData });
      const stateService = module.get(WorkflowStateService);
      await stateService.createWorkflowInstanceState({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        shardCount: 1,
      });
      await consumer.processTaskInitializerJob(job);
      const redisService = module.get(WildrRedisService);
      const state = await redisService.jsonGet<WorkflowShardState>({
        key: `workflow-instance-state:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
        path: '.shards.0',
      });
      expect(state.isOk()).toBe(true);
      expect(state._unsafeUnwrap().taskCount).toBe(2);
      expect(state._unsafeUnwrap().status).toBe(WorkflowStatus.IN_PROGRESS);
    });
  });
});
