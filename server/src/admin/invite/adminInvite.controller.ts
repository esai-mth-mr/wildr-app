import {
  Body,
  Controller,
  Get,
  Inject,
  Injectable,
  Param,
  Put,
  UseFilters,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RestApiExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import { AdminInviteService } from '@verdzie/server/admin/invite/adminInvite.service';
import { IsInt, IsPositive, IsString } from 'class-validator';

class InviteParam {
  @IsString()
  handle: string;
}

class AddInvitesBody {
  @IsString()
  userId: string;
  @IsInt()
  @IsPositive()
  numberOfInvites: number;
}

class CreateReferralBody {
  @IsString()
  handle: string;
  @IsString()
  utmName: string;
  @IsString()
  sourceName: string;
}

@Injectable()
@Controller('invite')
export class AdminInviteController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private adminInviteService: AdminInviteService
  ) {
    this.logger = this.logger.child({ context: 'AdminInviteController' });
  }

  @Get('/handle/:handle')
  @UseFilters(new RestApiExceptionFilter())
  async getCodeRequestByHandle(@Param() param: InviteParam) {
    this.logger.debug('requested GET admin/invite/handle/:handle', { param });
    try {
      return {
        status: 'OK',
        data: await this.adminInviteService.getInviteCodeDetailsByHandle(
          param.handle
        ),
      };
    } catch (e) {
      this.logger.error('getCodeRequestByHandle()', { e });
      return { status: 'ERROR', errorMessage: 'User not found' };
    }
  }

  @Put('/add')
  @UseFilters(new RestApiExceptionFilter())
  async addInviteCodes(@Body() addInvitesBody: AddInvitesBody) {
    this.logger.debug('requested Put admin/invite/add', {
      body: addInvitesBody,
    });
    return this.adminInviteService.addInvites(
      addInvitesBody.userId,
      addInvitesBody.numberOfInvites
    );
  }

  @Put('/create-referral')
  @UseFilters(new RestApiExceptionFilter())
  async createReferral(@Body() createReferralBody: CreateReferralBody) {
    this.logger.debug('requested Put admin/invite/create-referral', {
      body: createReferralBody,
    });
    return await this.adminInviteService.generateReferralInvite(
      createReferralBody.handle,
      createReferralBody.utmName,
      createReferralBody.sourceName
    );
  }
}
