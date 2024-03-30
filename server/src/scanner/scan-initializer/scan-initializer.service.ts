import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import {
  WorkflowConfigNotFoundException,
  WorkflowManagerService,
} from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { PostgresQueryFailedException } from '@verdzie/server/typeorm/postgres-exceptions';
import { JobProductionException } from '@verdzie/server/worker/common/wildrProducer';
import { TaskInitializerProducer } from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.producer';
import { nanoid } from 'nanoid';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, fromPromise, ok } from 'neverthrow';
import { Connection } from 'typeorm';
import { Logger } from 'winston';
import { WorkflowStateService } from '@verdzie/server/scanner/workflow-state/workflow-state.service';
import { retryResultWithBackoff } from '@verdzie/server/common/retry-result-with-backoff';

@Injectable()
export class ScanInitializerService {
  private readonly SCANNER_SLICE_SIZE = 1000;
  private readonly WORKFLOW_STATUS_RETRY_COUNT = 5;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly workflowManagerService: WorkflowManagerService,
    private readonly workflowStateService: WorkflowStateService,
    private readonly taskInitializerProducer: TaskInitializerProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async initializeWorkflow({
    workflowId,
  }: {
    workflowId: WorkflowId;
  }): Promise<
    Result<
      { workflowInstanceId: string; shardCount: number },
      | WorkflowConfigNotFoundException
      | JobProductionException
      | InternalServerErrorException
    >
  > {
    const context = { workflowId };
    this.logger.info('Initializing workflow', context);
    const workflowConfig =
      this.workflowManagerService.getWorkflowConfig(workflowId);
    if (workflowConfig.isErr()) {
      this.logger.error('Scanner job config not found', {
        jobType: workflowId,
      });
      return err(workflowConfig.error);
    }
    const tableName = workflowConfig.value.tableName;
    const ids = await this.getRowCursorsForTable({ tableName });
    if (ids.isErr()) {
      this.logger.error('Row cursor query failed', {
        ...context,
        error: ids.error,
      });
      return err(ids.error);
    }
    this.logger.info('Found cursors for scan', { idsCount: ids.value.length });
    const workflowInstanceId = nanoid();
    this.logger.info('Creating scan jobs', {
      workflowId,
      workflowInstanceId,
    });
    const workflowShardJobs = ids.value.map((id: string, index: number) => {
      return {
        workflowId,
        workflowInstanceId,
        shard: index,
        startId: id,
        endId: ids.value[index + 1],
      };
    });
    const createdState =
      await this.workflowStateService.createWorkflowInstanceState({
        workflowId,
        workflowInstanceId,
        shardCount: workflowShardJobs.length,
      });
    if (createdState.isErr()) {
      this.logger.error('Failed to create workflow state', {
        ...context,
        error: createdState.error,
      });
      return err(createdState.error);
    }
    const jobsProduced =
      await this.taskInitializerProducer.createTaskInitializerJobs(
        workflowShardJobs
      );
    if (jobsProduced.isErr()) {
      this.logger.error('Failed to produce jobs', {
        ...context,
        error: jobsProduced.error,
      });
      return err(jobsProduced.error);
    }
    await retryResultWithBackoff({
      fn: () =>
        this.workflowStateService.setWorkflowStatusInProgress({
          workflowId,
          workflowInstanceId,
        }),
      retryCount: this.WORKFLOW_STATUS_RETRY_COUNT,
      logFailure: ({ error }) => {
        this.logger.error('failed to set workflow status to IN_PROGRESS', {
          ...context,
          error,
        });
      },
    });
    return ok({ workflowInstanceId, shardCount: workflowShardJobs.length });
  }

  private async getRowCursorsForTable({
    tableName,
  }: {
    tableName: string;
  }): Promise<Result<string[], PostgresQueryFailedException>> {
    const query = /* sql */ `
    WITH NumberedRows AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
      FROM ${tableName}
    )
    SELECT id
    FROM NumberedRows
    WHERE rn = 1 OR rn % ${this.SCANNER_SLICE_SIZE} = 0;
    `;
    const ids = await fromPromise(
      this.connection.query(query),
      error => new PostgresQueryFailedException({ error, tableName })
    );
    if (ids.isErr()) return err(ids.error);
    return ok(ids.value.map((id: { id: string }) => id.id.trim()));
  }
}
