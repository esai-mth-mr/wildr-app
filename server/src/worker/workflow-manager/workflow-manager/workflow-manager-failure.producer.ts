import { Inject, Injectable } from '@nestjs/common';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import {
  JobProductionException,
  WildrProducer,
} from '@verdzie/server/worker/common/wildrProducer';
import Bull, { Job, Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result } from 'neverthrow';
import { Logger } from 'winston';
import { InjectQueue } from '@nestjs/bull';

export const WORKFLOW_MANAGER_TASK_FAILURE_QUEUE_NAME =
  'workflow-manager-task-failure-queue';
export const WORKFLOW_MANAGER_TASK_FAILURE_JOB_NAME =
  'workflow-manager-task-failure-job';

export interface WorkflowManagerTaskFailureJobData {
  workflowInstanceId: string;
  workflowId: WorkflowId;
  shardId: number;
  taskId: string;
  bullJobId: Bull.JobId;
}

@Injectable()
export class WorkflowManagerTaskFailureProducer extends WildrProducer {
  constructor(
    @InjectQueue(WORKFLOW_MANAGER_TASK_FAILURE_QUEUE_NAME)
    readonly queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createWorkflowManagerFailureJob(
    jobData: WorkflowManagerTaskFailureJobData
  ): Promise<
    Result<Job<WorkflowManagerTaskFailureJobData>, JobProductionException>
  > {
    return this.produceResult({
      jobName: WORKFLOW_MANAGER_TASK_FAILURE_JOB_NAME,
      jobData,
    });
  }
}
