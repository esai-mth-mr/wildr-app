import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { getRedisConnection } from '@verdzie/test/utils/wildr-redis';
import Redis from 'ioredis';
import { Connection, Repository } from 'typeorm';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { getRedisToken } from '@liaoliaots/nestjs-redis';
import { REDIS_NAMESPACE } from '@verdzie/server/wildr-redis/wildr-redis.module';
import { getConnectionToken } from '@nestjs/typeorm';
import { ok } from 'neverthrow';
import { UserSchema } from '@verdzie/server/user/user.schema';
import { WildrRedisService } from '@verdzie/server/wildr-redis/wildr-redis.service';
import { WorkflowState } from 'aws-sdk/clients/securityhub';
import {
  WorkflowInstanceState,
  WorkflowStateService,
  WorkflowStatus,
} from '@verdzie/server/scanner/workflow-state/workflow-state.service';
import { TaskInitializerService } from '@verdzie/server/scanner/task-initializer/task-initializer.service';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';

describe('TaskInitializerService', () => {
  let conn: Connection;
  let redis: Redis;
  let redisService: WildrRedisService;
  let service: TaskInitializerService;
  let workflowStateService: WorkflowStateService;
  let userRepo: Repository<UserEntity>;

  beforeAll(async () => {
    conn = await getTestConnection();
    await conn.synchronize(true);
    redis = await getRedisConnection();
  });

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        TaskInitializerService,
        WorkflowStateService,
        WildrRedisService,
        {
          provide: getConnectionToken(),
          useValue: conn,
        },
        {
          provide: getRedisToken(REDIS_NAMESPACE),
          useValue: redis,
        },
      ],
    });
    service = module.get(TaskInitializerService);
    workflowStateService = module.get(WorkflowStateService);
    redisService = module.get(WildrRedisService);
    userRepo = conn.getRepository(UserSchema);
    await redis.flushall();
    await cleanDb();
  });

  const cleanDb = async () => {
    await userRepo.delete({});
  };

  afterAll(async () => {
    await cleanDb();
    await conn.close();
    await redis.flushall();
    await redis.quit();
  });

  describe('initializeTasks', () => {
    it('should create bull jobs using id batches', async () => {
      const users = Array.from({ length: 100 }, () => UserEntityFake());
      await userRepo.insert(users);
      await workflowStateService.createWorkflowInstanceState({
        workflowInstanceId: '1',
        workflowId: WorkflowId.TEMPLATE,
        shardCount: 1,
      });
      const orderedUsers = await userRepo.find({ order: { id: 'ASC' } });
      const config = {
        workflowId: WorkflowId.TEMPLATE,
        taskSize: 10,
        schema: UserSchema,
        tableName: UserEntity.kTableName,
        produceJob: jest.fn().mockResolvedValue(ok(true)),
      };
      // @ts-ignore
      service['workflowConfigService'].getWorkflowConfig = jest
        .fn()
        .mockReturnValue(ok(config));
      const userIds = await userRepo.find({
        select: ['id'],
        order: { id: 'ASC' },
      });
      const startId = userIds[10].id;
      const endId = userIds[50].id;
      await service.initializeTasks({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: '1',
        shardId: 0,
        startId,
        endId,
      });
      expect(config.produceJob).toHaveBeenCalledTimes(4);
      const callIds = config.produceJob.mock.calls.reduce(
        (acc: string[], call: any[]) => {
          const ids = call[0].ids;
          return [...acc, ...ids];
        },
        []
      );
      const expectedIds = orderedUsers.map(u => u.id).slice(10, 50);
      expect(callIds).toEqual(expectedIds);
      expect(config.produceJob).toHaveBeenNthCalledWith(1, {
        workflowMetadata: {
          workflowId: WorkflowId.TEMPLATE,
          workflowInstanceId: '1',
          shardId: 0,
          taskId: expect.any(String),
        },
        ids: expect.any(Array),
      });
    });

    it('should not use same ids in different tasks', async () => {
      const users = Array.from({ length: 60 }, () => UserEntityFake());
      await userRepo.insert(users);
      await workflowStateService.createWorkflowInstanceState({
        workflowInstanceId: '1',
        workflowId: WorkflowId.TEMPLATE,
        shardCount: 1,
      });
      const config = {
        workflowId: WorkflowId.TEMPLATE,
        taskSize: 10,
        schema: UserSchema,
        tableName: UserEntity.kTableName,
        produceJob: jest.fn().mockResolvedValue(ok(true)),
      };
      // @ts-ignore
      service['workflowConfigService'].getWorkflowConfig = jest
        .fn()
        .mockReturnValue(ok(config));
      const userIds = await userRepo.find({
        select: ['id'],
        order: { id: 'ASC' },
      });
      const startId = userIds[10].id;
      const endId = userIds[50].id;
      await service.initializeTasks({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: '1',
        shardId: 0,
        startId,
        endId,
      });
      expect(config.produceJob).toHaveBeenCalledTimes(4);
      const callIds = config.produceJob.mock.calls.reduce(
        (acc: string[], call: any[]) => {
          const ids = call[0].ids;
          return [...acc, ...ids];
        },
        []
      );
      const callIdsSet = new Set(callIds);
      expect(callIds.length).toEqual(callIdsSet.size);
    });

    it('should handle tables with few records', async () => {
      const users = Array.from({ length: 5 }, () => UserEntityFake());
      await userRepo.insert(users);
      await workflowStateService.createWorkflowInstanceState({
        workflowInstanceId: '1',
        workflowId: WorkflowId.TEMPLATE,
        shardCount: 1,
      });
      const config = {
        workflowId: WorkflowId.TEMPLATE,
        taskSize: 10,
        schema: UserSchema,
        tableName: UserEntity.kTableName,
        produceJob: jest.fn().mockResolvedValue(ok(true)),
      };
      // @ts-ignore
      service['workflowConfigService'].getWorkflowConfig = jest
        .fn()
        .mockReturnValue(ok(config));
      const userIds = await userRepo.find({
        select: ['id'],
        order: { id: 'ASC' },
      });
      const startId = userIds[0].id;
      await service.initializeTasks({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: '1',
        shardId: 0,
        startId,
      });
      expect(config.produceJob).toHaveBeenCalledTimes(1);
      const callIds = config.produceJob.mock.calls.reduce(
        (acc: string[], call: any[]) => {
          const ids = call[0].ids;
          return [...acc, ...ids];
        },
        []
      );
      const callIdsSet = new Set(callIds);
      expect(callIds.length).toEqual(callIdsSet.size);
    });

    it('should set the workflow shard task count', async () => {
      const users = Array.from({ length: 60 }, () => UserEntityFake());
      await userRepo.insert(users);
      await workflowStateService.createWorkflowInstanceState({
        workflowInstanceId: '1',
        workflowId: WorkflowId.TEMPLATE,
        shardCount: 1,
      });
      const config = {
        workflowId: WorkflowId.TEMPLATE,
        taskSize: 10,
        schema: UserSchema,
        tableName: UserEntity.kTableName,
        produceJob: jest.fn().mockResolvedValue(ok(true)),
      };
      // @ts-ignore
      service['workflowConfigService'].getWorkflowConfig = jest
        .fn()
        .mockReturnValue(ok(config));
      const userIds = await userRepo.find({
        select: ['id'],
        order: { id: 'ASC' },
      });
      const startId = userIds[10].id;
      const endId = userIds[50].id;
      await service.initializeTasks({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: '1',
        shardId: 0,
        startId,
        endId,
      });
      const state = await redisService.jsonGet<WorkflowInstanceState>({
        key: `workflow-instance-state:${WorkflowId.TEMPLATE}:1`,
      });
      expect(state.isOk()).toBe(true);
      expect(state._unsafeUnwrap().shards[0]).toEqual({
        status: 1,
        taskCount: 4,
        tasks: expect.any(Object),
      });
      expect(
        Object.entries(state._unsafeUnwrap().shards[0].tasks)
      ).toHaveLength(4);
    });

    it('should set the shard status to IN_PROGRESS', async () => {
      const users = Array.from({ length: 10 }, () => UserEntityFake());
      await userRepo.insert(users);
      await workflowStateService.createWorkflowInstanceState({
        workflowInstanceId: '1',
        workflowId: WorkflowId.TEMPLATE,
        shardCount: 1,
      });
      const config = {
        workflowId: WorkflowId.TEMPLATE,
        taskSize: 10,
        schema: UserSchema,
        tableName: UserEntity.kTableName,
        produceJob: jest.fn().mockResolvedValue(ok(true)),
      };
      // @ts-ignore
      service['workflowConfigService'].getWorkflowConfig = jest
        .fn()
        .mockReturnValue(ok(config));
      const userIds = await userRepo.find({
        select: ['id'],
        order: { id: 'ASC' },
      });
      const startId = userIds[1].id;
      const endId = userIds[5].id;
      await service.initializeTasks({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: '1',
        shardId: 0,
        startId,
        endId,
      });
      const status = await redisService.jsonGet<WorkflowState>({
        key: `workflow-instance-state:${WorkflowId.TEMPLATE}:1`,
        path: '.shards.0.status',
      });
      expect(status._unsafeUnwrap()).toEqual(WorkflowStatus.IN_PROGRESS);
    });
  });
});
