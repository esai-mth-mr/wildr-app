import {
  Body,
  Controller,
  Inject,
  Injectable,
  Post,
  UseFilters,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RestApiExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { GenericResponse } from '@verdzie/server/admin/common/common.request.response';
import { AdminMailGunService } from '@verdzie/server/admin/mail-gun/adminMailGun.service';
import { PassFailState } from '@verdzie/server/data/common';

class SendRealIdEmailBody {
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  pass: boolean;
  @IsString()
  userId: string;
  @IsOptional()
  @IsString()
  reason?: string;
}

class SendReportEmailBody {
  @IsString()
  userId: string;
  @IsString()
  reason: string;
  @IsString()
  @IsUrl()
  link: string;
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  sectionNumber: number;
  @IsString()
  section: string;
  @IsString()
  reportId: string;
}

@Injectable()
@Controller('email')
export class AdminMailGunController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private adminMailGunService: AdminMailGunService
  ) {
    this.logger = this.logger.child({ context: 'AdminMailGunController' });
  }

  @Post('real-id')
  @UseFilters(new RestApiExceptionFilter())
  async sendRealIdEmail(
    @Body() body: SendRealIdEmailBody
  ): Promise<GenericResponse> {
    this.logger.debug('requested POST admin/email/real-id', { body });
    if (!body.pass && !body.reason)
      return { status: 'ERROR', message: 'Please provide reason' };
    const response = await this.adminMailGunService.realId(
      body.pass ? PassFailState.PASS : PassFailState.FAIL,
      body.userId,
      body.reason
    );
    return { status: response ? 'OK' : 'ERROR' };
  }

  @Post('report')
  @UseFilters(new RestApiExceptionFilter())
  async sendReportEmail(
    @Body() body: SendReportEmailBody
  ): Promise<GenericResponse> {
    this.logger.debug('requested POST admin/email/report', { body });
    const response = await this.adminMailGunService.report(
      body.userId,
      body.reason,
      body.link,
      body.sectionNumber,
      body.section,
      body.reportId
    );
    return { status: response ? 'OK' : 'ERROR' };
  }
}
