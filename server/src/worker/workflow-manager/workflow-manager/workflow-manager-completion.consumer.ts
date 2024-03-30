import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  WORKFLOW_MANAGER_TASK_COMPLETION_JOB_NAME,
  WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME,
  WorkflowManagerTaskCompletionJobData,
} from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-completion.producer';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { WorkflowManagerService } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';

@Processor(WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME)
export class WorkflowManagerTaskCompletionConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly workflowManagerService: WorkflowManagerService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(WORKFLOW_MANAGER_TASK_COMPLETION_JOB_NAME)
  async processWorkflowManagerTaskCompletionJob(
    job: Job<WorkflowManagerTaskCompletionJobData>
  ) {
    const result = await this.workflowManagerService.markJobComplete({
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
