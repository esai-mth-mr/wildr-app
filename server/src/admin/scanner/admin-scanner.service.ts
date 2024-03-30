import { Inject, Injectable } from '@nestjs/common';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { JobProductionException } from '@verdzie/server/worker/common/wildrProducer';
import { ScanInitializerProducer } from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Result, err, ok } from 'neverthrow';
import { Logger } from 'winston';

@Injectable()
export class AdminScannerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly scanInitializerProducer: ScanInitializerProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async requestScan({
    workflowId,
  }: {
    workflowId: WorkflowId;
  }): Promise<Result<boolean, JobProductionException>> {
    const result = await this.scanInitializerProducer.createScanJob({
      workflowId,
    });
    if (result.isErr()) {
      this.logger.error('Failed to produce scan job', result.error);
      return err(result.error);
    }
    return ok(true);
  }
}
