import {
  Controller,
  Get,
  Inject,
  Query,
  Injectable,
  UseFilters,
  Put,
  Body,
  Post,
  Param,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AdminPostService } from '@verdzie/server/admin/post/adminPost.service';
import { RestApiExceptionFilter } from '@verdzie/server/auth/exceptionFilter';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { GenericResponse } from '@verdzie/server/admin/common/common.request.response';
import { Type } from 'class-transformer';
import {
  PostSearchResponseDTO,
  PostSearchResponsePost,
} from '@verdzie/server/admin/post/dto/post-search-response.dto';
import { PostSearchBodyDTO } from '@verdzie/server/admin/post/dto/post-search-body.dto';
export enum SensitiveStatus {
  NSFW = 'NSFW',
}
class AddPostCategories {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  categories: string[];
  @IsString()
  postId: string;
}

class GetPostParams {
  @IsString()
  date: string;
  @IsString()
  limit: number;
  @IsString()
  parseUrls: string;
}

class GetUnannotatedPostParams {
  @IsString()
  date: string;
  @IsString()
  limit: number;
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip: number;
}

class ChangeSensitiveStatusBody {
  @IsString()
  postId: string;
  @IsEnum(SensitiveStatus)
  @IsOptional()
  status?: SensitiveStatus;
}

@Injectable()
@Controller('post')
export class AdminPostController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private adminPostService: AdminPostService
  ) {
    this.logger = this.logger.child({ context: 'AdminPostController' });
  }

  @Get()
  @UseFilters(new RestApiExceptionFilter())
  async getPosts(@Query() query: GetPostParams): Promise<GenericResponse> {
    this.logger.debug('requested GET admin/post/', { query });
    const parseUrls = query.parseUrls === 'true';
    this.logger.debug('requested GET admin/post/', { query });
    try {
      return {
        status: 'OK',
        data: await this.adminPostService.getPosts(
          query.date,
          query.limit,
          parseUrls
        ),
      };
    } catch (e) {
      this.logger.error('getPost()', { e });
      return { status: 'ERROR' };
    }
  }

  @Get('unannotated')
  @UseFilters(new RestApiExceptionFilter())
  async getUnannotatedPosts(
    @Query() query: GetUnannotatedPostParams
  ): Promise<GenericResponse> {
    this.logger.debug('requested GET admin/post/unannotated', { query });
    try {
      return {
        status: 'OK',
        data: await this.adminPostService.getUnannotatedPosts(
          query.date,
          query.limit,
          query.skip
        ),
      };
    } catch (error) {
      this.logger.error('Error getting unannotated posts', {
        error,
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown';
      return {
        status: 'ERROR',
        errorMessage,
      };
    }
  }

  @Post('category')
  @UseFilters(new RestApiExceptionFilter())
  async addCategory(@Body() body: AddPostCategories): Promise<GenericResponse> {
    this.logger.debug('requested POST admin/post/category', { body });
    const errorMessage = await this.adminPostService.addCategories(
      body.postId,
      body.categories
    );
    if (errorMessage) return { status: 'ERROR', errorMessage };
    return { status: 'OK' };
  }

  @Put('take-down/:id')
  @UseFilters(new RestApiExceptionFilter())
  async takeDown(@Param('id') id: string): Promise<GenericResponse> {
    this.logger.info('requested PUT admin/post/take-down', { id });
    const result: boolean = await this.adminPostService.takeDown(id);
    if (result) return { status: 'OK' };
    return { status: 'ERROR' };
  }

  @Put('respawn/:id')
  @UseFilters(new RestApiExceptionFilter())
  async respawn(@Param('id') id: string): Promise<GenericResponse> {
    this.logger.info('requested PUT admin/post/respawn', { id });
    const result: boolean = await this.adminPostService.respawn(id);
    if (result) return { status: 'OK' };
    return { status: 'ERROR' };
  }

  @Put()
  @UseFilters(new RestApiExceptionFilter())
  async updatePost(@Body() body: any): Promise<GenericResponse> {
    this.logger.debug('requested PUT admin/post', { body });
    const response = await this.adminPostService.updatePost(body.id, body.data);
    return { status: response.affected === 1 ? 'OK' : 'ERROR' };
  }

  @Put('sensitive')
  @UseFilters(new RestApiExceptionFilter())
  async changeSensitiveStatus(
    @Body() body: ChangeSensitiveStatusBody
  ): Promise<GenericResponse> {
    this.logger.info('requested PUT admin/post/respawn', { body });
    const result: boolean = await this.adminPostService.addSensitiveStatus(
      body.postId,
      body.status
    );
    if (result) return { status: 'OK' };
    return { status: 'ERROR' };
  }

  @Post('search')
  async searchPosts(
    @Body() body: PostSearchBodyDTO
  ): Promise<PostSearchResponseDTO> {
    const searchPostsResponse = await this.adminPostService.searchPosts({
      queryString: body.searchQuery,
    });
    if (searchPostsResponse.isErr()) throw searchPostsResponse.error;
    return new PostSearchResponseDTO(
      searchPostsResponse.value.map(postAuthorPair => {
        return new PostSearchResponsePost({ ...postAuthorPair });
      })
    );
  }
}
