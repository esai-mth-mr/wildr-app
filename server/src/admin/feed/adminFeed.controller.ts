import {
  Controller,
  Get,
  Inject,
  Injectable,
  Param,
  UseFilters,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RestApiExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import { GenericResponse } from '@verdzie/server/admin/common/common.request.response';
import { IsString } from 'class-validator';
import { AdminFeedService } from '@verdzie/server/admin/feed/adminFeed.service';

class UserFeedParam {
  @IsString()
  id: string;
}

@Injectable()
@Controller('feed')
export class AdminFeedController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private adminFeedService: AdminFeedService
  ) {
    this.logger = this.logger.child({ context: 'AdminNotificationController' });
  }

  @Get('user/:id')
  @UseFilters(new RestApiExceptionFilter())
  async getUserFeed(@Param() param: UserFeedParam): Promise<GenericResponse> {
    this.logger.debug('requested USER admin/feed/id', { param });
    try {
      const userFeed = await this.adminFeedService.getUserFeed(param.id);
      return { status: 'OK', data: userFeed };
    } catch (e) {
      this.logger.error('getUserFeed', { e });
      return { status: 'ERROR' };
    }
  }
}
