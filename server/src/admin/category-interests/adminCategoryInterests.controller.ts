import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Injectable,
  Param,
  Put,
  UseFilters,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AdminCategoryInterestsService } from '@verdzie/server/admin/category-interests/adminCategoryInterests.service';
import { RestApiExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import { GenericResponse } from '@verdzie/server/admin/common/common.request.response';
import { IsEnum, IsString } from 'class-validator';
import { PostCategoryType } from '@verdzie/server/post-category/postCategory.entity';

export class CreateCategoryBody {
  @IsString()
  name: string;
  @IsEnum(PostCategoryType)
  type: PostCategoryType;
}

@Injectable()
@Controller('category-interests')
export class AdminCategoryInterestsController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private adminCategoryInterestsService: AdminCategoryInterestsService
  ) {
    this.logger = this.logger.child({
      context: 'AdminCategoryInterestsController',
    });
  }

  @Get()
  @UseFilters(new RestApiExceptionFilter())
  async getCategories(): Promise<GenericResponse> {
    this.logger.debug('requested Get admin/category-interests', {});
    return {
      status: 'OK',
      data: await this.adminCategoryInterestsService.getCategories(),
    };
  }

  @Put()
  @UseFilters(new RestApiExceptionFilter())
  async addCategory(
    @Body() request: CreateCategoryBody
  ): Promise<GenericResponse> {
    this.logger.debug('requested PUT admin/category-interests', {});
    const res = await this.adminCategoryInterestsService.addCategory(request);
    return {
      status: res ? 'OK' : 'ERROR',
      message: res ? `Added ${request.name}` : `Already exists`,
    };
  }

  @Delete(':category')
  @UseFilters(new RestApiExceptionFilter())
  async deleteCategory(
    @Param() request: CreateCategoryBody
  ): Promise<GenericResponse> {
    this.logger.debug('requested DELETE admin/category-interests', {});
    const res = this.adminCategoryInterestsService.deleteCategory(request.name);
    return {
      status: res ? 'OK' : 'ERROR',
      message: res ? `Deleted ${request.name}` : `Doesn't exists`,
    };
  }
}
