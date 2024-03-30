import {
  Body,
  Controller,
  Inject,
  Injectable,
  ParseArrayPipe,
  Post,
  Req,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AdminCreatorUserService } from '@verdzie/server/admin/creator-users/adminCreatorUser.service';
import { GenericResponse } from '@verdzie/server/admin/common/common.request.response';
import { Creator } from '@verdzie/server/admin/creator-users/creator';

@Injectable()
@Controller('create-creator-account')
export class AdminCreatorUserController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private service: AdminCreatorUserService
  ) {
    this.logger = this.logger.child({
      context: AdminCreatorUserController.name,
    });
  }

  @Post('/from-json')
  async createCreatorsAccountsFromJson(
    @Req() req?: any,
    @Body(new ParseArrayPipe({ items: Creator }))
    creators?: Creator[]
  ): Promise<GenericResponse> {
    if (!creators) {
      return {
        status: 'ERROR',
        data: 'Invalid input',
      };
    }
    try {
      const data = await this.service.createUsersFromJson(creators);
      return {
        status: 'OK',
        data,
      };
    } catch (e) {
      return {
        status: 'ERROR',
        data: e,
      };
    }
  }
}
