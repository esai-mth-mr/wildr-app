import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-firebase-jwt';
import { FirebaseAuthService } from '@verdzie/server/firebase-auth/firebase-auth.service';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getLogger } from '@verdzie/server/winstonBeanstalk.module';

export const FIREBASE_JWT_SIGNUP_STRATEGY_NAME =
  'FirebaseJwtSignupStrategyName';

export type FirebaseJWTSignupValidateResult = DecodedIdToken | undefined;

@Injectable()
export class FirebaseJwtSignupStrategy extends PassportStrategy(
  Strategy,
  FIREBASE_JWT_SIGNUP_STRATEGY_NAME
) {
  constructor(private firebaseAuthService: FirebaseAuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(token: string): Promise<FirebaseJWTSignupValidateResult> {
    const decodedIdToken =
      await this.firebaseAuthService.validateTokenAndGetAssociatedAccountDetails(
        token
      );
    if (!decodedIdToken) {
      getLogger().warn('missing or invalid token in signup');
      return;
    }
    return decodedIdToken;
  }
}
