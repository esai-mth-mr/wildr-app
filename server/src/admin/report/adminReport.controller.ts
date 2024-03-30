import {
  Body,
  Controller,
  Get,
  Inject,
  Injectable,
  Param,
  Put,
  Query,
  UseFilters,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RestApiExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import { IsString } from 'class-validator';
import { AdminReportService } from '@verdzie/server/admin/report/adminReport.service';
import { UpdateReportQuery } from '@verdzie/server/admin/report/adminReport.query';
import { GenericResponse } from '@verdzie/server/admin/common/common.request.response';
class GetReviewParams {
  @IsString()
  date: string;
  @IsString()
  limit: number;
}
@Injectable()
@Controller('report')
export class AdminReportController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private adminReportService: AdminReportService
  ) {
    this.logger = this.logger.child({ context: 'AdminReportController' });
  }
  @Get()
  @UseFilters(new RestApiExceptionFilter())
  async getReviewReports(
    @Query() query: GetReviewParams
  ): Promise<GenericResponse> {
    this.logger.debug('requested GET admin/report/', { query });
    try {
      return {
        status: 'OK',
        data: await this.adminReportService.getReviewReportRequest(
          query.date,
          query.limit
        ),
      };
    } catch (e) {
      this.logger.error('getReviewReports()', { e });
      return { status: 'ERROR' };
    }
  }
  @Get('/users/:id')
  @UseFilters(new RestApiExceptionFilter())
  async getReporters(@Param() id: string): Promise<GenericResponse> {
    this.logger.debug('requested GET admin/reporters/:id', { id });
    try {
      return {
        status: 'OK',
        data: await this.adminReportService.getReport(id),
      };
    } catch (e) {
      this.logger.error('getReviewReports()', { e });
      return { status: 'ERROR' };
    }
  }
  @Put()
  @UseFilters(new RestApiExceptionFilter())
  async updateReport(
    @Body() body: UpdateReportQuery
  ): Promise<GenericResponse> {
    this.logger.debug('requested PUT admin/report/', { body });
    const result = await this.adminReportService.updateReport(body);
    return { status: result ? 'OK' : 'ERROR' };
  }
}
