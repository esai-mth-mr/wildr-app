import {
  WildrBullModule,
  defaultRedis,
} from '@verdzie/server/bull/wildr-bull.module';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { findJobs, getRedisConnection } from '@verdzie/test/utils/wildr-redis';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import Redis from 'ioredis';
import { Connection } from 'typeorm';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Test, TestingModule } from '@nestjs/testing';
import { OpenTelemetryMetricsModule } from '@verdzie/server/opentelemetry/openTelemetry.module';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import {
  WorkflowInstanceState,
  WorkflowStateService,
  WorkflowStatus,
} from '@verdzie/server/scanner/workflow-state/workflow-state.service';
import { WildrRedisService } from '@verdzie/server/wildr-redis/wildr-redis.service';
import { WorkflowManagerTaskCompletionConsumer } from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-completion.consumer';
import { WorkflowManagerTaskFailureConsumer } from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-failure.consumer';
import { WorkflowManagerConsumerModule } from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager.consumer.module';
import { WorkflowManagerProducerModule } from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager.producer.module';
import {
  WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME,
  WorkflowManagerTaskCompletionProducer,
} from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-completion.producer';
import {
  WORKFLOW_MANAGER_TASK_FAILURE_QUEUE_NAME,
  WorkflowManagerTaskFailureProducer,
} from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-failure.producer';

describe('WorkflowManager Worker', () => {
  let completeConsumer: WorkflowManagerTaskCompletionConsumer;
  let failureConsumer: WorkflowManagerTaskFailureConsumer;
  let completeProducer: WorkflowManagerTaskCompletionProducer;
  let failureProducer: WorkflowManagerTaskFailureProducer;
  let conn: Connection;
  let redis: Redis;
  let module: TestingModule;

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
        WorkflowManagerConsumerModule,
        WorkflowManagerProducerModule,
      ],
    }).compile();
    conn = await getTestConnection();
    await conn.synchronize(true);
    redis = await getRedisConnection();
    await redis.flushall();
    completeConsumer = module.get(WorkflowManagerTaskCompletionConsumer);
    failureConsumer = module.get(WorkflowManagerTaskFailureConsumer);
    completeProducer = module.get(WorkflowManagerTaskCompletionProducer);
    failureProducer = module.get(WorkflowManagerTaskFailureProducer);
  });

  beforeEach(async () => {
    await redis.flushall();
  });

  afterAll(async () => {
    await conn.close();
    await redis.flushall();
    await redis.quit();
    await module.close();
  });

  describe('Completion Producer', () => {
    it('should produce completion jobs', async () => {
      const jobData = {
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: 'workflow-instance-id',
        shardId: 0,
        taskId: 'task-id',
        bullJobId: 'job-id',
      };
      await completeProducer.createWorkflowManagerCompletionJob(jobData);
      const completeJobs = await findJobs({
        queue: WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME,
      });
      expect(completeJobs).toHaveLength(1);
      expect(completeJobs?.[0].data).toEqual(jobData);
    });
  });

  describe('Completion Consumer', () => {
    it('should mark the workflow as complete', async () => {
      const redisService = module.get(WildrRedisService);
      const stateService = module.get(WorkflowStateService);
      const workflowInstanceId = 'workflow-instance-id';
      const workflowId = WorkflowId.TEMPLATE;
      const shardId = 0;
      const taskId = 'task-id';
      const bullJobId = 'job-id';
      const jobData = {
        workflowId,
        workflowInstanceId,
        shardId,
        taskId,
        bullJobId,
      };
      const workflowState: WorkflowInstanceState = {
        workflowId,
        workflowInstanceId,
        shardCount: 1,
        status: WorkflowStatus.IN_PROGRESS,
        shards: {
          [shardId]: {
            status: WorkflowStatus.IN_PROGRESS,
            taskCount: 1,
            tasks: {
              [taskId]: {
                status: WorkflowStatus.IN_PROGRESS,
                bullJobs: {
                  [bullJobId]: {
                    status: WorkflowStatus.IN_PROGRESS,
                  },
                },
              },
            },
          },
        },
      };
      await redisService.jsonSet({
        key: `${stateService['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
        value: workflowState,
      });
      await completeConsumer.processWorkflowManagerTaskCompletionJob(
        JobFake({ data: jobData })
      );
      const state = await redisService.jsonGet<WorkflowInstanceState>({
        key: `${stateService['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
      });
      expect(state?._unsafeUnwrap().status).toEqual(WorkflowStatus.COMPLETED);
      expect(state?._unsafeUnwrap().shards[0].status).toEqual(
        WorkflowStatus.COMPLETED
      );
      expect(state?._unsafeUnwrap().shards[0].tasks[taskId].status).toEqual(
        WorkflowStatus.COMPLETED
      );
    });
  });

  describe('Failure Producer', () => {
    it('should produce failure jobs', async () => {
      const jobData = {
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: 'workflow-instance-id',
        shardId: 0,
        taskId: 'task-id',
        bullJobId: 'job-id',
      };
      await failureProducer.createWorkflowManagerFailureJob(jobData);
      const failureJobs = await findJobs({
        queue: WORKFLOW_MANAGER_TASK_FAILURE_QUEUE_NAME,
      });
      expect(failureJobs).toHaveLength(1);
      expect(failureJobs?.[0].data).toEqual(jobData);
    });
  });

  describe('Failure Consumer', () => {
    it('should mark the workflow task as failed', async () => {
      const redisService = module.get(WildrRedisService);
      const stateService = module.get(WorkflowStateService);
      const workflowInstanceId = 'workflow-instance-id';
      const workflowId = WorkflowId.TEMPLATE;
      const shardId = 0;
      const taskId = 'task-id';
      const bullJobId = 'job-id';
      const jobData = {
        workflowId,
        workflowInstanceId,
        shardId,
        taskId,
        bullJobId,
      };
      const workflowState: WorkflowInstanceState = {
        workflowId,
        workflowInstanceId,
        shardCount: 1,
        status: WorkflowStatus.IN_PROGRESS,
        shards: {
          [shardId]: {
            status: WorkflowStatus.IN_PROGRESS,
            taskCount: 1,
            tasks: {
              [taskId]: {
                status: WorkflowStatus.FAILED,
                bullJobs: {
                  [bullJobId]: {
                    status: WorkflowStatus.FAILED,
                  },
                },
              },
            },
          },
        },
      };
      await redisService.jsonSet({
        key: `${stateService['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
        value: workflowState,
      });
      await failureConsumer.processWorkflowManagerTaskFailureJob(
        JobFake({ data: jobData })
      );
      const state = await redisService.jsonGet<WorkflowInstanceState>({
        key: `${stateService['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
      });
      expect(state?._unsafeUnwrap().status).toEqual(WorkflowStatus.IN_PROGRESS);
      expect(state?._unsafeUnwrap().shards[0].status).toEqual(
        WorkflowStatus.IN_PROGRESS
      );
      expect(state?._unsafeUnwrap().shards[0].tasks[taskId].status).toEqual(
        WorkflowStatus.FAILED
      );
    });
  });
});
