import { Controller, Get, Inject, UseFilters } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { FirebaseAdminService } from '@verdzie/server/admin/firebase/firebase-admin.service';
import { RestApiExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import { GenericResponse } from '@verdzie/server/admin/common/common.request.response';

@Controller('firebase')
export class FirebaseAdminController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private firebaseAdminService: FirebaseAdminService
  ) {
    this.logger = this.logger.child({ context: 'FirebaseAdminController' });
  }

  @Get('all-users')
  @UseFilters(new RestApiExceptionFilter())
  async getAllUsers(): Promise<GenericResponse> {
    return {
      status: 'OK',
      data: await this.firebaseAdminService.getAllUsers(),
    };
  }
}
