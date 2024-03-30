import { Inject, Injectable } from '@nestjs/common';
import {
  NotFoundException,
  NotFoundExceptionCodes,
  logAndReturnErr,
} from '@verdzie/server/exceptions/wildr.exception';
import { UserStatsSyncWorkflowConfig } from '@verdzie/server/scanner/workflow-manager/configs/user-stats-sync.workflow-config';
import { WorkflowTemplateConfig } from '@verdzie/server/scanner/workflow-manager/configs/workflow-template.config';
import { WorkflowStateService } from '@verdzie/server/scanner/workflow-state/workflow-state.service';
import { RedisSetException } from '@verdzie/server/wildr-redis/redis.exceptions';
import { JobProductionException } from '@verdzie/server/worker/common/wildrProducer';
import { WorkflowManagerTaskCompletionProducer } from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-completion.producer';
import { WorkflowManagerTaskFailureProducer } from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-failure.producer';
import Bull, { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Logger } from 'winston';
import { WorkflowId } from './workflow-manager.types';
import { WorkflowConfig } from './workflow-manager.types';

@Injectable()
export class WorkflowManagerService {
  configs: WorkflowConfig[] = [];

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly workflowStateService: WorkflowStateService,
    private readonly taskCompletionProducer: WorkflowManagerTaskCompletionProducer,
    private readonly taskFailureProducer: WorkflowManagerTaskFailureProducer,
    private readonly templateConfig: WorkflowTemplateConfig,
    private readonly userStatsSyncConfig: UserStatsSyncWorkflowConfig
  ) {
    this.configs = [templateConfig, userStatsSyncConfig];
  }

  async handleJobCompletion(
    job: Job
  ): Promise<Result<boolean, JobProductionException>> {
    this.logger.info('Handling job completion', { job });
    if (!job?.data?.workflowMetadata) {
      this.logger.warn('Job completion without workflow metadata', { job });
      return ok(true);
    }
    const { workflowId, workflowInstanceId, shardId, taskId } =
      job.data.workflowMetadata;
    const result =
      await this.taskCompletionProducer.createWorkflowManagerCompletionJob({
        workflowId,
        workflowInstanceId,
        shardId,
        taskId,
        bullJobId: job.id,
      });
    if (result.isErr()) {
      return logAndReturnErr({ error: result.error, logger: this.logger });
    }
    return ok(true);
  }

  async handleJobFailure(
    job: Job
  ): Promise<Result<boolean, JobProductionException>> {
    this.logger.info('Handling job failure', { job });
    if (!job?.data?.workflowMetadata) {
      this.logger.warn('Job failure without workflow metadata', { job });
      return ok(true);
    }
    const { workflowId, workflowInstanceId, shardId, taskId } =
      job.data.workflowMetadata;
    const result =
      await this.taskFailureProducer.createWorkflowManagerFailureJob({
        workflowId,
        workflowInstanceId,
        shardId,
        taskId,
        bullJobId: job.id,
      });
    if (result.isErr()) {
      return logAndReturnErr({ error: result.error, logger: this.logger });
    }
    return ok(true);
  }

  async markJobComplete({
    workflowId,
    workflowInstanceId,
    shardId,
    taskId,
    bullJobId,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    shardId: number;
    taskId: string;
    bullJobId: Bull.JobId;
  }): Promise<
    Result<
      { workflowShardComplete: boolean; workflowComplete: boolean },
      RedisSetException
    >
  > {
    this.logger.info('Recording job completion', {
      workflowId,
      workflowInstanceId,
      shardId,
      taskId,
      bullJobId,
    });
    const result = await this.workflowStateService.markWorkflowTaskComplete({
      workflowId,
      workflowInstanceId,
      shardId,
      taskId,
      bullJobId,
    });
    if (result.isErr())
      return logAndReturnErr({ error: result.error, logger: this.logger });
    return ok(result.value);
  }

  async markJobFailed({
    workflowId,
    workflowInstanceId,
    shardId,
    taskId,
    bullJobId,
  }: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    shardId: number;
    taskId: string;
    bullJobId: Bull.JobId;
  }): Promise<Result<boolean, RedisSetException>> {
    this.logger.info('Recording job failure', {
      workflowId,
      workflowInstanceId,
      shardId,
      taskId,
      bullJobId,
    });
    const result = await this.workflowStateService.markWorkflowTaskFailed({
      workflowId,
      workflowInstanceId,
      shardId,
      taskId,
      bullJobId,
    });
    if (result.isErr())
      return logAndReturnErr({ error: result.error, logger: this.logger });
    return ok(result.value);
  }

  getWorkflowConfig(
    workflowId: WorkflowId
  ): Result<WorkflowConfig, WorkflowConfigNotFoundException> {
    const config = this.configs.find(c => c.workflowId === workflowId);
    if (!config) {
      return err(new WorkflowConfigNotFoundException(workflowId));
    }
    return ok(config);
  }
}

export class WorkflowConfigNotFoundException extends NotFoundException {
  constructor(workflowId: WorkflowId) {
    super(`ScanWorkflowConfig not found`, {
      workflowId,
      exceptionCode: NotFoundExceptionCodes.WORKFLOW_CONFIG_NOT_FOUND,
    });
  }
}
