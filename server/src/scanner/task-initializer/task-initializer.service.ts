import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { retryResultWithBackoff } from '@verdzie/server/common/retry-result-with-backoff';
import {
  WorkflowConfigNotFoundException,
  WorkflowManagerService,
} from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';
import { WorkflowConfig } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { WorkflowStateService } from '@verdzie/server/scanner/workflow-state/workflow-state.service';
import { PostgresQueryFailedException } from '@verdzie/server/typeorm/postgres-exceptions';
import { RedisSetException } from '@verdzie/server/wildr-redis/redis.exceptions';
import { JobProductionException } from '@verdzie/server/worker/common/wildrProducer';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Err, Result, err, fromPromise, ok } from 'neverthrow';
import { Connection, EntitySchema } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class TaskInitializerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly workflowConfigService: WorkflowManagerService,
    private readonly workflowStateService: WorkflowStateService
  ) {
    this.logger = logger.child({ context: this.constructor.name });
  }

  async initializeTasks({
    workflowInstanceId,
    workflowId,
    shardId,
    startId,
    endId,
  }: {
    workflowInstanceId: string;
    workflowId: WorkflowId;
    shardId: number;
    startId: string;
    endId?: string;
  }): Promise<
    Result<
      boolean,
      | PostgresQueryFailedException[]
      | PostgresQueryFailedException
      | WorkflowConfigNotFoundException
    >
  > {
    const context = {
      workflowInstanceId,
      workflowId,
      startId,
      endId,
    };
    this.logger.info('Initializing tasks', context);
    const config = this.workflowConfigService.getWorkflowConfig(workflowId);
    if (config.isErr()) {
      this.logger.error('Failed to get workflow config', {
        ...context,
        error: config.error,
      });
      return err(config.error);
    }
    const ids = await this.getSliceOfIds({
      schema: config.value.schema,
      startId,
      endId,
    });
    if (ids.isErr()) {
      this.logger.error('Failed to get slice of ids', {
        ...context,
        error: ids.error,
      });
      return err(ids.error);
    }
    this.logger.info('Retrieved ids', { idsCount: ids.value.length });
    const batches = _.chunk(ids.value, config.value.taskSize);
    const results = await Promise.all(
      batches.map(async ids =>
        this.produceJobAndSetTaskStatus({
          workflowId,
          workflowInstanceId,
          shardId,
          ids,
          config: config.value,
        })
      )
    );
    const failedJobs: Err<
      boolean,
      JobProductionException | PostgresQueryFailedException
    >[] = [];
    for (const result of results) {
      if (result.isErr()) failedJobs.push(result);
    }
    if (failedJobs.length) {
      this.logger.error('Failed to produce job and set task status', {
        ...context,
        failedJobs,
      });
      return err(failedJobs.map(f => f.error));
    }
    await retryResultWithBackoff({
      fn: () =>
        this.workflowStateService.markWorkflowShardInProgress({
          workflowId,
          workflowInstanceId,
          shardId,
          taskCount: batches.length,
        }),
      retryCount: 3,
      logFailure: ({ error }) =>
        this.logger.error('failed to set workflow shard task count', {
          ...context,
          error,
        }),
    });
    this.logger.info('Successfully initialized tasks', {
      ...context,
      taskCount: batches.length,
    });
    return ok(true);
  }

  private async produceJobAndSetTaskStatus({
    workflowId,
    workflowInstanceId,
    shardId,
    ids,
    config,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    shardId: number;
    ids: string[];
    config: WorkflowConfig;
  }): Promise<Result<boolean, JobProductionException | RedisSetException>> {
    const context = {
      workflowId,
      workflowInstanceId,
      shardId,
      ids,
    };
    const taskId = nanoid();
    // These two tasks must be done in this order or we could end up with
    // tasks in the state that will never be completed as they have no
    // corresponding bull job. This would result in the workflow being stuck.
    const jobProduceResult = await config.produceJob({
      workflowMetadata: {
        workflowId,
        workflowInstanceId,
        shardId,
        taskId,
      },
      ids,
    });
    if (jobProduceResult.isErr()) {
      this.logger.error('Failed to produce task job', {
        error: jobProduceResult.error,
        ...context,
      });
      return err(jobProduceResult.error);
    }
    const stateResult = await this.workflowStateService.upsertWorkflowTask({
      workflowId,
      workflowInstanceId,
      shardId,
      taskId,
      bullJobId: jobProduceResult.value,
    });
    if (stateResult.isErr()) {
      this.logger.error('Failed to create workflow task state', {
        error: stateResult.error,
        ...context,
      });
      return err(stateResult.error);
    }
    return ok(true);
  }

  private async getSliceOfIds({
    schema,
    startId,
    endId,
  }: {
    schema: EntitySchema;
    startId: string;
    endId?: string;
  }): Promise<
    Result<
      string[],
      PostgresQueryFailedException | WorkflowConfigNotFoundException
    >
  > {
    const query = this.connection
      .getRepository(schema)
      .createQueryBuilder()
      .where('id >= :startId', { startId });
    if (endId) query.andWhere('id < :endId', { endId });
    query.orderBy('id', 'ASC');
    const ids = await fromPromise(
      query.getMany(),
      error => new PostgresQueryFailedException({ error })
    );
    if (ids.isErr()) {
      this.logger.error('Failed to get slice of ids', { error: ids.error });
      return err(ids.error);
    }
    return ok(ids.value.map(id => id.id));
  }
}
