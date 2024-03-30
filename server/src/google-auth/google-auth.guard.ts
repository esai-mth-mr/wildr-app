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
import { GoogleAuthService } from './google-auth.service';
import { ExtractJwt } from 'passport-jwt';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('WildrGoogleAuth') {
  constructor(
    private service: GoogleAuthService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    super();
    this.logger = this.logger.child({ context: 'GoogleAuthGuard' });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);

    const request = ctx.getContext().req;
    const jwt: string | null =
      ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    if (jwt === null) {
      this.logger.error('JWT is null');
      return false;
    }
    const status = await this.service.validateToken(jwt);

    this.logger.debug('Validated JWT token successfully');

    return status;
  }
}
