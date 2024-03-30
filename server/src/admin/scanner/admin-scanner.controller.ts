import { Body, Controller, Inject, Injectable, Post } from '@nestjs/common';
import { AdminScannerService } from '@verdzie/server/admin/scanner/admin-scanner.service';
import { RequestScanDto } from '@verdzie/server/admin/scanner/dto/request-scan.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
@Controller('scanner')
export class AdminScannerController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly scannerService: AdminScannerService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Post('request-scan')
  async requestScan(@Body() body: RequestScanDto) {
    await this.scannerService.requestScan({
      workflowId: body.workflowId,
    });
  }
}
