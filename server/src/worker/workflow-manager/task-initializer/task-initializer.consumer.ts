import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import {
  TASK_INITIALIZER_JOB_NAME,
  TASK_INITIALIZER_QUEUE_NAME,
  TaskInitializerJobData,
} from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.producer';
import { TaskInitializerService } from '@verdzie/server/scanner/task-initializer/task-initializer.service';
import { WorkflowConfigNotFoundException } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';

@Processor(TASK_INITIALIZER_QUEUE_NAME)
export class TaskInitializerConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly taskInitializerService: TaskInitializerService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(TASK_INITIALIZER_JOB_NAME)
  async processTaskInitializerJob(job: Job<TaskInitializerJobData>) {
    const result = await this.taskInitializerService.initializeTasks({
      workflowId: job.data.workflowId,
      workflowInstanceId: job.data.workflowInstanceId,
      startId: job.data.startId,
      endId: job.data.endId,
      shardId: job.data.shard,
    });
    if (result.isErr()) {
      if (result.error instanceof WorkflowConfigNotFoundException) {
        this.logger.error('Workflow config not found, will not continue', {
          error: result.error,
        });
        return;
      }
      throw result.error;
    }
  }
}
