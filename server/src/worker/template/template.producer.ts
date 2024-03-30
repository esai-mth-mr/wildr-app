import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { WorkflowJobData } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import {
  JobProductionException,
  WildrProducer,
} from '@verdzie/server/worker/common/wildrProducer';
import { Job, Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result } from 'neverthrow';
import { Logger } from 'winston';

export const TEMPLATE_QUEUE_NAME = 'template-queue-name';
export const TEMPLATE_JOB_NAME = 'template-job-name';

export interface TemplateWorkflowJobData extends WorkflowJobData {
  ids: string[];
}

@Injectable()
export class TemplateProducer extends WildrProducer {
  constructor(
    @InjectQueue(TEMPLATE_QUEUE_NAME)
    protected readonly queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createTemplateJob(
    jobData: TemplateWorkflowJobData
  ): Promise<Result<Job<TemplateProducer>, JobProductionException>> {
    return this.produceResult({
      jobName: TEMPLATE_JOB_NAME,
      jobData,
    });
  }
}
