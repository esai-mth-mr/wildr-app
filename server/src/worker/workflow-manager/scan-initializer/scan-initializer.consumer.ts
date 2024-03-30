import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import {
  SCAN_INITIALIZER_JOB_NAME,
  SCAN_INITIALIZER_QUEUE_NAME,
  ScanInitializerJobData,
} from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.producer';
import { ScanInitializerService } from '@verdzie/server/scanner/scan-initializer/scan-initializer.service';
import { WorkflowConfigNotFoundException } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';

@Processor(SCAN_INITIALIZER_QUEUE_NAME)
export class ScanInitializerConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly scanInitializerService: ScanInitializerService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(SCAN_INITIALIZER_JOB_NAME)
  async processScanInitializerJob(job: Job<ScanInitializerJobData>) {
    const result = await this.scanInitializerService.initializeWorkflow({
      workflowId: job.data.workflowId,
    });
    if (result.isErr()) {
      if (result.error instanceof WorkflowConfigNotFoundException) {
        this.logger.error(
          'Workflow config not found, will not start workflow',
          {
            error: result.error,
          }
        );
        return;
      }
      throw result.error;
    }
  }
}
