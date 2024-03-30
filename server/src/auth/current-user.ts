import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserEntity } from '../user/user.entity';
import { DecodedIdToken } from 'firebase-admin/auth';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserEntity => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  }
);

export const CurrentUID = createParamDecorator(
  (data: unknown, context: ExecutionContext): string => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.uid;
  }
);
export const CurrentEmail = createParamDecorator(
  (data: unknown, context: ExecutionContext): string => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.email;
  }
);

/**
 * Use with `FirebaseJwtSignupGuard` to get the decoded token.
 */
export const CurrentIdToken = createParamDecorator(
  (data: unknown, context: ExecutionContext): DecodedIdToken => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  }
);
