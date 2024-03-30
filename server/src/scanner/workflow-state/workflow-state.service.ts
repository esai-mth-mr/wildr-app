import { Inject, Injectable } from '@nestjs/common';
import { retryResultWithBackoff } from '@verdzie/server/common/retry-result-with-backoff';
import { WorkflowId } from '../workflow-manager/workflow-manager.types';
import {
  BadWorkflowShardStatusTransitionException,
  BadWorkflowStatusTransitionException,
} from '@verdzie/server/scanner/workflow-state/workflow-state.exceptions';
import { RedisSetException } from '@verdzie/server/wildr-redis/redis.exceptions';
import { WildrRedisService } from '@verdzie/server/wildr-redis/wildr-redis.service';
import Bull from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Logger } from 'winston';

export enum WorkflowStatus {
  CREATED = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  FAILED = 3,
}

// workflow-instance-state#workflowId#workflowInstanceId
export interface WorkflowInstanceState {
  workflowId: WorkflowId;
  workflowInstanceId: string;
  shardCount: number;
  status: WorkflowStatus;
  shards: {
    [shardId: number]: WorkflowShardState;
  };
}

export interface WorkflowShardState {
  status: WorkflowStatus;
  taskCount: number;
  tasks: {
    [taskId: string]: WorkflowTaskState;
  };
}

export interface WorkflowTaskState {
  status: WorkflowStatus;
  bullJobs: {
    [jobId: string]: {
      status: WorkflowStatus;
    };
  };
}

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

@Injectable()
export class WorkflowStateService {
  private readonly WORKFLOW_STATE_PREFIX = 'workflow-instance-state';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly redisService: WildrRedisService
  ) {
    this.logger = this.logger.child({ context: WorkflowStateService.name });
  }

  async createWorkflowInstanceState({
    workflowId,
    workflowInstanceId,
    shardCount,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    shardCount: number;
  }): Promise<Result<{ workflowInstanceId: string }, RedisSetException>> {
    const context = {
      workflowId,
      shardCount,
      workflowInstanceId,
      methodName: 'createWorkflowInstanceState',
    };
    const workflowInstanceState: WorkflowInstanceState = {
      workflowId,
      workflowInstanceId,
      shardCount: shardCount,
      status: WorkflowStatus.CREATED,
      shards: {},
    };
    for (let i = 0; i < shardCount; i++) {
      workflowInstanceState.shards[i] = {
        status: WorkflowStatus.CREATED,
        taskCount: 0,
        tasks: {},
      };
    }
    const result = await this.redisService.jsonSet({
      key: this.getWorkflowStateKey({
        workflowId,
        workflowInstanceId,
      }),
      value: workflowInstanceState,
    });
    if (result.isErr()) {
      this.logger.error('Failed to create workflow instance state', {
        ...context,
        error: result.error,
      });
      // @ts-ignore
      return err(result.error);
    }
    await retryResultWithBackoff({
      fn: () =>
        this.redisService.setKeyExpire({
          key: this.getWorkflowStateKey({
            workflowId,
            workflowInstanceId,
          }),
          seconds: SEVEN_DAYS_IN_SECONDS,
        }),
      retryCount: 5,
      logFailure: ({ error }) =>
        this.logger.error('Failed to set key expiry, will retry', {
          ...context,
          error,
        }),
    });
    return ok({ workflowInstanceId });
  }

  async setWorkflowStatusInProgress({
    workflowId,
    workflowInstanceId,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
  }): Promise<Result<boolean, RedisSetException>> {
    const context = {
      workflowId,
      workflowInstanceId,
      methodName: 'setWorkflowStatusInProgress',
    };
    const result = await this.setWorkflowStatus({
      workflowId,
      workflowInstanceId,
      status: WorkflowStatus.IN_PROGRESS,
    });
    if (result.isErr()) {
      this.logger.error('Failed to set workflow status in progress', {
        ...context,
        error: result.error,
      });
      return err(result.error);
    }
    return ok(true);
  }

  async markWorkflowShardInProgress({
    workflowId,
    workflowInstanceId,
    shardId,
    taskCount,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    shardId: number;
    taskCount: number;
  }): Promise<Result<boolean, RedisSetException>> {
    const context = {
      workflowId,
      workflowInstanceId,
      shardId,
      taskCount,
      methodName: 'setWorkflowShardTaskCount',
    };
    const taskCountResult = await this.redisService.jsonSet({
      key: this.getWorkflowStateKey({
        workflowId,
        workflowInstanceId,
      }),
      path: `$.shards.${shardId}.taskCount`,
      value: taskCount,
    });
    if (taskCountResult.isErr()) {
      this.logger.error('Failed to set workflow shard task count', {
        error: taskCountResult.error,
        ...context,
      });
      return err(taskCountResult.error);
    }
    const workflowStatusResult = await this.redisService.jsonSet({
      key: this.getWorkflowStateKey({
        workflowId,
        workflowInstanceId,
      }),
      path: `$.shards.${shardId}.status`,
      value: WorkflowStatus.IN_PROGRESS,
    });
    if (workflowStatusResult.isErr()) {
      this.logger.error('Failed to set workflow shard to IN_PROGRESS', {
        error: workflowStatusResult.error,
        ...context,
      });
      return err(workflowStatusResult.error);
    }
    return ok(true);
  }

  async upsertWorkflowTask({
    workflowId,
    workflowInstanceId,
    taskId,
    bullJobId,
    shardId,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    taskId: string;
    bullJobId: Bull.JobId;
    shardId: number;
  }): Promise<Result<boolean, RedisSetException>> {
    const context = {
      workflowId,
      workflowInstanceId,
      taskId,
      shardId,
      methodName: 'upsertWorkflowTask',
    };
    const taskStateResult = await this.redisService.jsonGet<WorkflowTaskState>({
      key: this.getWorkflowStateKey({
        workflowId,
        workflowInstanceId,
      }),
      path: `.shards.${shardId}.tasks.${taskId}`,
    });
    if (taskStateResult.isErr()) {
      this.logger.info('Workflow task not found, creating new one', {
        error: taskStateResult.error,
        ...context,
      });
    }
    const taskState = taskStateResult.isOk()
      ? taskStateResult.value
      : {
          status: WorkflowStatus.CREATED,
          bullJobs: {},
        };
    taskState.bullJobs[bullJobId] = {
      status: WorkflowStatus.CREATED,
    };
    // Not concerned about update race conditions here as task should only have
    // one bull job at a time.
    const result = await this.redisService.jsonSet({
      key: this.getWorkflowStateKey({
        workflowId,
        workflowInstanceId,
      }),
      path: `$.shards.${shardId}.tasks.${taskId}`,
      value: taskState,
    });
    if (result.isErr()) {
      this.logger.error('Failed to upsert workflow task', {
        error: result.error,
        ...context,
      });
      return err(result.error);
    }
    return ok(true);
  }

  async markWorkflowTaskComplete({
    workflowId,
    workflowInstanceId,
    taskId,
    shardId,
    bullJobId,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    taskId: string;
    bullJobId: Bull.JobId;
    shardId: number;
  }): Promise<
    Result<
      {
        workflowShardComplete: boolean;
        workflowComplete: boolean;
        errors?: Error[];
      },
      RedisSetException
    >
  > {
    const context = {
      workflowId,
      workflowInstanceId,
      shardId,
      methodName: 'markWorkflowTaskComplete',
    };
    this.logger.info('Marking workflow task complete', context);
    const taskResult = await this.setWorkflowTaskStatus({
      workflowId,
      workflowInstanceId,
      taskId,
      shardId,
      bullJobId,
      status: WorkflowStatus.COMPLETED,
    });
    if (taskResult.isErr()) return err(taskResult.error);
    const setWorkflowShardComplete = await this.tryMarkWorkflowShardComplete({
      workflowId,
      workflowInstanceId,
      shardId,
    });
    if (setWorkflowShardComplete.isErr()) {
      if (setWorkflowShardComplete.error instanceof RedisSetException) {
        this.logger.error('Failure during workflow shard completion attempt', {
          error: setWorkflowShardComplete.error,
          ...context,
        });
        return err(setWorkflowShardComplete.error);
      }
      this.logger.warn('Bad workflow status transition', {
        error: setWorkflowShardComplete.error,
        ...context,
      });
      return ok({
        workflowComplete: false,
        workflowShardComplete: false,
        errors: [setWorkflowShardComplete.error],
      });
    }
    return ok(setWorkflowShardComplete.value);
  }

  async markWorkflowTaskFailed({
    workflowId,
    workflowInstanceId,
    taskId,
    shardId,
    bullJobId,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    taskId: string;
    bullJobId: Bull.JobId;
    shardId: number;
  }): Promise<Result<boolean, RedisSetException>> {
    return this.setWorkflowTaskStatus({
      workflowId,
      workflowInstanceId,
      taskId,
      shardId,
      bullJobId,
      status: WorkflowStatus.FAILED,
    });
  }

  private async setWorkflowTaskStatus({
    workflowId,
    workflowInstanceId,
    taskId,
    shardId,
    bullJobId,
    status,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    taskId: string;
    bullJobId: Bull.JobId;
    shardId: number;
    status: WorkflowStatus;
  }): Promise<Result<boolean, RedisSetException>> {
    const context = {
      workflowId,
      workflowInstanceId,
      shardId,
      methodName: 'setWorkflowTaskStatus',
    };
    const taskState = await this.redisService.jsonGet<WorkflowTaskState>({
      key: this.getWorkflowStateKey({
        workflowId,
        workflowInstanceId,
      }),
      path: `.shards.${shardId}.tasks.${taskId}`,
    });
    if (taskState.isErr()) {
      this.logger.error('Failed to get workflow task state', {
        error: taskState.error,
        ...context,
      });
      return err(taskState.error);
    }
    // Not concerned about update race conditions here as task should only have
    // one bull job at a time.
    const taskStatusSet = await this.redisService.jsonSet({
      key: this.getWorkflowStateKey({
        workflowId,
        workflowInstanceId,
      }),
      path: `$.shards.${shardId}.tasks.${taskId}`,
      value: {
        status,
        bullJobs: {
          [bullJobId]: {
            status,
          },
          ...taskState.value.bullJobs,
        },
      },
    });
    if (taskStatusSet.isErr()) {
      this.logger.error('Failed to set workflow task status', {
        error: taskStatusSet.error,
        ...context,
      });
      return err(taskStatusSet.error);
    }
    return ok(true);
  }

  private async tryMarkWorkflowShardComplete({
    workflowId,
    workflowInstanceId,
    shardId,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    shardId: number;
  }): Promise<
    Result<
      { workflowShardComplete: boolean; workflowComplete: boolean },
      | BadWorkflowShardStatusTransitionException
      | BadWorkflowStatusTransitionException
      | RedisSetException
    >
  > {
    const context = {
      workflowId,
      workflowInstanceId,
      shardId,
      methodName: 'tryMarkWorkflowShardComplete',
    };
    const shardState = await this.redisService.jsonGet<WorkflowShardState>({
      key: this.getWorkflowStateKey({
        workflowId,
        workflowInstanceId,
      }),
      path: `.shards.${shardId}`,
    });
    if (shardState.isErr()) {
      this.logger.error('Failed to get workflow shard state', {
        error: shardState.error,
        ...context,
      });
      return err(shardState.error);
    }
    const allTasksComplete = Object.values(shardState.value.tasks).every(
      task => task.status === WorkflowStatus.COMPLETED
    );
    if (!allTasksComplete) {
      return ok({ workflowShardComplete: false, workflowComplete: false });
    }
    // It is possible for a single task to be created from the task initializer
    // while other tasks fail to be created. This task would then see the shard
    // without any tasks and mark it complete. Thus, we check for IN_PROGRESS
    // which is only set when all tasks have been created.
    if (shardState.value.status !== WorkflowStatus.IN_PROGRESS) {
      this.logger.warn(
        'Attempted to mark workflow shard COMPLETE before IN_PROGRESS',
        {
          workflowId,
          workflowInstanceId,
          shardId,
        }
      );
      return err(
        new BadWorkflowShardStatusTransitionException({
          currentState: shardState.value.status,
          newState: WorkflowStatus.COMPLETED,
          debugData: {
            workflowId,
            workflowInstanceId,
            shardId,
          },
        })
      );
    }
    const statusSet = await this.setWorkflowShardStatus({
      workflowId,
      workflowInstanceId,
      shardId,
      status: WorkflowStatus.COMPLETED,
    });
    if (statusSet.isErr()) return err(statusSet.error);
    const workflowMarkedComplete = await this.tryMarkWorkflowComplete({
      workflowId,
      workflowInstanceId,
    });
    if (workflowMarkedComplete.isErr())
      return err(workflowMarkedComplete.error);
    return ok({
      workflowShardComplete: true,
      workflowComplete: workflowMarkedComplete.value.workflowComplete,
    });
  }

  private async tryMarkWorkflowComplete({
    workflowId,
    workflowInstanceId,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
  }): Promise<
    Result<
      { workflowComplete: boolean },
      BadWorkflowStatusTransitionException | RedisSetException
    >
  > {
    const workflowState =
      await this.redisService.jsonGet<WorkflowInstanceState>({
        key: this.getWorkflowStateKey({
          workflowId,
          workflowInstanceId,
        }),
      });
    if (workflowState.isErr()) return err(workflowState.error);
    const allShardsComplete = Object.values(workflowState.value.shards).every(
      shard => shard.status === WorkflowStatus.COMPLETED
    );
    if (!allShardsComplete) {
      return ok({ workflowComplete: false });
    }
    // It is possible for a single shard to be created from the scan initializer
    // while other shards fail to be created. This shard would then see the
    // workflow without any shards and mark it complete. Thus, we check for
    // IN_PROGRESS which is only set when all shards have been created.
    if (
      allShardsComplete &&
      workflowState.value.status !== WorkflowStatus.IN_PROGRESS
    ) {
      this.logger.warn(
        'Attempted to mark workflow complete before IN_PROGRESS',
        {
          workflowId,
          workflowInstanceId,
        }
      );
      return err(
        new BadWorkflowStatusTransitionException({
          currentState: workflowState.value.status,
          newState: WorkflowStatus.COMPLETED,
          debugData: {
            workflowId,
            workflowInstanceId,
          },
        })
      );
    }
    const result = await this.setWorkflowStatus({
      workflowId,
      workflowInstanceId,
      status: WorkflowStatus.COMPLETED,
    });
    if (result.isErr()) return err(result.error);
    this.logger.info('Workflow complete', {
      workflowId,
      workflowInstanceId,
    });
    return ok({ workflowComplete: true });
  }

  private async setWorkflowStatus({
    workflowId,
    workflowInstanceId,
    status,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    status: WorkflowStatus;
  }): Promise<Result<boolean, RedisSetException>> {
    const context = {
      workflowId,
      workflowInstanceId,
    };
    const result = await this.redisService.jsonSet({
      key: this.getWorkflowStateKey({
        workflowId,
        workflowInstanceId,
      }),
      path: `$.status`,
      value: status,
    });
    if (result.isErr()) {
      this.logger.error('Failed to set workflow status', {
        error: result.error,
        ...context,
      });
      return err(result.error);
    }
    return ok(true);
  }

  private async setWorkflowShardStatus({
    workflowId,
    workflowInstanceId,
    shardId,
    status,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    shardId: number;
    status: WorkflowStatus;
  }): Promise<Result<boolean, RedisSetException>> {
    const context = {
      workflowId,
      workflowInstanceId,
      shardId,
      methodName: 'setWorkflowShardStatus',
    };
    const result = await this.redisService.jsonSet({
      key: this.getWorkflowStateKey({
        workflowId,
        workflowInstanceId,
      }),
      path: `$.shards.${shardId}.status`,
      value: status,
    });
    if (result.isErr()) {
      this.logger.error('Failed to set workflow shard status', {
        error: result.error,
        ...context,
      });
      return err(result.error);
    }
    return ok(true);
  }

  private getWorkflowStateKey({
    workflowId,
    workflowInstanceId,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
  }): string {
    return `${this.WORKFLOW_STATE_PREFIX}:${workflowId}:${workflowInstanceId}`;
  }
}
