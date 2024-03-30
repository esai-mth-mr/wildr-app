import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export const SCAN_INITIALIZER_QUEUE_NAME = 'scan-initializer-queue';
export const SCAN_INITIALIZER_JOB_NAME = 'scan-initializer-job';

export interface ScanInitializerJobData {
  workflowId: WorkflowId;
}

@Injectable()
export class ScanInitializerProducer extends WildrProducer {
  constructor(
    @InjectQueue(SCAN_INITIALIZER_QUEUE_NAME)
    protected readonly queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createScanJob(job: ScanInitializerJobData) {
    return this.produceResult({
      jobName: SCAN_INITIALIZER_JOB_NAME,
      jobData: job,
    });
  }
}
