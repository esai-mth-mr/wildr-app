import { Inject, Injectable } from '@nestjs/common';
import {
  JobProductionException,
  WildrProducer,
} from '@verdzie/server/worker/common/wildrProducer';
import Bull, { Job, Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result } from 'neverthrow';
import { Logger } from 'winston';
import { InjectQueue } from '@nestjs/bull';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';

export const WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME =
  'workflow-manager-task-completion-queue';
export const WORKFLOW_MANAGER_TASK_COMPLETION_JOB_NAME =
  'workflow-manager-task-completion-job';

export interface WorkflowManagerTaskCompletionJobData {
  workflowInstanceId: string;
  workflowId: WorkflowId;
  shardId: number;
  taskId: string;
  bullJobId: Bull.JobId;
}

@Injectable()
export class WorkflowManagerTaskCompletionProducer extends WildrProducer {
  constructor(
    @InjectQueue(WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME)
    readonly queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createWorkflowManagerCompletionJob(
    jobData: WorkflowManagerTaskCompletionJobData
  ): Promise<
    Result<Job<WorkflowManagerTaskCompletionJobData>, JobProductionException>
  > {
    return this.produceResult({
      jobName: WORKFLOW_MANAGER_TASK_COMPLETION_JOB_NAME,
      jobData,
    });
  }
}
