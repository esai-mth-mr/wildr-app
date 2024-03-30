import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import {
  TEMPLATE_JOB_NAME,
  TEMPLATE_QUEUE_NAME,
  TemplateWorkflowJobData,
} from '@verdzie/server/worker/template/template.producer';
import { WorkflowManagerService } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { WorkflowCompletion } from '@verdzie/server/scanner/workflow-manager/workflow-completion.decorator';

@Processor(TEMPLATE_QUEUE_NAME)
export class TemplateConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    readonly workflowManagerService: WorkflowManagerService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @WorkflowCompletion(WorkflowId.TEMPLATE)
  @Process(TEMPLATE_JOB_NAME)
  async processTemplateJob(job: Job<TemplateWorkflowJobData>) {
    this.logger.info('Processing template job');
    await new Promise<void>(r => r());
    this.logger.info('Template job complete');
  }
}
