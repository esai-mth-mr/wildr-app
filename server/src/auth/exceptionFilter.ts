import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { ValidationException } from '../exceptions/ValidationException';
import { Logger } from 'winston';
import { Response } from 'express';
import { getLogger } from '@verdzie/server/winstonBeanstalk.module';

@Catch(HttpException)
export class GraphQLExceptionFilter implements ExceptionFilter {
  private logger: Logger;
  constructor() {
    this.logger = getLogger().child({ context: this.constructor.name });
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    this.logger.error('Unhandled Exception', {
      error: exception,
      methodName: 'catch',
      context: 'GraphQLExceptionFilter',
    });
    if (exception.getStatus() === 401) {
      throw new UnauthorizedException(exception.message);
    }
    throw exception;
  }
}
@Catch(ValidationException)
export class RestApiExceptionFilter implements ExceptionFilter {
  private logger: Logger;

  constructor() {
    this.logger = getLogger().child({ context: this.constructor.name });
  }

  catch(exception: ValidationException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(400).json(exception.errors);
  }
}
