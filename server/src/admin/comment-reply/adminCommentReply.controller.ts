import {
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
import { GenericResponse } from '@verdzie/server/admin/common/common.request.response';
import { IsEnum, IsString } from 'class-validator';
import { AdminCommentReplyService } from '@verdzie/server/admin/comment-reply/adminCommentReply.service';

class CommentReplyParam {
  @IsString()
  id: string;
}
export enum CommentOrReply {
  COMMENT = 'COMMENT',
  REPLY = 'REPLY',
}
class GetPostDetailsQuery {
  @IsEnum(CommentOrReply)
  commentOrReply: CommentOrReply;
  @IsString()
  id: string;
}
@Injectable()
@Controller('comment')
export class AdminCommentReplyController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private service: AdminCommentReplyService
  ) {
    this.logger = this.logger.child({ context: 'AdminCommentReplyController' });
  }

  @Put('take-down/:id')
  @UseFilters(new RestApiExceptionFilter())
  async takeDown(@Param('id') id: string): Promise<GenericResponse> {
    this.logger.info('requested PUT admin/comment/take-down', { id });
    const result: boolean = await this.service.takeDownComment(id);
    if (result) return { status: 'OK' };
    return { status: 'ERROR' };
  }

  @Put('respawn/:id')
  @UseFilters(new RestApiExceptionFilter())
  async respawn(@Param('id') id: string): Promise<GenericResponse> {
    this.logger.info('requested PUT admin/comment/respawn', { id });
    const result: boolean = await this.service.respawnComment(id);
    if (result) return { status: 'OK' };
    return { status: 'ERROR' };
  }

  @Put('take-down/reply/:id')
  @UseFilters(new RestApiExceptionFilter())
  async takeDownReply(@Param('id') id: string): Promise<GenericResponse> {
    this.logger.info('requested PUT admin/comment/take-down/reply', { id });
    const result: boolean = await this.service.takeDownReply(id);
    if (result) return { status: 'OK' };
    return { status: 'ERROR' };
  }

  @Put('respawn/reply/:id')
  @UseFilters(new RestApiExceptionFilter())
  async respawnReply(@Param('id') id: string): Promise<GenericResponse> {
    this.logger.info('requested PUT admin/comment/respawn/reply', { id });
    const result: boolean = await this.service.respawnReply(id);
    if (result) return { status: 'OK' };
    return { status: 'ERROR' };
  }
  @Get('post')
  @UseFilters(new RestApiExceptionFilter())
  async getPostId(
    @Query() query: GetPostDetailsQuery
  ): Promise<GenericResponse> {
    this.logger.info('requested PUT admin/post', { query });
    const result = await this.service.getPost(query.commentOrReply, query.id);
    if (result) return { status: 'OK', data: result };
    return { status: 'ERROR' };
  }
  @Get(':id')
  @UseFilters(new RestApiExceptionFilter())
  async getUserFeed(
    @Param() param: CommentReplyParam
  ): Promise<GenericResponse> {
    this.logger.debug('requested USER admin/feed/id', { param });
    try {
      const commentReplies = await this.service.getCommentReplies(param.id);
      return { status: 'OK', data: commentReplies };
    } catch (e) {
      this.logger.error('getUserFeed', { e });
      return { status: 'ERROR' };
    }
  }
}
