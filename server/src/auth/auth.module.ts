import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import {
  GraphQLExceptionFilter,
  RestApiExceptionFilter,
} from '@verdzie/server/auth/exceptionFilter';
import { FirebaseAuthModule } from '@verdzie/server/firebase-auth/firebase-auth.module';
import { FirebaseJwtStrategy } from '@verdzie/server/auth/firebase.jwt.strategy';
import { FirebaseJwtSignupStrategy } from '@verdzie/server/auth/firebase-jwt-signup.strategy';

@Module({
  imports: [
    FirebaseAuthModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      // signOptions: { expiresIn: '60s' },
    }),
    UserModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    FirebaseJwtStrategy,
    FirebaseJwtSignupStrategy,
    RestApiExceptionFilter,
    GraphQLExceptionFilter,
  ],
  exports: [AuthService],
})
export class AuthModule {}
