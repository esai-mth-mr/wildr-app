import { getRedisConnection } from '@verdzie/test/utils/wildr-redis';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import Redis from 'ioredis';
import { nanoid } from 'nanoid';
import { getRedisToken } from '@liaoliaots/nestjs-redis';
import { REDIS_NAMESPACE } from '@verdzie/server/wildr-redis/wildr-redis.module';
import { WildrRedisService } from '@verdzie/server/wildr-redis/wildr-redis.service';
import {
  WorkflowStateService,
  WorkflowStatus,
} from '@verdzie/server/scanner/workflow-state/workflow-state.service';
import { WorkflowId } from '../workflow-manager/workflow-manager.types';
import {
  BadWorkflowShardStatusTransitionException,
  BadWorkflowStatusTransitionException,
} from '@verdzie/server/scanner/workflow-state/workflow-state.exceptions';

describe('WorkflowStateService', () => {
  let redis: Redis;
  let service: WorkflowStateService;
  let redisService: WildrRedisService;

  beforeAll(async () => {
    redis = await getRedisConnection();
  });

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        WorkflowStateService,
        WildrRedisService,
        { provide: getRedisToken(REDIS_NAMESPACE), useValue: redis },
      ],
    });
    redisService = module.get(WildrRedisService);
    service = module.get(WorkflowStateService);
    await redis.flushall();
  });

  afterAll(async () => {
    await redis.flushall();
    redis.quit();
  });

  const workflowInstanceId = nanoid();

  describe('createWorkflowInstanceState', () => {
    it('should create a workflow instance state', async () => {
      const result = await service.createWorkflowInstanceState({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        shardCount: 1,
      });
      expect(result.isOk()).toBe(true);
      const state = await redisService.jsonGet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
      });
      expect(state._unsafeUnwrap()).toEqual({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        status: WorkflowStatus.CREATED,
        shardCount: 1,
        shards: {
          0: {
            status: WorkflowStatus.CREATED,
            taskCount: 0,
            tasks: {},
          },
        },
      });
    });

    it('should create workflow instance state for multiple shards', async () => {
      const result = await service.createWorkflowInstanceState({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        shardCount: 2,
      });
      expect(result.isOk()).toBe(true);
      const state = await redisService.jsonGet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
      });
      expect(state._unsafeUnwrap()).toEqual({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        status: WorkflowStatus.CREATED,
        shardCount: 2,
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
  });

  describe('upsertWorkflowTask', () => {
    it('should create a workflow task in the given shard', async () => {
      const workflowId = WorkflowId.TEMPLATE;
      const workflowInstanceId = nanoid();
      const shardId = 0;
      const taskId = nanoid();
      const bullJobId = nanoid();
      await service.createWorkflowInstanceState({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        shardCount: 1,
      });
      await service.setWorkflowStatusInProgress({
        workflowId,
        workflowInstanceId,
      });
      await service.markWorkflowShardInProgress({
        workflowId,
        workflowInstanceId,
        shardId,
        taskCount: 1,
      });
      const result = await service.upsertWorkflowTask({
        workflowId,
        workflowInstanceId,
        shardId,
        bullJobId,
        taskId,
      });
      expect(result.isOk()).toBe(true);
      const state = await redisService.jsonGet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${workflowId}:${workflowInstanceId}`,
      });
      expect(state._unsafeUnwrap()).toEqual({
        workflowId,
        workflowInstanceId,
        status: WorkflowStatus.IN_PROGRESS,
        shardCount: 1,
        shards: {
          0: {
            status: WorkflowStatus.IN_PROGRESS,
            taskCount: 1,
            tasks: {
              [taskId]: {
                status: WorkflowStatus.CREATED,
                bullJobs: {
                  [bullJobId]: {
                    status: WorkflowStatus.CREATED,
                  },
                },
              },
            },
          },
        },
      });
    });

    it('should add new bull jobs status to existing tasks', async () => {
      const workflowId = WorkflowId.TEMPLATE;
      const workflowInstanceId = nanoid();
      const shardId = 0;
      const taskId = nanoid();
      const bullJobId = nanoid();
      await service.createWorkflowInstanceState({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        shardCount: 1,
      });
      await service.setWorkflowStatusInProgress({
        workflowId,
        workflowInstanceId,
      });
      await service.markWorkflowShardInProgress({
        workflowId,
        workflowInstanceId,
        shardId,
        taskCount: 1,
      });
      const result = await service.upsertWorkflowTask({
        workflowId,
        workflowInstanceId,
        shardId,
        bullJobId,
        taskId,
      });
      expect(result.isOk()).toBe(true);
      const result2 = await service.upsertWorkflowTask({
        workflowId,
        workflowInstanceId,
        shardId,
        bullJobId: 'anotherBullJobId',
        taskId,
      });
      expect(result2.isOk()).toBe(true);
      const state = await redisService.jsonGet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${workflowId}:${workflowInstanceId}`,
      });
      expect(state._unsafeUnwrap()).toEqual({
        workflowId,
        workflowInstanceId,
        status: WorkflowStatus.IN_PROGRESS,
        shardCount: 1,
        shards: {
          0: {
            status: WorkflowStatus.IN_PROGRESS,
            taskCount: 1,
            tasks: {
              [taskId]: {
                status: WorkflowStatus.CREATED,
                bullJobs: {
                  [bullJobId]: {
                    status: WorkflowStatus.CREATED,
                  },
                  ['anotherBullJobId']: {
                    status: WorkflowStatus.CREATED,
                  },
                },
              },
            },
          },
        },
      });
    });
  });

  describe('setWorkflowStatusInProgress', () => {
    it('should set the workflow status to in progress', async () => {
      await service.createWorkflowInstanceState({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        shardCount: 1,
      });
      const result = await service.setWorkflowStatusInProgress({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
      });
      expect(result.isOk()).toBe(true);
      const state = await redisService.jsonGet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
      });
      expect(state._unsafeUnwrap()).toEqual({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        status: WorkflowStatus.IN_PROGRESS,
        shardCount: 1,
        shards: {
          0: {
            status: WorkflowStatus.CREATED,
            taskCount: 0,
            tasks: {},
          },
        },
      });
    });
  });

  describe('markWorkflowShardInProgress', () => {
    it('should set a workflow shard task count and status', async () => {
      await service.createWorkflowInstanceState({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        shardCount: 1,
      });
      const result = await service.markWorkflowShardInProgress({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        shardId: 0,
        taskCount: 20,
      });
      expect(result.isOk()).toBe(true);
      const state = await redisService.jsonGet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
      });
      expect(state._unsafeUnwrap()).toEqual({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        status: WorkflowStatus.CREATED,
        shardCount: 1,
        shards: {
          0: {
            status: WorkflowStatus.IN_PROGRESS,
            taskCount: 20,
            tasks: {},
          },
        },
      });
    });
  });

  describe('markWorkflowTaskComplete', () => {
    it('should mark the workflow task complete', async () => {
      const taskId = nanoid();
      const bullJobId = nanoid();
      await redisService.jsonSet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
        value: {
          workflowId: WorkflowId.TEMPLATE,
          workflowInstanceId,
          status: WorkflowStatus.IN_PROGRESS,
          shardCount: 1,
          shards: {
            0: {
              status: WorkflowStatus.IN_PROGRESS,
              taskCount: 1,
              tasks: {
                [taskId]: {
                  status: WorkflowStatus.CREATED,
                },
                ['anotherTaskId']: {
                  status: WorkflowStatus.CREATED,
                },
              },
            },
          },
        },
      });
      const result = await service.markWorkflowTaskComplete({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        taskId,
        shardId: 0,
        bullJobId,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        workflowComplete: false,
        workflowShardComplete: false,
      });
      const state = await redisService.jsonGet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
      });
      expect(state._unsafeUnwrap()).toEqual({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        status: WorkflowStatus.IN_PROGRESS,
        shardCount: 1,
        shards: {
          0: {
            status: WorkflowStatus.IN_PROGRESS,
            taskCount: 1,
            tasks: {
              [taskId]: {
                status: WorkflowStatus.COMPLETED,
                bullJobs: {
                  [bullJobId]: {
                    status: WorkflowStatus.COMPLETED,
                  },
                },
              },
              ['anotherTaskId']: {
                status: WorkflowStatus.CREATED,
              },
            },
          },
        },
      });
    });

    it('should mark a workflow shard as complete if task is last to complete', async () => {
      const taskId = nanoid();
      const bullJobId = nanoid();
      await redisService.jsonSet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
        value: {
          workflowId: WorkflowId.TEMPLATE,
          workflowInstanceId,
          status: WorkflowStatus.IN_PROGRESS,
          shardCount: 2,
          shards: {
            0: {
              status: WorkflowStatus.IN_PROGRESS,
              taskCount: 2,
              tasks: {
                [taskId]: {
                  status: WorkflowStatus.CREATED,
                },
                ['anotherTaskId']: {
                  status: WorkflowStatus.COMPLETED,
                  bullJobs: {
                    ['bullJobId']: {
                      status: WorkflowStatus.COMPLETED,
                    },
                  },
                },
              },
            },
            1: {
              status: WorkflowStatus.CREATED,
              taskCount: 1,
              tasks: {
                ['anotherTaskId']: {
                  status: WorkflowStatus.CREATED,
                },
              },
            },
          },
        },
      });
      const result = await service.markWorkflowTaskComplete({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        taskId,
        shardId: 0,
        bullJobId,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        workflowComplete: false,
        workflowShardComplete: true,
      });
      const state = await redisService.jsonGet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
      });
      expect(state._unsafeUnwrap()).toEqual({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        status: WorkflowStatus.IN_PROGRESS,
        shardCount: 2,
        shards: {
          0: {
            status: WorkflowStatus.COMPLETED,
            taskCount: 2,
            tasks: {
              [taskId]: {
                status: WorkflowStatus.COMPLETED,
                bullJobs: {
                  [bullJobId]: {
                    status: WorkflowStatus.COMPLETED,
                  },
                },
              },
              ['anotherTaskId']: {
                status: WorkflowStatus.COMPLETED,
                bullJobs: {
                  ['bullJobId']: {
                    status: WorkflowStatus.COMPLETED,
                  },
                },
              },
            },
          },
          1: {
            status: WorkflowStatus.CREATED,
            taskCount: 1,
            tasks: {
              ['anotherTaskId']: {
                status: WorkflowStatus.CREATED,
              },
            },
          },
        },
      });
    });

    it('should mark a workflow as complete if task is last to complete', async () => {
      const taskId = nanoid();
      const bullJobId = nanoid();
      await redisService.jsonSet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
        value: {
          workflowId: WorkflowId.TEMPLATE,
          workflowInstanceId,
          status: WorkflowStatus.IN_PROGRESS,
          shardCount: 2,
          shards: {
            0: {
              status: WorkflowStatus.IN_PROGRESS,
              taskCount: 2,
              tasks: {
                [taskId]: {
                  status: WorkflowStatus.CREATED,
                },
                ['anotherTaskId']: {
                  status: WorkflowStatus.COMPLETED,
                  bullJobs: {
                    ['bullJobId']: {
                      status: WorkflowStatus.COMPLETED,
                    },
                  },
                },
              },
            },
            1: {
              status: WorkflowStatus.COMPLETED,
              taskCount: 1,
              tasks: {
                ['anotherTaskId']: {
                  status: WorkflowStatus.COMPLETED,
                  bullJobs: {
                    ['bullJobId']: {
                      status: WorkflowStatus.COMPLETED,
                    },
                  },
                },
              },
            },
          },
        },
      });
      const result = await service.markWorkflowTaskComplete({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        taskId,
        shardId: 0,
        bullJobId,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        workflowComplete: true,
        workflowShardComplete: true,
      });
      const state = await redisService.jsonGet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
      });
      expect(state._unsafeUnwrap()).toEqual({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        status: WorkflowStatus.COMPLETED,
        shardCount: 2,
        shards: {
          0: {
            status: WorkflowStatus.COMPLETED,
            taskCount: 2,
            tasks: {
              [taskId]: {
                status: WorkflowStatus.COMPLETED,
                bullJobs: {
                  [bullJobId]: {
                    status: WorkflowStatus.COMPLETED,
                  },
                },
              },
              ['anotherTaskId']: {
                status: WorkflowStatus.COMPLETED,
                bullJobs: {
                  ['bullJobId']: {
                    status: WorkflowStatus.COMPLETED,
                  },
                },
              },
            },
          },
          1: {
            status: WorkflowStatus.COMPLETED,
            taskCount: 1,
            tasks: {
              ['anotherTaskId']: {
                status: WorkflowStatus.COMPLETED,
                bullJobs: {
                  ['bullJobId']: {
                    status: WorkflowStatus.COMPLETED,
                  },
                },
              },
            },
          },
        },
      });
    });

    it('should not mark workflow as complete if workflow is not in IN_PROGRESS state', async () => {
      const taskId = nanoid();
      const bullJobId = nanoid();
      await redisService.jsonSet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
        value: {
          workflowId: WorkflowId.TEMPLATE,
          workflowInstanceId,
          status: WorkflowStatus.CREATED,
          shardCount: 2,
          shards: {
            0: {
              status: WorkflowStatus.IN_PROGRESS,
              taskCount: 2,
              tasks: {
                [taskId]: {
                  status: WorkflowStatus.CREATED,
                },
                ['anotherTaskId']: {
                  status: WorkflowStatus.COMPLETED,
                  bullJobs: {
                    ['bullJobId']: {
                      status: WorkflowStatus.COMPLETED,
                    },
                  },
                },
              },
            },
            1: {
              status: WorkflowStatus.COMPLETED,
              taskCount: 1,
              tasks: {
                ['anotherTaskId']: {
                  status: WorkflowStatus.COMPLETED,
                  bullJobs: {
                    ['bullJobId']: {
                      status: WorkflowStatus.COMPLETED,
                    },
                  },
                },
              },
            },
          },
        },
      });
      const result = await service.markWorkflowTaskComplete({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        taskId,
        shardId: 0,
        bullJobId,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().workflowComplete).toBe(false);
      expect(result._unsafeUnwrap().workflowShardComplete).toBe(false);
      expect(result._unsafeUnwrap()?.errors?.[0]).toBeInstanceOf(
        BadWorkflowStatusTransitionException
      );
      const state = await redisService.jsonGet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
      });
      expect(state._unsafeUnwrap()).toEqual({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        status: WorkflowStatus.CREATED,
        shardCount: 2,
        shards: {
          0: {
            status: WorkflowStatus.COMPLETED,
            taskCount: 2,
            tasks: {
              [taskId]: {
                status: WorkflowStatus.COMPLETED,
                bullJobs: {
                  [bullJobId]: {
                    status: WorkflowStatus.COMPLETED,
                  },
                },
              },
              ['anotherTaskId']: {
                status: WorkflowStatus.COMPLETED,
                bullJobs: {
                  ['bullJobId']: {
                    status: WorkflowStatus.COMPLETED,
                  },
                },
              },
            },
          },
          1: {
            status: WorkflowStatus.COMPLETED,
            taskCount: 1,
            tasks: {
              ['anotherTaskId']: {
                status: WorkflowStatus.COMPLETED,
                bullJobs: {
                  ['bullJobId']: {
                    status: WorkflowStatus.COMPLETED,
                  },
                },
              },
            },
          },
        },
      });
    });

    it('should not mark shard as complete if not IN_PROGRESS', async () => {
      const taskId = nanoid();
      const bullJobId = nanoid();
      await redisService.jsonSet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
        value: {
          workflowId: WorkflowId.TEMPLATE,
          workflowInstanceId,
          status: WorkflowStatus.IN_PROGRESS,
          shardCount: 2,
          shards: {
            0: {
              status: WorkflowStatus.CREATED,
              taskCount: 2,
              tasks: {
                [taskId]: {
                  status: WorkflowStatus.CREATED,
                },
                ['anotherTaskId']: {
                  status: WorkflowStatus.COMPLETED,
                  bullJobs: {
                    ['bullJobId']: {
                      status: WorkflowStatus.COMPLETED,
                    },
                  },
                },
              },
            },
            1: {
              status: WorkflowStatus.COMPLETED,
              taskCount: 1,
              tasks: {
                ['anotherTaskId']: {
                  status: WorkflowStatus.COMPLETED,
                  bullJobs: {
                    ['bullJobId']: {
                      status: WorkflowStatus.COMPLETED,
                    },
                  },
                },
              },
            },
          },
        },
      });
      const result = await service.markWorkflowTaskComplete({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        taskId,
        shardId: 0,
        bullJobId,
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().workflowComplete).toBe(false);
      expect(result._unsafeUnwrap().workflowShardComplete).toBe(false);
      expect(result._unsafeUnwrap()?.errors?.[0]).toBeInstanceOf(
        BadWorkflowShardStatusTransitionException
      );
      const state = await redisService.jsonGet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
      });
      expect(state._unsafeUnwrap()).toEqual({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        status: WorkflowStatus.IN_PROGRESS,
        shardCount: 2,
        shards: {
          0: {
            status: WorkflowStatus.CREATED,
            taskCount: 2,
            tasks: {
              [taskId]: {
                status: WorkflowStatus.COMPLETED,
                bullJobs: {
                  [bullJobId]: {
                    status: WorkflowStatus.COMPLETED,
                  },
                },
              },
              ['anotherTaskId']: {
                status: WorkflowStatus.COMPLETED,
                bullJobs: {
                  ['bullJobId']: {
                    status: WorkflowStatus.COMPLETED,
                  },
                },
              },
            },
          },
          1: {
            status: WorkflowStatus.COMPLETED,
            taskCount: 1,
            tasks: {
              ['anotherTaskId']: {
                status: WorkflowStatus.COMPLETED,
                bullJobs: {
                  ['bullJobId']: {
                    status: WorkflowStatus.COMPLETED,
                  },
                },
              },
            },
          },
        },
      });
    });
  });

  describe('markWorkflowTaskFailed', () => {
    it('should mark a task as failed', async () => {
      const taskId = nanoid();
      const bullJobId = nanoid();
      await redisService.jsonSet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
        value: {
          workflowId: WorkflowId.TEMPLATE,
          workflowInstanceId,
          status: WorkflowStatus.CREATED,
          shardCount: 1,
          shards: {
            0: {
              status: WorkflowStatus.CREATED,
              taskCount: 1,
              tasks: {
                [taskId]: {
                  status: WorkflowStatus.CREATED,
                },
                ['anotherTaskId']: {
                  status: WorkflowStatus.CREATED,
                },
              },
            },
          },
        },
      });
      const result = await service.markWorkflowTaskFailed({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        taskId,
        shardId: 0,
        bullJobId,
      });
      expect(result.isOk()).toBe(true);
      const state = await redisService.jsonGet({
        key: `${service['WORKFLOW_STATE_PREFIX']}:${WorkflowId.TEMPLATE}:${workflowInstanceId}`,
      });
      expect(state._unsafeUnwrap()).toEqual({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId,
        status: WorkflowStatus.CREATED,
        shardCount: 1,
        shards: {
          0: {
            status: WorkflowStatus.CREATED,
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
              ['anotherTaskId']: {
                status: WorkflowStatus.CREATED,
              },
            },
          },
        },
      });
    });
  });
});
