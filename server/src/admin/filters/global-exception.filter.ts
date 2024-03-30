import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

@Catch(Error)
export class GenericExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message || 'Internal server error';
    response.status(500).json({
      statusCode: response.status || 500,
      message,
      // @ts-ignore
      ...(exception.response && exception.response),
    });
  }
}
