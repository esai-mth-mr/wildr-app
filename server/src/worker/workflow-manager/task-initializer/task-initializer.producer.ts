import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import {
  JobProductionException,
  WildrProducer,
} from '@verdzie/server/worker/common/wildrProducer';
import { Job, Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result } from 'neverthrow';
import { Logger } from 'winston';

export const TASK_INITIALIZER_QUEUE_NAME = 'task-initializer-queue';
export const TASK_INITIALIZER_JOB_NAME = 'task-initializer-job';

export interface TaskInitializerJobData {
  workflowInstanceId: string;
  workflowId: WorkflowId;
  startId: string;
  endId?: string;
  shard: number;
}

@Injectable()
export class TaskInitializerProducer extends WildrProducer {
  constructor(
    @InjectQueue(TASK_INITIALIZER_QUEUE_NAME)
    protected readonly queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createTaskInitializerJobs(
    jobs: TaskInitializerJobData[]
  ): Promise<Result<Job<TaskInitializerJobData>[], JobProductionException>> {
    return this.produceBulkResult({
      jobName: TASK_INITIALIZER_JOB_NAME,
      jobData: jobs,
    });
  }
}
