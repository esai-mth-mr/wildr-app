import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { Strategy } from 'passport-local';
import { FirebaseAuthService } from './firebase-auth.service';

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(
  Strategy,
  'FirebaseAuth'
) {
  constructor(private firebaseAuthService: FirebaseAuthService) {
    super({ token: ExtractJwt.fromAuthHeaderAsBearerToken });
  }

  validate(token: string): Promise<boolean | undefined> {
    return this.firebaseAuthService.validateToken(token);
  }
}
