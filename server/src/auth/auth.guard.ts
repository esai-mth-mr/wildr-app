import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class GqlAuthGuard extends AuthGuard('WildrLocalAuth') {
  @Inject(WINSTON_MODULE_PROVIDER)
  private readonly logger: Logger;

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    return {
      ...request,
      body: {
        ...request.body,
        username: request.body.variables.username,
        password: request.body.variables.password,
      },
    };
  }
  // TODO set the right types
  handleRequest(err: any, user: any, info: any) {
    // You can throw an exception based on either "info" or "err" arguments
    this.logger.debug('handleRequest user=', JSON.stringify(user));
    this.logger.debug('handleRequest info=', JSON.stringify(info));
    if (err || !user) {
      this.logger.warn('No user found, returning error', {
        err: err,
        user: user,
        info: info,
      });
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
