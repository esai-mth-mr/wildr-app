import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { FirebaseAuthService } from './firebase-auth.service';
import { ExtractJwt } from 'passport-jwt';

@Injectable()
export class FirebaseAuthGuard extends AuthGuard('WildrFirebaseAuth') {
  constructor(
    private firebaseAuthService: FirebaseAuthService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    super();
    this.logger = this.logger.child({ context: this.constructor.name });
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
    const user =
      await this.firebaseAuthService.validateTokenAndGetAssociatedAccountDetails(
        jwt
      );
    if (!user) {
      return false;
    }
    request.uid = user.uid;
    request.email = user.email;

    this.logger.debug('Validated jwt token successfully', {
      uid: request.uid,
    });

    return true;
  }
}
