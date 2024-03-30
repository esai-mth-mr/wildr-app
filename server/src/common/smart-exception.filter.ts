import { ExceptionFilter, Catch, HttpException } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { Logger } from 'winston';
import { getLogger } from '@verdzie/server/winstonBeanstalk.module';
import {
  WildrException,
  InternalServerErrorException,
} from '../exceptions/wildr.exception';

/**
 * The smart exception filter is a general error handler that can be added to
 * any graphql endpoint to handle general errors. Unknown errors are caught
 * and return a generic error response while HttpException and WildrException
 * messages are returned to the client via a SmartError and logged in a format
 * useful for debugging.
 */
@Catch(Error)
export class SmartExceptionFilter implements ExceptionFilter {
  private logger: Logger;
  constructor() {
    this.logger = getLogger().child({ context: this.constructor.name });
  }

  catch(exception: Error, host: GqlArgumentsHost) {
    const resolverName =
      host?.getArgs()?.[3]?.fieldName || 'smartExceptionFilter';
    let message = 'Oops, something went wrong';

    if (exception instanceof HttpException) {
      this.logger.warn(`[${resolverName}]`, exception);
      message = exception.message;
    } else if (exception instanceof InternalServerErrorException) {
      this.logger.error(
        `[${exception.debugData.methodName}] ${exception.message}`,
        { ...exception.debugData, resolver: resolverName },
        exception
      );
    } else if (exception instanceof WildrException) {
      this.logger.warn(
        `[${exception.debugData.methodName}] ${exception.message}`,
        { ...exception.debugData, resolver: resolverName },
        exception
      );
      message = exception.message;
    } else {
      this.logger.error(`[${resolverName}] ${exception}`, exception);
    }

    return {
      __typename: 'SmartError',
      message,
    };
  }
}
