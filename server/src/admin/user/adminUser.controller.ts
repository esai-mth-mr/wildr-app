import {
  Body,
  Controller,
  Get,
  Inject,
  Injectable,
  Param,
  Post,
  Put,
  Query,
  UseFilters,
} from '@nestjs/common';
import { GenericResponse } from '@verdzie/server/admin/common/common.request.response';
import { AdminUserService } from '@verdzie/server/admin/user/adminUser.service';
import { RestApiExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import { UserService } from '@verdzie/server/user/user.service';
import { IsArray, IsDate, IsString } from 'class-validator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  RealIdOperation,
  RealIdRequest,
  RealIdResponse,
} from '@verdzie/server/request-resposne/real-id-request-response';
import { RealIdVerificationStatus } from '@verdzie/server/real-id/realId';
import { Transform } from 'class-transformer';

class GetUsersParams {
  @IsString()
  date: string;
  @IsString()
  limit: number;
}

class GetUserByIdsBody {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}

class GetUserParam {
  @IsString()
  id: string;
}

class GetUserByHandleParam {
  @IsString()
  handle: string;
}

class GetRealIdVerifiedByDateRangeQuery {
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate: Date;
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate: Date;
}

class RejectVerifiedRealIdBody {
  @IsString()
  id: string;
  @IsString()
  reason: string;
}

@Injectable()
@Controller('user')
export class AdminUserController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private adminUserService: AdminUserService,
    private userService: UserService
  ) {
    this.logger = this.logger.child({ context: 'AdminUserController' });
  }

  @Get()
  @UseFilters(new RestApiExceptionFilter())
  async getUsers(@Query() query: GetUsersParams): Promise<GenericResponse> {
    this.logger.debug('requested GET admin/user/', { query });
    try {
      return {
        status: 'OK',
        data: await this.adminUserService.getUsers(query.date, query.limit),
      };
    } catch (e) {
      this.logger.error('getUsers()', { e });
      return { status: 'ERROR' };
    }
  }

  @Post()
  @UseFilters(new RestApiExceptionFilter())
  async getUsersByIds(
    @Body() body: GetUserByIdsBody
  ): Promise<GenericResponse> {
    this.logger.debug('requested POST admin/user/', { body });
    try {
      return {
        status: 'OK',
        data: await this.adminUserService.getUsersById(body.userIds),
      };
    } catch (e) {
      this.logger.error('getUsers()', { e });
      return { status: 'ERROR' };
    }
  }

  @Put()
  @UseFilters(new RestApiExceptionFilter())
  async updateUsers(@Body() body: any): Promise<GenericResponse> {
    this.logger.debug('requested PUT admin/user', { body });
    const response = await this.adminUserService.updateUser(body.id, body.data);
    return { status: response.affected === 1 ? 'OK' : 'ERROR' };
  }

  @Get('/real-id')
  @UseFilters(new RestApiExceptionFilter())
  async getAllRealManualReview(): Promise<RealIdResponse> {
    this.logger.debug('requested GET admin/user/real-id/', {});
    try {
      return {
        status: 'OK',
        users: await this.adminUserService.findByPendingRealIdReview(),
      };
    } catch (error) {
      return { status: 'ERROR', errorMessage: `${error}` };
    }
  }

  @Put('/real-id')
  @UseFilters(new RestApiExceptionFilter())
  async updateRealIdStatus(
    @Body() realIdRequest: RealIdRequest
  ): Promise<RealIdResponse> {
    this.logger.debug('requested PUT admin/user/real-id/', { realIdRequest });
    try {
      if (
        !realIdRequest.message &&
        realIdRequest.operation === RealIdOperation.REJECT
      ) {
        return { status: 'ERROR', errorMessage: 'Please provide a message' };
      }
      if (realIdRequest.operation === RealIdOperation.VERIFY) {
        await this.adminUserService.updateRealIdReviewStatus(
          realIdRequest.id,
          RealIdVerificationStatus.VERIFIED
        );
      } else if (realIdRequest.operation === RealIdOperation.REJECT) {
        await this.adminUserService.updateRealIdReviewStatus(
          realIdRequest.id,
          RealIdVerificationStatus.REVIEW_REJECTED,
          realIdRequest.message
        );
      }
      return { status: 'OK' };
    } catch (error) {
      return { status: 'ERROR', errorMessage: `${error}` };
    }
  }

  @Get('/handle/:handle')
  @UseFilters(new RestApiExceptionFilter())
  async getUserByHandle(
    @Param() param: GetUserByHandleParam
  ): Promise<GenericResponse> {
    this.logger.debug('requested GET admin/user/handle/:handle', {
      handle: param.handle,
    });
    try {
      return {
        status: 'OK',
        data: await this.adminUserService.findByHandle(param.handle),
      };
    } catch (e) {
      this.logger.error('getUser()', { e });
      return { status: 'ERROR' };
    }
  }

  @Put('suspend/:id')
  @UseFilters(new RestApiExceptionFilter())
  async suspendUser(@Param('id') id: string): Promise<GenericResponse> {
    this.logger.debug('requested PUT admin/user/suspend/:id', { id: id });
    try {
      await this.userService.addSuspension(id);
      return { status: 'OK' };
    } catch (e) {
      this.logger.error('getUser()', { e });
      return { status: 'ERROR' };
    }
  }

  @Put('un-suspend/:id')
  @UseFilters(new RestApiExceptionFilter())
  async unSuspend(@Param('id') id: string): Promise<GenericResponse> {
    this.logger.debug('requested PUT admin/user/un-suspend/:id', { id: id });
    try {
      await this.userService.removeSuspension(id);
      return { status: 'OK' };
    } catch (e) {
      this.logger.error('getUser()', { e });
      return { status: 'ERROR' };
    }
  }

  @Put('takedown/:id')
  @UseFilters(new RestApiExceptionFilter())
  async takedown(@Param('id') id: string): Promise<GenericResponse> {
    this.logger.debug('requested PUT admin/user/takedown/:id', { id: id });
    try {
      await this.adminUserService.takedown(id);
      return { status: 'OK' };
    } catch (e) {
      this.logger.error('getUser()', { e });
      return { status: 'ERROR' };
    }
  }

  @Put('respawn/:id')
  @UseFilters(new RestApiExceptionFilter())
  async respawn(@Param('id') id: string): Promise<GenericResponse> {
    this.logger.info('requested PUT admin/user/respawn', { id });
    const result: boolean = await this.userService.respawn(id);
    if (result) return { status: 'OK' };
    return { status: 'ERROR' };
  }

  @Put('reindex/:id')
  @UseFilters(new RestApiExceptionFilter())
  async reindex(@Param('id') id: string): Promise<GenericResponse> {
    this.logger.info('requested PUT admin/user/reindex/:id', { id });
    try {
      await this.adminUserService.reindex(id);
      this.logger.info('finished indexing user', { userId: id });
      return { status: 'OK' };
    } catch (error) {
      this.logger.error('Unable to reindex user', { userId: id, error });
      return { status: 'ERROR' };
    }
  }

  @Get('real-id/verified')
  @UseFilters(new RestApiExceptionFilter())
  async getVerifiedRealIdUsers(
    @Query() query: GetRealIdVerifiedByDateRangeQuery
  ): Promise<GenericResponse> {
    this.logger.info('requested PUT admin/user/real-id/verified', { query });
    try {
      const users = await this.adminUserService.getRealIdVerifiedUsers(
        query.startDate,
        query.endDate
      );
      this.logger.info('send user verified real id in date range', {
        dateRange: query,
      });
      return { status: 'OK', data: users };
    } catch (error) {
      this.logger.error('Unable to send user verified real id in date range', {
        dateRange: query,
        error,
      });
      return { status: 'ERROR' };
    }
  }

  @Put('real-id/reject-verified')
  @UseFilters(new RestApiExceptionFilter())
  async rejectVerifiedRealId(
    @Body() body: RejectVerifiedRealIdBody
  ): Promise<GenericResponse> {
    this.logger.info('requested PUT admin/user/real-id/reject-verified', {
      body,
    });
    try {
      const response = await this.adminUserService.rejectVerifiedRealId(
        body.id,
        body.reason
      );
      return { status: response ? 'OK' : 'ERROR' };
    } catch (error) {
      this.logger.error('Unable reject verified Real-Id', {
        body,
      });
      return { status: 'ERROR' };
    }
  }

  //Keep this last as order matters
  @Get(':id')
  @UseFilters(new RestApiExceptionFilter())
  async getUser(@Param() param: GetUserParam): Promise<GenericResponse> {
    this.logger.debug('requested GET admin/user/:id', { id: param.id });
    try {
      return {
        status: 'OK',
        data: await this.adminUserService.findById(param.id),
      };
    } catch (e) {
      this.logger.error('getUser()', { e });
      return { status: 'ERROR' };
    }
  }
}
