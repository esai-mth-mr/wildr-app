import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import {
  FIREBASE_JWT_SIGNUP_STRATEGY_NAME,
  FirebaseJWTSignupValidateResult,
} from '@verdzie/server/auth/firebase-jwt-signup.strategy';
import { getLogger } from '@verdzie/server/winstonBeanstalk.module';

@Injectable()
export class SignupFirebaseJwtAuthGuard extends AuthGuard([
  FIREBASE_JWT_SIGNUP_STRATEGY_NAME,
]) {
  handleRequest<R = FirebaseJWTSignupValidateResult>(
    err: any,
    result: R,
    info: any,
    context: ExecutionContext,
    status?: any
  ) {
    if (!result) {
      getLogger().warn('missing or invalid signup verification result');
      return;
    }
    return result;
  }

  getRequest(context: ExecutionContext) {
    if (!context) {
      getLogger().warn('missing ExecutionContext context in signup auth guard');
      return;
    }
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
