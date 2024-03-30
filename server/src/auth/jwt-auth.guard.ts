import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FIREBASE_JWT_STRATEGY_NAME } from '@verdzie/server/auth/firebase.jwt.strategy';
import { JWT_STRATEGY_NAME } from '@verdzie/server/auth/jwt.strategy';

@Injectable()
export class JwtAuthGuard extends AuthGuard([
  JWT_STRATEGY_NAME,
  FIREBASE_JWT_STRATEGY_NAME,
]) {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard([
  JWT_STRATEGY_NAME,
  FIREBASE_JWT_STRATEGY_NAME,
]) {
  // Do not throw an error if a user is not found
  // Overrides handleRequest in: https://github.com/nestjs/passport/blob/master/lib/auth.guard.ts
  handleRequest<UserEntity>(
    _1: any,
    user: UserEntity | false,
    _2: any,
    _3: any,
    _4?: any
  ): UserEntity | undefined {
    if (user === false) return undefined;
    return user;
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
