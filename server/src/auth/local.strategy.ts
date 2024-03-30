import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Inject } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(
  Strategy,
  'WildrLocalAuth'
) {
  @Inject(WINSTON_MODULE_PROVIDER)
  private readonly logger: Logger;

  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<UserEntity> {
    const user = await this.authService.validateUser(username, password);
    if (user === null) {
      this.logger.error('Unauthorized, user is null');
      throw new UnauthorizedException();
    }
    return user;
  }
}
