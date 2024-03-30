import { PostEntity } from '@verdzie/server/post/post.entity';
import { ScanInitializerService as ScanInitializerService } from '@verdzie/server/scanner/scan-initializer/scan-initializer.service';
import { WorkflowManagerService } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { Connection, Repository } from 'typeorm';
import { getQueueToken } from '@nestjs/bull';
import {
  TASK_INITIALIZER_JOB_NAME,
  TASK_INITIALIZER_QUEUE_NAME,
  TaskInitializerProducer,
} from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.producer';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/typeorm';
import {
  WorkflowInstanceState,
  WorkflowStateService,
  WorkflowStatus,
} from '@verdzie/server/scanner/workflow-state/workflow-state.service';
import { WildrRedisService } from '@verdzie/server/wildr-redis/wildr-redis.service';
import Redis from 'ioredis';
import { getRedisConnection } from '@verdzie/test/utils/wildr-redis';
import { getRedisToken } from '@liaoliaots/nestjs-redis';
import { REDIS_NAMESPACE } from '@verdzie/server/wildr-redis/wildr-redis.module';
import { TEMPLATE_QUEUE_NAME } from '@verdzie/server/worker/template/template.producer';
import { WorkflowTemplateConfig } from '@verdzie/server/scanner/workflow-manager/configs/workflow-template.config';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';

describe(ScanInitializerService.name, () => {
  let service: ScanInitializerService;
  let conn: Connection;
  let redis: Redis;
  let postRepo: Repository<PostEntity>;
  let userRepo: Repository<UserEntity>;
  let module: TestingModule;
  let redisService: WildrRedisService;

  beforeAll(async () => {
    conn = await getTestConnection();
    redis = await getRedisConnection();
    await conn.synchronize(true);
    postRepo = conn.getRepository(PostEntity);
    userRepo = conn.getRepository(UserEntity);
  });

  const cleanDb = async () => {
    await postRepo.delete({});
    await userRepo.delete({});
  };

  beforeEach(async () => {
    module = await createMockedTestingModule({
      providers: [
        ScanInitializerService,
        WorkflowManagerService,
        WildrRedisService,
        WorkflowStateService,
        TaskInitializerProducer,
        WorkflowTemplateConfig,
        {
          provide: getQueueToken(TASK_INITIALIZER_QUEUE_NAME),
          useValue: {
            addBulk: jest.fn(),
            on: jest.fn(),
          },
        },
        {
          provide: getQueueToken(TEMPLATE_QUEUE_NAME),
          useValue: {
            addBulk: jest.fn(),
            on: jest.fn(),
          },
        },
        {
          provide: getRedisToken(REDIS_NAMESPACE),
          useValue: redis,
        },
        {
          provide: getConnectionToken(),
          useValue: conn,
        },
      ],
    });
    await cleanDb();
    await redis.flushall();
    service = module.get(ScanInitializerService);
    redisService = module.get(WildrRedisService);
  });

  afterEach(async () => {
    await module.close();
  });

  afterAll(async () => {
    await cleanDb();
    await redis.flushall();
    await redis.quit();
    await conn.close();
  });

  describe(ScanInitializerService.prototype.initializeWorkflow, () => {
    it('should create the workflow instance state', async () => {
      // @ts-ignore-readonly
      service['SCANNER_SLICE_SIZE'] = 20;
      const users = Array.from({ length: 30 }).map(() => UserEntityFake());
      await userRepo.insert(users);
      const result = await service.initializeWorkflow({
        workflowId: WorkflowId.TEMPLATE,
      });
      expect(result.isOk()).toBe(true);
      const workflowState = await redisService.jsonGet({
        key: `workflow-instance-state:${WorkflowId.TEMPLATE}:${
          result._unsafeUnwrap().workflowInstanceId
        }`,
      });
      expect(workflowState._unsafeUnwrap()).toEqual({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: result._unsafeUnwrap().workflowInstanceId,
        shardCount: 2,
        status: WorkflowStatus.IN_PROGRESS,
        shards: {
          0: {
            status: WorkflowStatus.CREATED,
            taskCount: 0,
            tasks: {},
          },
          1: {
            status: WorkflowStatus.CREATED,
            taskCount: 0,
            tasks: {},
          },
        },
      });
    });

    it('should create task initializer jobs', async () => {
      // @ts-ignore-readonly
      service['SCANNER_SLICE_SIZE'] = 20;
      const users = Array.from({ length: 30 }).map(() => UserEntityFake());
      await userRepo.insert(users);
      const result = await service.initializeWorkflow({
        workflowId: WorkflowId.TEMPLATE,
      });
      const orderedUsers = await userRepo.find({
        select: ['id'],
        order: {
          id: 'ASC',
        },
      });
      expect(result.isOk()).toBe(true);
      expect(
        service['taskInitializerProducer']['queue'].addBulk
      ).toHaveBeenCalledWith([
        {
          data: {
            workflowId: WorkflowId.TEMPLATE,
            workflowInstanceId: expect.any(String),
            shard: 0,
            startId: orderedUsers[0].id,
            endId: orderedUsers[19].id,
          },
          name: TASK_INITIALIZER_JOB_NAME,
        },
        {
          data: {
            workflowId: WorkflowId.TEMPLATE,
            workflowInstanceId: expect.any(String),
            shard: 1,
            startId: orderedUsers[19].id,
            endId: undefined,
          },
          name: TASK_INITIALIZER_JOB_NAME,
        },
      ]);
    });

    it('should mark the workflow status as in progress', async () => {
      // @ts-ignore-readonly
      service['SCANNER_SLICE_SIZE'] = 20;
      const users = Array.from({ length: 30 }).map(() => UserEntityFake());
      await userRepo.insert(users);
      const result = await service.initializeWorkflow({
        workflowId: WorkflowId.TEMPLATE,
      });
      expect(result.isOk()).toBe(true);
      const workflowState = await redisService.jsonGet<WorkflowInstanceState>({
        key: `workflow-instance-state:${WorkflowId.TEMPLATE}:${
          result._unsafeUnwrap().workflowInstanceId
        }`,
      });
      expect(workflowState._unsafeUnwrap().status).toBe(
        WorkflowStatus.IN_PROGRESS
      );
    });
  });
});
