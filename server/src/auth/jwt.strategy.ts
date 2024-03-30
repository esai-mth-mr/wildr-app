import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Inject } from '@nestjs/common';
import { jwtConstants } from './constants';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserEntity, UserJwtToken } from '../user/user.entity';
import { UserService } from '../user/user.service';

export const JWT_STRATEGY_NAME = 'JwtStrategyName';

/**
 * @deprecated PLEASE USE FIREBASE FOR USER AUTHENTICATION. This method is only
 * used for local development and may potentially be used for admin.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  @Inject(WINSTON_MODULE_PROVIDER)
  private readonly logger: Logger;

  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  // User object returned will be part of request context.
  async validate(payload: UserJwtToken): Promise<UserEntity | undefined> {
    const user = await this.userService.findById(payload.id);
    if (!user)
      this.logger.error('JwtStrategy was not able to validate', { payload });
    return user;
  }
}
