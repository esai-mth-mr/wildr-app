import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'LoggerMiddleware' });
  }

  use(req: Request, _1: Response, next: NextFunction) {
    const headers = { ...req.headers };
    headers.authorization = undefined;
    const variables = { ...req.body.variables };
    if (variables.password) variables.password = '<redacted>';
    if (variables.username) variables.username = '<redacted>';
    if (process.env.LOG_REQUEST === 'true') {
      this.logger.debug('Received HTTP Request body, variables: ', {
        userId: headers.user_id,
        variables,
        operationName: req.body.operationName,
      });
    }
    next();
  }
}
