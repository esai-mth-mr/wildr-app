import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WorkflowManagerService } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import {
  WORKFLOW_MANAGER_TASK_FAILURE_JOB_NAME,
  WORKFLOW_MANAGER_TASK_FAILURE_QUEUE_NAME,
  WorkflowManagerTaskFailureJobData,
} from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-failure.producer';

@Processor(WORKFLOW_MANAGER_TASK_FAILURE_QUEUE_NAME)
export class WorkflowManagerTaskFailureConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly workflowManagerService: WorkflowManagerService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(WORKFLOW_MANAGER_TASK_FAILURE_JOB_NAME)
  async processWorkflowManagerTaskFailureJob(
    job: Job<WorkflowManagerTaskFailureJobData>
  ) {
    const result = await this.workflowManagerService.markJobFailed({
      workflowId: job.data.workflowId,
      workflowInstanceId: job.data.workflowInstanceId,
      shardId: job.data.shardId,
      taskId: job.data.taskId,
      bullJobId: job.data.bullJobId,
    });
    if (result.isErr()) {
      throw result.error;
    }
  }
}
