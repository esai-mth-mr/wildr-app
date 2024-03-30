import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { ExtractJwt, Strategy } from 'passport-firebase-jwt';
import { FirebaseAuthService } from '@verdzie/server/firebase-auth/firebase-auth.service';

export const FIREBASE_JWT_STRATEGY_NAME = 'FirebaseJwtStrategyName';

@Injectable()
export class FirebaseJwtStrategy extends PassportStrategy(
  Strategy,
  FIREBASE_JWT_STRATEGY_NAME
) {
  constructor(
    private userService: UserService,
    private firebaseAuthService: FirebaseAuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  // User object returned will be part of request context.
  async validate(token: string): Promise<UserEntity | undefined> {
    return await this.userService.findByFirebaseUid(
      await this.firebaseAuthService.validateFirebaseToken(token)
    );
  }
}
